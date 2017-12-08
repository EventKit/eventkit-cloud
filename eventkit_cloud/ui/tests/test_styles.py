# -*- coding: utf-8 -*-
import logging
import datetime
import os

from django.test import TestCase
from django.conf import settings

from mock import Mock, patch, MagicMock
from ..data_estimator import get_size_estimate, get_gb_estimate
from ..helpers import generate_qgs_style
from eventkit_cloud.tasks.models import (
    ExportRun,
    ExportTaskRecord,
    FileProducingTaskResult,
    DataProviderTaskRecord
)

from eventkit_cloud.tasks import TaskStates

logger = logging.getLogger(__name__)

# @patch 'modules.class.creates_files`
# def test_create_file(self, mock_creates_files):
#    some_parent_function()
#    mock_creates_files.assert_called_once_with(params)


class TestStyles(TestCase):

    def test_get_gb_estimate(self):
        expected_return_value = 0.0001572864
        actual_return_value = get_gb_estimate(4)
        self.assertAlmostEqual(expected_return_value, actual_return_value, places=9)

    @patch('eventkit_cloud.ui.data_estimator.get_gb_estimate')
    @patch('eventkit_cloud.ui.data_estimator.DataProvider')
    def test_get_size_estimate(self, export_provider, get_estimate):
        provider_name = "Test_name"
        get_estimate.return_value = 4
        export_provider.objects.get.return_value = Mock(level_from=0, level_to=1)
        returned_values = get_size_estimate(provider_name, bbox=[-1, -1, 0, 0])
        export_provider.objects.get.assert_called_once_with(name=provider_name)
        # two tiles, an arbritary value of four from the mock, one tile per level represented in array.
        expected_values = [2, 4, [1, 1]]
        self.assertEquals(returned_values, expected_values)

    @patch('__builtin__.open')
    @patch('eventkit_cloud.tasks.models.ExportRun')

    def test_generate_qgs_style(self,ExportRun, mock_open):

        run_uid = 1234
        stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(run_uid))

        # Fill out the behavior for mocked ExportRun by adding a provider task with
        # subtasks for each file in all_file_list

        mocked_provider_subtasks = []
        for fname in [ 'F1']:
            mps = MagicMock()
            mps.result.filename = fname
            mocked_provider_subtasks.append(mps)

        mocked_provider_task = MagicMock()
        mocked_provider_task.status = TaskStates.COMPLETED.value
        mocked_provider_task.slug = 'mocked_slug'
        mocked_provider_task.tasks.all.return_value = mocked_provider_subtasks

        mocked_run = MagicMock()
        mocked_run.job.include_zipfile = True
        mocked_run.job.name = 'mocked_job_name'
        mocked_run.provider_tasks.all.return_value = [mocked_provider_task]

        ExportRun.objects.get.return_value = mocked_run

        returnvalue = generate_qgs_style(run_uid, mocked_provider_task)
        now = datetime.datetime.now()
        datestamp = "%s%02d%02d" % (now.year,now.month,now.day)
        style_file = '/var/lib/eventkit/exports_stage/1234/mocked_job_name-20171208.qgs'
        style_file2 = os.path.join(stage_dir,mocked_run.job.name+"-"+datestamp+".qgs")
        mock_open.assert_called_once_with(style_file, 'w')
        self.assertEquals(returnvalue,style_file)