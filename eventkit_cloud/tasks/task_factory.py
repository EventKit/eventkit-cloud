# -*- coding: utf-8 -*-
from __future__ import absolute_import

from datetime import datetime, timedelta
import logging
import os
import itertools

from django.conf import settings
from django.db import DatabaseError, transaction
from django.utils import timezone

from celery import chain

from eventkit_cloud.tasks.export_tasks import (zip_export_provider, finalize_run_task,
                                               prepare_for_export_zip_task,
                                               zip_file_task,
                                               output_selection_geojson_task)

from ..jobs.models import Job
from ..ui.helpers import get_style_files
from ..tasks.export_tasks import (finalize_export_provider_task, TaskPriority,
                                  wait_for_providers_task, TaskStates)

from ..tasks.models import ExportRun, DataProviderTaskRecord
from ..tasks.task_runners import create_export_task_record
from .task_runners import (
    ExportOSMTaskRunner,
    ExportWFSTaskRunner,
    ExportWCSTaskRunner,
    ExportExternalRasterServiceTaskRunner,
    ExportArcGISFeatureServiceTaskRunner
)


# Get an instance of a logger
logger = logging.getLogger(__name__)


class TaskFactory:
    """
    A class create Task Runners based on an Export Run.
    """

    def __init__(self,):
        self.type_task_map = {'osm': ExportOSMTaskRunner,
                              'wfs': ExportWFSTaskRunner,
                              'wms': ExportExternalRasterServiceTaskRunner,
                              'wcs': ExportWCSTaskRunner,
                              'wmts': ExportExternalRasterServiceTaskRunner,
                              'arcgis-raster': ExportExternalRasterServiceTaskRunner,
                              'arcgis-feature': ExportArcGISFeatureServiceTaskRunner}

    def parse_tasks(self, worker=None, run_uid=None, user_details=None):
        """
        This handles all of the logic for taking the information about what individual celery tasks and groups them under
        specific providers.

        Each Provider (e.g. OSM) gets a chain:  OSM_TASK -> FORMAT_TASKS = PROVIDER_SUBTASK_CHAIN
        They need to be finalized (was the task successful?) to update the database state:
            PROVIDER_SUBTASK_CHAIN -> FINALIZE_PROVIDER_TASK

        We also have an optional chain of tasks that get processed after the providers are run:
            AD_HOC_TASK1 -> AD_HOC_TASK2 -> FINALIZE_RUN_TASK = FINALIZE_RUN_TASK_COLLECTION

        If the PROVIDER_SUBTASK_CHAIN fails it needs to be cleaned up.  The clean up task also calls the finalize provider
        task. This is because when a task fails the failed task will call an on_error (link_error) task and never return.
            PROVIDER_SUBTASK_CHAIN -> FINALIZE_PROVIDER_TASK
                   |
                   v
                CLEAN_UP_FAILURE_TASK -> FINALIZE_PROVIDER_TASK

        Now there needs to be someway for the finalize tasks to be called.  Since we now have several a possible forked path,
        we need each path to check the state of the providers to see if they are all finished before moving on.
        It would be great if celery would implicitly handled that, but it doesn't ever merge the forked paths.
        So we add a WAIT_FOR_PROVIDERS task to check state once the providers are ready they call the final tasks.

        PROVIDER_SUBTASK_CHAIN -> FINALIZE_PROVIDER_TASK -> WAIT_FOR_PROVIDERS   \
                   |                                                              ==> FINALIZE_RUN_TASK_COLLECTION
                   v                                                             /
            CLEAN_UP_FAILURE_TASK -> FINALIZE_PROVIDER_TASK -> WAIT_FOR_PROVIDERS


        :param worker: A worker node (hostname) for a celery worker, this should match the node name used when starting,
         the celery worker.
        :param run_uid: A uid to reference an ExportRun.
        :return: The AsyncResult from the celery chain of all tasks for this run.
        """
        # This is just to make it easier to trace when user_details haven't been sent
        if user_details is None:
            user_details = {'username': 'TaskFactory-parse_tasks'}

        if run_uid:
            run = ExportRun.objects.get(uid=run_uid)
            job = run.job
            run_dir = os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(run.uid))
            os.makedirs(run_dir, 0750)

            finalize_task_settings = {
                'interval': 4, 'max_retries': 10, 'queue': worker, 'routing_key': worker,
                'priority': TaskPriority.FINALIZE_RUN.value}

            for provider_task_record in job.provider_tasks.all():

                # Create an instance of a task runner based on the type name
                if self.type_task_map.get(provider_task_record.provider.export_provider_type.type_name):
                    type_name = provider_task_record.provider.export_provider_type.type_name
                    task_runner = self.type_task_map.get(type_name)()
                    os.makedirs(os.path.join(run_dir, provider_task_record.provider.slug), 6600)
                    stage_dir = os.path.join(
                                run_dir,
                                provider_task_record.provider.slug)

                    args = {
                        'user': job.user,
                        'provider_task_uid': provider_task_record.uid,
                        'run': run,
                        'stage_dir': stage_dir,
                        'service_type': provider_task_record.provider.export_provider_type.type_name,
                        'worker': worker,
                        'user_details': user_details
                    }

                    provider_task_uid, provider_subtask_chain = task_runner.run_task(**args)

                    wait_for_providers_signature = wait_for_providers_task.s(
                        run_uid=run_uid,
                        locking_task_key=run_uid,
                        callback_task=create_finalize_run_task_collection(run_uid, run_dir, worker, apply_args=finalize_task_settings),
                        apply_args=finalize_task_settings).set(**finalize_task_settings)

                    if provider_subtask_chain:
                        # The finalize_export_provider_task will check all of the export tasks
                        # for this provider and save the export provider's status.

                        selection_task = create_task(
                            export_provider_task_uid=provider_task_uid,
                            stage_dir=stage_dir,
                            worker=worker,
                            task=output_selection_geojson_task,
                            selection=job.the_geom.geojson,
                            user_details=user_details
                        )

                        clean_up_task_chain = chain(
                            finalize_export_provider_task.si(
                                export_provider_task_uid=provider_task_uid,
                                status=TaskStates.INCOMPLETE.value,
                                locking_task_key=run_uid).set(**finalize_task_settings),
                            wait_for_providers_signature
                        )

                        # add clean up to subtask(s)
                        if hasattr(provider_subtask_chain, "tasks"):
                            for task in provider_subtask_chain.tasks:
                                task.on_error(clean_up_task_chain)
                        else:
                            provider_subtask_chain.on_error(clean_up_task_chain)

                        # create signature to close out the provider tasks
                        finalize_export_provider_signature = finalize_export_provider_task.s(
                            export_provider_task_uid=provider_task_uid,
                            status=TaskStates.COMPLETED.value,
                            locking_task_key=run_uid
                        )

                        # add zip if required
                        if provider_task_record.provider.zip:
                            zip_export_provider_sig = get_zip_task_chain(export_provider_task_uid=provider_task_uid,
                                                                         stage_dir=stage_dir, worker=worker,
                                                                         job_name=run.job.name)
                            provider_subtask_chain = chain(
                                provider_subtask_chain, zip_export_provider_sig
                            )

                        finalized_provider_task_chain = chain(
                            selection_task,
                            provider_subtask_chain,
                            finalize_export_provider_signature,
                            wait_for_providers_signature
                        )

                        finalized_provider_task_chain.apply_async(**finalize_task_settings)


