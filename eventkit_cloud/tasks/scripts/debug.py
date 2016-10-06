from __future__ import absolute_import

# from ...celery import app
from celery import chain, group, chord
from datetime import datetime, timedelta
from ..export_tasks import ExportTask


class TestTask(ExportTask):
    def on_success(self, retval, task_id, args, kwargs):
        print("SUCCESS FOR {0}".format(task_id))

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        print("FAILURE FOR {0}".format(task_id))


class ExampleTask(TestTask):
    def run(self, task_num=None, result=None):
        print("RUNNING TASK {0}".format(task_num))
        return {'result': result}


class FailureTask(TestTask):
    def run(self, task_num=None, result=None):
        print("RUNNING TASK {0}".format(task_num))
        raise Exception("TASK {0} HAS FAILED".format(task_num))
        return {'result': result}


class FinalTask(TestTask):
    def run(self, task_num=None, result=None):
        print("ALL TASKS HAVE RAN AND CLEANUP HAS OCCURED.".format(task_num))


def run_chain():
    list = [ExampleTask().si(task_num=1, result="File1"),
            ExampleTask().si(task_num=2, result="File2"),
            ExampleTask().si(task_num=3, result="File3"),
            ExampleTask().si(task_num=4, result="File4"),
            ExampleTask().si(task_num=5, result="File5")]
    run_2 = FailureTask().si(task_num=6, result="File6")
    run_3 = ExampleTask().si(task_num=7, result="File7")

    chord(group([chain(list), run_2, run_3]),
          body=FinalTask().si(task_num=8, result="File8").set(link_error=[FinalTask().si()])).apply_async(
        expires=datetime.now() + timedelta(days=1))
