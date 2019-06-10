

import socket
from datetime import datetime, timedelta
from time import sleep

# from eventkit_cloud.celery import app
from celery import task, Task


class TestTask(Task):
    def run(self, *args, **kwargs):
        super(TestTask, self).run(*args, **kwargs)

    def on_success(self, retval, task_id, args, kwargs):
        print(("SUCCESS FOR {0}".format(task_id)))

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        print(("FAILURE FOR {0}".format(task_id)))


@task(base=TestTask)
def example_task(result=None, job_num=None, task_num=None):
    print(("RUNNING TASK {0}.{1}".format(job_num, task_num)))
    sleep(1)
    return {'result': result}


@task(base=TestTask)
def failure_task(result=None, job_num=None, task_num=None):
    print(("RUNNING TASK {0}.{1}".format(job_num, task_num)))
    raise Exception("TASK {0}.{1} HAS FAILED".format(job_num, task_num))
    return {'result': result}


@task(base=TestTask)
def final_provider_task(result=None, job_num=None, provider_name=None):
    print(("ALL TASKS FOR JOB {0} PROVIDER {1} HAVE RAN.".format(job_num, provider_name)))


@task(base=TestTask)
def final_task(result=None, job_num=None, task_num=None):
    print(("ALL PROVIDERS HAVE RAN AND CLEANUP HAS OCCURED.".format(task_num)))


@task(base=TestTask)
def pick_up_job_task(job_num=None):
    worker = socket.gethostname()
    print(("AssignTask picked up by {0} running job {1}".format(worker, job_num)))
    create_task_factory(worker, job_num)


@task(base=TestTask)
def create_task_factory(worker_name, job_num):
    provider_1 = (example_task.si(job_num=job_num, task_num=1, result="File1").set(routing_key=worker_name, queue=worker_name) |
                  example_task.si(job_num=job_num, task_num=2, result="File2").set(routing_key=worker_name, queue=worker_name) |
                  example_task.si(job_num=job_num, task_num=3, result="File3").set(routing_key=worker_name, queue=worker_name) |
                  example_task.si(job_num=job_num, task_num=4, result="File4").set(routing_key=worker_name, queue=worker_name) |
                  example_task.si(job_num=job_num, task_num=5, result="File5").set(routing_key=worker_name, queue=worker_name))
    provider_2 = example_task.si(job_num=job_num, task_num=6, result="File6").set(routing_key=worker_name, queue=worker_name)
    provider_3 = example_task.si(job_num=job_num, task_num=7, result="File7").set(routing_key=worker_name, queue=worker_name)

    return ((provider_1 | example_task.si(job_num=job_num, task_num=8, result="File8").set(routing_key=worker_name, queue=worker_name) | final_provider_task.si(job_num=job_num, provider_name="1").set(routing_key=worker_name, queue=worker_name)) | (
        provider_2 | final_provider_task.si(job_num=job_num, provider_name="2").set(routing_key=worker_name, queue=worker_name)) | (
               provider_3 | final_provider_task.si(job_num=job_num, provider_name="3").set(routing_key=worker_name, queue=worker_name))).apply_async(
        expires=datetime.now() + timedelta(days=1),
        queue=worker_name)


def run_chain():
    pick_up_job_task.delay(job_num=1)
