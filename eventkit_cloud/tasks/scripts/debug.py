from __future__ import absolute_import

# from ...celery import app
from celery import chain, group, chord
from datetime import datetime, timedelta
from ..export_tasks import ExportTask
from time import sleep
import socket


class TestTask(ExportTask):
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


class FinalTask(TestTask):
    def run(self, job_num=None, task_num=None, result=None):
        print("ALL TASKS HAVE RAN AND CLEANUP HAS OCCURED.".format(task_num))


class PickUpJobTask(TestTask):
    def run(self, job_num=None):
        worker = socket.gethostname()
        print("AssignTask picked up by {0} running job {1}".format(worker, job_num))
        create_task_factory(worker, job_num)


def create_task_factory(name, job_num):
    run_1 = chain(ExampleTask().si(job_num=job_num, task_num=1, result="File1").set(queue=name),
                  ExampleTask().si(job_num=job_num, task_num=2, result="File2").set(queue=name),
                  ExampleTask().si(job_num=job_num, task_num=3, result="File3").set(queue=name),
                  ExampleTask().si(job_num=job_num, task_num=4, result="File4").set(queue=name),
                  ExampleTask().si(job_num=job_num, task_num=5, result="File5").set(queue=name))
    run_2 = ExampleTask().si(job_num=job_num, task_num=6, result="File6").set(queue=name)
    run_3 = ExampleTask().si(job_num=job_num, task_num=7, result="File7").set(queue=name)

    return chord(group([run_1, run_2, run_3]),
                 body=FinalTask().si(job_num=job_num, task_num=8, result="File8").set(queue=name,
                     link_error=[FinalTask().si().set(queue=name)])).apply_async(
        expires=datetime.now() + timedelta(days=1))


def run_chain():
    PickUpJobTask().si(job_num=1).apply_async()
    PickUpJobTask().si(job_num=2).apply_async()
    PickUpJobTask().si(job_num=3).apply_async()
    PickUpJobTask().si(job_num=4).apply_async()
