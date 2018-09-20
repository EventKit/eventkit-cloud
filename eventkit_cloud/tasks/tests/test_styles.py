# -*- coding: utf-8 -*-
import datetime
import os

from django.conf import settings

from django.test import TestCase
from mock import patch, MagicMock

from eventkit_cloud.tasks import TaskStates
from eventkit_cloud.tasks.helpers import generate_qgs_style


class TestStyles(TestCase):

    @patch('eventkit_cloud.ui.helpers.os.path.isfile')
    @patch('builtins.open')
    @patch('eventkit_cloud.tasks.models.ExportRun')
    def test_generate_qgs_style(self, ExportRun, mock_open, mock_isfile):
        run_uid = 1234
        stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(run_uid))

        mock_isfile.return_value = True
        # Fill out the behavior for mocked ExportRun by adding a provider task with
        # subtasks for each file in all_file_list

        mocked_provider_subtasks = []
        for fname in ['F1.gpkg']:
            mps = MagicMock()
            mps.result.filename = fname
            mocked_provider_subtasks.append(mps)

        mocked_provider_task = MagicMock()
        mocked_provider_task.status = TaskStates.COMPLETED.value
        mocked_provider_task.slug = 'example_slug'
        mocked_provider_task.tasks.all.return_value = mocked_provider_subtasks

        mocked_run = MagicMock()
        mocked_run.job.include_zipfile = True
        mocked_run.job.name = 'mocked_job_name'
        mocked_run.provider_tasks.all.return_value = [mocked_provider_task]

        ExportRun.objects.get.return_value = mocked_run

        # test 1 - with a provider task

        returnvalue = generate_qgs_style(run_uid, mocked_provider_task)
        now = datetime.datetime.now()
        datestamp = "%s%02d%02d" % (now.year, now.month, now.day)
        style_file = os.path.join(stage_dir,
                                  mocked_run.job.name + "-" + mocked_provider_task.slug + "-" + datestamp + ".qgs")
        mock_open.assert_called_once_with(style_file, 'wb')
        self.assertEqual(returnvalue, style_file)

        # test 2 - without a provider task

        style_file = os.path.join(stage_dir,
                                  mocked_run.job.name + "-" + datestamp + ".qgs")

        returnvalue = generate_qgs_style(run_uid, None)
        self.assertEqual(returnvalue, style_file)