@transaction.atomic
def create_run(job_uid, user=None):
    """
    This will create a new Run based on the provided job uid.
    :param job_uid: The UID to reference the Job model.
    :return: An ExportRun object.
    """

    # start the run
    try:
        # https://docs.djangoproject.com/en/1.10/topics/db/transactions/#django.db.transaction.atomic
        # enforce max runs
        with transaction.atomic():
            max_runs = settings.EXPORT_MAX_RUNS
            # get the number of existing runs for this job
            job = Job.objects.get(uid=job_uid)
            invalid_licenses = get_invalid_licenses(job)
            if invalid_licenses:
                raise InvalidLicense("The user: {0} has not agreed to the following licenses: {1}.\n" \
                            "Please use the user account page, or the user api to agree to the " \
                            "licenses prior to exporting the data.".format(job.user.username, invalid_licenses))
            if not user:
                user = job.user
            if job.user != user and not user.is_superuser:
                raise Unauthorized("The user: {0} is not authorized to create a run based on the job: {1}.".format(
                    job.user.username, job.name
                ))
            run_count = job.runs.count()
            if run_count > 0:
                while run_count > max_runs - 1:
                    # delete the earliest runs
                    job.runs.earliest(field_name='started_at').soft_delete(user=user)  # delete earliest
                    run_count -= 1
            # add the export run to the database
            run = ExportRun.objects.create(job=job, user=user, status='SUBMITTED',
                                           expiration=(timezone.now() + timezone.timedelta(days=14)))  # persist the run
            run_uid = run.uid
            logger.debug('Saved run with id: {0}'.format(str(run_uid)))
            return run_uid
    except DatabaseError as e:
        logger.error('Error saving export run: {0}'.format(e))
        raise e


