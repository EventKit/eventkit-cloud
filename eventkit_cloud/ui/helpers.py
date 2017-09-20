from __future__ import absolute_import

from contextlib import contextmanager
import os

from django.conf import settings
from django.utils import timezone
from django.template.loader import get_template, render_to_string

from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)


@contextmanager
def cd(newdir):
    prevdir = os.getcwd()
    os.chdir(newdir)
    try:
        yield
    finally:
        os.chdir(prevdir)


def get_style_files():
    """

    :return: A list of all of the static files used for styles (e.g. icons)
    """
    style_dir = os.path.join(os.path.dirname(__file__), 'static', 'ui', 'styles')
    return get_file_paths(style_dir)


def generate_qgs_style(run_uid=None, export_provider_task=None):
    """
    Task to create QGIS project file with styles for osm.
    """
    from eventkit_cloud.tasks.models import ExportRun
    from ..tasks.export_tasks import TaskStates
    from ..tasks.task_runners import normalize_name
    run = ExportRun.objects.get(uid=run_uid)
    stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(run_uid))

    job_name = run.job.name.lower()

    provider_tasks = run.provider_tasks.all()

    provider_details = []
    if export_provider_task:
        provider_slug = export_provider_task.slug
        provider_detail = {'provider_slug': provider_slug, 'file_path': ''}
        provider_details += [provider_detail]
    else:
        for provider_task in provider_tasks:
            if TaskStates[provider_task.status] not in TaskStates.get_incomplete_states():
                provider_slug = provider_task.slug
                for export_task in provider_task.tasks.all():
                    try:
                        filename = export_task.result.filename
                    except Exception:
                        continue
                    full_file_path = os.path.join(settings.EXPORT_STAGING_ROOT, str(run_uid),
                                                  provider_task.slug, filename)
                    if not os.path.isfile(full_file_path):
                        logger.error("Could not find file {0} for export {1}.".format(full_file_path,
                                                                                      export_task.name))
                        continue
                    # Exclude zip files created by zip_export_provider
                    if not full_file_path.endswith(".zip"):
                        provider_detail = {'provider_slug': provider_slug, 'file_path': full_file_path}
                        provider_details += [provider_detail]

    style_file = os.path.join(stage_dir, '{0}-{1}.qgs'.format(normalize_name(job_name),
                                                              timezone.now().strftime("%Y%m%d")))

    with open(style_file, 'w') as open_file:
        open_file.write(render_to_string('styles/Style.qgs', context={'job_name': normalize_name(job_name),
                                                                      'job_date_time': '{0}'.format(
                                                                          timezone.now().strftime("%Y%m%d%H%M%S%f")[
                                                                          :-3]),
                                                                      'provider_details': provider_details,
                                                                      'bbox': run.job.extents}))
    return style_file


def get_file_paths(directory):
    paths = {}
    with cd(directory):
        for dirpath, _, filenames in os.walk('./'):
            for f in filenames:
                paths[os.path.abspath(os.path.join(dirpath, f))] = os.path.join(dirpath, f)
    return paths
