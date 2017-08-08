import os

from django.conf import settings
from django.test import TestCase
from django.test.utils import override_settings
from mock import patch, mock_open, Mock, MagicMock

from eventkit_cloud.utils.s3 import (
    delete_from_s3,
    upload_to_s3,
    get_presigned_url
)

@override_settings(AWS_BUCKET_NAME='test-bucket')
@override_settings(AWS_ACCESS_KEY='d3adb33f')
@override_settings(AWS_SECRET_KEY='d3adb33f')
class TestS3Util(TestCase):
    def setUp(self):
        settings.EXPORT_DOWNLOAD_ROOT = 'test'

        self._uuid = 'd34db33f'
        self._filename = 'cool.pbf'

        self._asset_path = os.path.join(
            settings.EXPORT_DOWNLOAD_ROOT,
            self._uuid,
            self._filename
        )
        self._path = '%s/%s' % (self._uuid, self._filename)

    @patch('eventkit_cloud.utils.s3.get_s3_client')
    def test_upload_to_s3(self, mock_get_s3_client):
        mock_client = MagicMock()
        mock_get_s3_client.return_value = mock_client

        with patch('audit_logging.file_logging.logging_open', mock_open(read_data='test'), create=True) as mock_open_obj:
            upload_to_s3(self._uuid, self._filename, self._filename)

        mock_client.upload_fileobj.assert_called_once()
        mock_client.generate_presigned_url.assert_called_once_with('get_object', Params={'Bucket': 'test-bucket', 'Key': 'd34db33f/cool.pbf'})


    @patch('eventkit_cloud.utils.s3.get_s3_client')
    def test_s3_delete(self, mock_get_s3_client):

        mock_client = MagicMock()
        mock_get_s3_client.return_value = mock_client

        expected_key = "run_uid/file.txt"
        url = "http://s3.url/{0}".format(expected_key)
        run_uid = 'run'

        delete_from_s3(run_uid=run_uid, download_url=url)


        mock_client.list_objects.return_value = {"contents": [expected_key]}
        mock_client.list_objects.assert_called_once()
        mock_client.delete_object.assert_called_once_with(Bucket='test-bucket', Key=expected_key)


    @patch('eventkit_cloud.utils.s3.get_s3_client')
    def test_get_presigned_url(self, get_client):
        client = Mock()
        get_client.return_value = client

        test_url = "http://s3/run_uid/file.txt"
        expected_key = "run_uid/file.txt"
        expected_bucket = 'test_bucket'
        with self.settings(AWS_BUCKET_NAME=expected_bucket):
            get_presigned_url(download_url=test_url)
        client.generate_presigned_url.assert_called_with('get_object',
                                                         Params={'Bucket': expected_bucket, 'Key': expected_key},
                                                         ExpiresIn=300)

        with self.settings(AWS_BUCKET_NAME=expected_bucket):
            get_presigned_url(download_url=test_url, client=client)
        client.generate_presigned_url.assert_called_with('get_object',
                                                         Params={'Bucket': expected_bucket, 'Key': expected_key},
                                                         ExpiresIn=300)