def create_task(export_provider_task_uid=None, stage_dir=None, worker=None, selection=None, task=None,
                job_name=None, user_details=None):
    """
    Create a new task to export the bounds for an DataProviderTaskRecord
    :param export_provider_task_uid: An export provider task UUID.
    :param worker: The name of the celery worker assigned the task.
    :return: A celery task signature.
    """
    # This is just to make it easier to trace when user_details haven't been sent
    if user_details is None:
        user_details = {'username': 'unknown-create_task'}

    export_provider_task = DataProviderTaskRecord.objects.get(uid=export_provider_task_uid)
    export_task = create_export_task_record(
        task_name=task.name, export_provider_task=export_provider_task, worker=worker,
        display=getattr(task, "display", False)
    )
    return task.s(
        run_uid=export_provider_task.run.uid, task_uid=export_task.uid, selection=selection, stage_dir=stage_dir,
        provider_slug=export_provider_task.slug, export_provider_task_uid=export_provider_task_uid, job_name=job_name,
        user_details=user_details, bbox=export_provider_task.run.job.extents, locking_task_key=export_provider_task_uid
    ).set(queue=worker, routing_key=worker)


def get_zip_task_chain(export_provider_task_uid=None, stage_dir=None, worker=None, job_name=None):
    return chain(
        #create_task(export_provider_task_uid=export_provider_task_uid, stage_dir=stage_dir, worker=worker,
        #            task=bounds_export_task, job_name=job_name),
        create_task(export_provider_task_uid=export_provider_task_uid, stage_dir=stage_dir, worker=worker,
                    task=zip_export_provider, job_name=job_name)
    )

def get_invalid_licenses(job, user=None):
    """
    :param user: A user to verify licenses against.
    :param job: The job containing the licensed datasets.
    :return: A list of invalid licenses.
    """
    from ..api.serializers import UserDataSerializer
    user = user or job.user
    licenses = UserDataSerializer.get_accepted_licenses(user)
    invalid_licenses = []
    for provider_tasks in job.provider_tasks.all():
        license = provider_tasks.provider.license
        if license and not licenses.get(license.slug):
            invalid_licenses += [license.name]
    return invalid_licenses


class Error(Exception):
    def __init__(self, message):
        super(Exception, self).__init__(message)

class Unauthorized(Error):
    def __init__(self, message):
        super(Error, self).__init__('Unauthorized: {0}'.format(message))

class InvalidLicense(Error):
    def __init__(self, message):
        super(Error, self).__init__('InvalidLicense: {0}'.format(message))


def create_finalize_run_task_collection(run_uid=None, run_dir=None, worker=None, apply_args=None):
    """ Returns a 2-tuple celery chain of tasks that need to be executed after all of the export providers in a run
        have finished, and a finalize_run_task signature for use as an errback.
        Add any additional tasks you want in hook_tasks.
        @see export_tasks.FinalizeRunHookTask for expected hook task signature.
    """
    apply_args = apply_args or dict()

    # These should be subclassed from FinalizeRunHookTask
    hook_tasks = []
    hook_task_sigs = []
    if len(hook_tasks) > 0:
        # When the resulting chain is made part of a bigger chain, we don't want the result of the previous
        #    link getting passed to the first hook task
        hook_task_sigs.append(hook_tasks[0].si([], run_uid=run_uid).set(**apply_args))
        hook_task_sigs.extend(
            [hook_task.s(run_uid=run_uid).set(**apply_args) for hook_task in hook_tasks[1:]]
        )

    prepare_zip_sigature = prepare_for_export_zip_task.s(run_uid=run_uid).set(**apply_args)

    zip_task_signature = zip_file_task.s(run_uid=run_uid, static_files=get_style_files()).set(**apply_args)

    # Use .si() to ignore the result of previous tasks, we just care that finalize_run_task runs last
    finalize_signature = finalize_run_task.si(run_uid=run_uid, stage_dir=run_dir).set(**apply_args)

    all_task_sigs = itertools.chain(hook_task_sigs, [prepare_zip_sigature, zip_task_signature, finalize_signature])

    finalize_chain = chain(*all_task_sigs)

    return finalize_chain
