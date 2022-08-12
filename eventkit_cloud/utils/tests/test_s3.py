import os
from pathlib import Path
from unittest.mock import MagicMock, mock_open, patch

from django.conf import settings
from django.test import TestCase
from django.test.utils import override_settings

from eventkit_cloud.utils.s3 import delete_from_s3, upload_to_s3


@override_settings(AWS_STORAGE_BUCKET_NAME="test-bucket")
@override_settings(AWS_ACCESS_KEY_ID="d3adb33f")
@override_settings(AWS_SECRET_ACCESS_KEY="d3adb33f")
class TestS3Util(TestCase):
    def setUp(self):
        settings.EXPORT_DOWNLOAD_ROOT = "test"

        self._uuid = "d34db33f"
        self._filename = "cool.pbf"

        self._asset_path = os.path.join(settings.EXPORT_DOWNLOAD_ROOT, self._uuid, self._filename)
        self._path = "%s/%s" % (self._uuid, self._filename)

    @patch("eventkit_cloud.utils.s3.os.path.isfile")
    @patch("eventkit_cloud.utils.s3.get_s3_client")
    def test_upload_to_s3(self, mock_get_s3_client, mock_isfile):
        mock_client = MagicMock()
        mock_get_s3_client.return_value = mock_client
        example_filename = os.path.join(settings.EXPORT_STAGING_ROOT, self._uuid, self._filename)
        expected_download_path = f"{self._uuid}/{self._filename}"
        with patch("audit_logging.file_logging.logging_open", mock_open(read_data="test"), create=True):
            upload_to_s3(example_filename)

        mock_client.upload_fileobj.assert_called_once()
        mock_isfile.assert_called_once_with(Path(example_filename))
        mock_client.generate_presigned_url.assert_called_once_with(
            "get_object", Params={"Bucket": "test-bucket", "Key": expected_download_path}
        )

    @patch("eventkit_cloud.utils.s3.get_s3_client")
    def test_s3_delete(self, mock_get_s3_client):

        mock_client = MagicMock()
        mock_get_s3_client.return_value = mock_client

        expected_key = "run_uid/file.txt"
        url = "http://s3.url/{0}".format(expected_key)
        run_uid = "run"

        delete_from_s3(run_uid=run_uid, download_url=url)

        mock_client.list_objects.return_value = {"contents": [expected_key]}

        mock_client.delete_object.assert_called_once_with(Bucket="test-bucket", Key=expected_key)
