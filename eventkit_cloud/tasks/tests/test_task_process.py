# -*- coding: utf-8 -*-
# test cases for Task Process
from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from mock import Mock, PropertyMock, patch, MagicMock, call, ANY
from eventkit_cloud.tasks.task_process import update_progress


class TestTaskPorcess(TestCase):
    @patch("eventkit_cloud.tasks.task_process.set_cache_value")
    @patch("django.db.connection.close")
    def test_update_progress(self, mock_close, mock_set_cache_value):
        uid = "1234"
        estimated = timezone.now()
        update_progress(uid, progress=50, estimated_finish=estimated)
        mock_close.assert_called_once()
        mock_set_cache_value.assert_has_calls(
            [
                call(uid=uid, attribute="progress", model_name="ExportTaskRecord", value=50),
                call(uid=uid, attribute="estimated_finish", model_name="ExportTaskRecord", value=estimated),
            ]
        )
