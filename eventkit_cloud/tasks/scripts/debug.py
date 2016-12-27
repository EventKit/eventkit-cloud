from __future__ import absolute_import

# from ...celery import app
from celery import chain, group, chord
from datetime import datetime, timedelta
from ..export_tasks import ExportTask
from time import sleep
import socket
from django.db import connection


class TestTask(ExportTask):
    def run(self, *args, **kwargs):
        super(TestTask, self).run(*args, **kwargs)

    def on_success(self, retval, task_id, args, kwargs):
        print("SUCCESS FOR {0}".format(task_id))

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        print("FAILURE FOR {0}".format(task_id))


class ExampleTask(TestTask):
    def run(self, job_num=None, task_num=None, result=None):
        print("RUNNING TASK {0}.{1}".format(job_num, task_num))
        sleep(1)
        return {'result': result}


class FailureTask(TestTask):
    def run(self, job_num=None, task_num=None, result=None):
        print("RUNNING TASK {0}.{1}".format(job_num, task_num))
        raise Exception("TASK {0}.{1} HAS FAILED".format(job_num, task_num))
        return {'result': result}


class FinalProviderTask(TestTask):
    def run(self, job_num=None, task_num=None, result=None):
        print("ALL TASKS HAVE RAN.".format(task_num))


class FinalTask(TestTask):
    def run(self, job_num=None, task_num=None, result=None):
        print("ALL PROVIDERS HAVE RAN AND CLEANUP HAS OCCURED.".format(task_num))


class PickUpJobTask(TestTask):
    def run(self, job_num=None):
        worker = socket.gethostname()
        print("AssignTask picked up by {0} running job {1}".format(worker, job_num))
        create_task_factory(worker, job_num)


def create_task_factory(worker_name, job_num):
    provider_1 = (ExampleTask().si(job_num=job_num, task_num=1, result="File1").set(queue=worker_name) |
                  ExampleTask().si(job_num=job_num, task_num=2, result="File2").set(queue=worker_name) |
                  ExampleTask().si(job_num=job_num, task_num=3, result="File3").set(queue=worker_name) |
                  FailureTask().si(job_num=job_num, task_num=4, result="File4").set(queue=worker_name) |
                  ExampleTask().si(job_num=job_num, task_num=5, result="File5").set(queue=worker_name))
    provider_2 = ExampleTask().si(job_num=job_num, task_num=6, result="File6").set(queue=worker_name)
    provider_3 = ExampleTask().si(job_num=job_num, task_num=7, result="File7").set(queue=worker_name)

    return chord(group([provider_1, provider_2, provider_3]),
                 body=FinalTask().si(job_num=job_num, task_num=8, result="File8").set(queue=worker_name,
                                                                                      link_error=[FinalTask().si().set(
                                                                                          queue=worker_name
                                                                                          )])).apply_async(
        expires=datetime.now() + timedelta(days=1))


def run_chain():
    PickUpJobTask().delay(job_num=1)


# def create_run(status="SUBMITTED"):
#     from ..models import ExportRun
#     return ExportRun.objects.create(status=status)
#
#
# def create_provider_task(run_uid, status="PENDING"):
#     from ..models import ExportProviderTask, ExportRun
#     if not run_uid:
#         print("create_provider_task needs a run_uid")
#     run = ExportRun.objects.get(uid=run_uid)
#     return ExportProviderTask.objects.create(run=run, status=status)
#
#
# def create_task(provider_task_uid, name, status="PENDING"):
#     from ..models import ExportTask, ExportProviderTask, ExportRun
#     export_provider_task = ExportProviderTask.objects.get(provider_task_uid=provider_task_uid)
#     return ExportTask.object.create(name=name, status=status)