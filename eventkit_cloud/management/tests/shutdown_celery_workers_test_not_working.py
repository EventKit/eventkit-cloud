# This test matches shutdown_celery_workers_test_script, but as a TestCase.
# Unfortunately, something goes wrong when configured this way & AsyncResult.status never changes from 'PENDING'
# even after worker output shows the task has completed.

# from django.test import TestCase
# from time import sleep
# from django.core.management import call_command
# from eventkit_cloud.tasks import test_chain, test_task
# from eventkit_cloud.celery import app
# from django.conf import settings
# from logging import getLogger
# from celery.result import AsyncResult
#
#
# logger = getLogger(__name__)
#
#
# class TestGracefulShutdown(TestCase):
#     def setUp(self):
#         TestCase.setUp(self)
#         n_preexisting_tasks = app.control.purge()
#         msg = 'Found {} preexisting tasks, please clean up queue before executing this test'
#         self.assertEqual(n_preexisting_tasks, 0, msg)
#
#     @staticmethod
#     def is_chain_success(chain_async_result):
#         """ Checks that each task for the chain producing @chain_result completed successfully.
#             Returns True if all tasks are successful, False otherwise.
#         """
#         print('Waiting on chain.ready()')
#         # Make sure the chain has completed
#         result = chain_async_result.get()
#         msgs = []
#
#         def traverse_chain_result(result):
#             result_id, remaining_chain = result[0]
#             link_result = AsyncResult(result_id)
#             msgs.append('{}: {}'.format(result_id, link_result.status))
#
#             if type(remaining_chain) == list:
#                 remaining_links_completed = traverse_chain_result(remaining_chain)
#             else:
#                 remaining_links_completed = []
#
#             statuses = [link_result.status] + remaining_links_completed
#             return statuses
#
#         statuses = traverse_chain_result(result)
#         if all([s == 'SUCCESS' for s in statuses]):
#             return True
#         else:
#             logger.info('\n'.join(msgs))
#             return False
#
#
#     def test_shutdown_celery_workers_mgmt_cmd(self):
#         """ Checks that 'shutdown_celery_workers' allows previous tasks to finish, but prevents additional processing
#             then stops the celery workers.
#         """
#         from pydevd import settrace; settrace('172.21.0.1')
#         # Ensure celery container is running
#         self.assertIsNotNone(app.control.inspect().ping(), 'No worker nodes found running prior to test')
#
#         worker_nodename = [n for n in app.control.inspect().ping().keys() if 'worker' in n][0]
#         worker_hostname = worker_nodename.split('@')[1]
#
#         # Fire off a number of tasks & wait for them to be picked up
#         tc1 = test_chain.apply_async(kwargs={'subtask_queuename':worker_hostname}, expires=6, time_limit=10)
#         print(tc1.backend)
#         import sys
#         sys.stdout.flush()
#         tc1.get()
#
#         # Instruct system to finish current tasks
#         call_command('finish_worker_tasks')
#
#         # fire off more tasks
#         tc2 = test_chain.apply_async(kwargs={'subtask_queuename':worker_hostname}, expires=6)
#
#         msg = 'Tasks started before "finish_worker_tasks", status "{}" != "SUCCESS"'.format(tc1.status)
#         self.assertEqual(tc1.status, 'SUCCESS', msg)
#         msg = 'Tasks started before "finish_worker_tasks", did not all complete successfully'
#         self.assertTrue(self.is_chain_success(tc1), msg)
#         msg = 'Tasks started after "finish_worker_tasks", status {} != "PENDING"'.format(tc2.status)
#         self.assertEqual(tc2.status, 'PENDING', msg)
#
#         # Invoke shutdown_celery_workers
#         call_command('shutdown_celery_workers')
#
#         # Check that the celery workers are all stopped
#         self.assertIsNone(app.control.inspect().ping(), 'Worker nodes still running after test')
#
#         # There should be one test_chain task on the celery queue that's left after "finish_worker_tasks" call.
#         n_purged_tasks = app.control.purge()
#         self.assertEqual(n_purged_tasks, 1, 'Number of pending tasks purged, {} != 4'.format(n_purged_tasks))
