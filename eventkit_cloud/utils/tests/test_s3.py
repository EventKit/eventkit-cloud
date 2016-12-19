import datetime
import os
from StringIO import StringIO

import botocore
import botocore.session
from botocore.stub import Stubber, ANY
from django.conf import settings
from django.test import TestCase
from django.test.utils  import override_settings
from mock import patch, mock_open

from eventkit_cloud.utils.s3 import (
    delete_from_s3,
    get_s3_client,
    upload_to_s3,
)

# TODO: override settings.EXPORT_DOWNLOAD_ROOT to be test dir?

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
        self._base_response = {
            'ResponseMetadata': {'RequestId': 'abc123', 'HTTPStatusCode': 200, 'HostId': 'abc123'},
        }

    def test_s3_put(self):
        client = get_s3_client()
        stubber = Stubber(client)
        stubber.activate()
        stubber.add_response(
            'put_object',
            self._base_response,
            dict(
            Bucket=ANY,
            Key=self._path,
            Body='test'
        ))
        stubber.add_response(
            'put_object_acl',
            self._base_response,
            {'ACL': 'public-read', 'Bucket': ANY, 'Key': ANY}
        )
        with patch('eventkit_cloud.utils.s3.open', mock_open(read_data='test'), create=True) as mock_open_obj:
            upload_to_s3(self._uuid, self._filename, self._filename,client=client)

    def test_s3_delete(self):
        client = get_s3_client()
        stubber = Stubber(client)
        stubber.activate()

        stubber.add_response(
            'put_object',
            self._base_response,
            dict(
            Bucket=ANY,
            Key=self._path,
            Body='test'
        ))
        stubber.add_response(
            'put_object_acl',
            self._base_response,
            {'ACL': 'public-read', 'Bucket': ANY, 'Key': self._path}
        )

        list_objects_response = {
                'IsTruncated': False,
                'Name': 'test-bucket',
                'MaxKeys': 1000, 'Prefix': '',
                'Contents': [{
                    u'LastModified': datetime.datetime(2016, 9, 23, 11, 17, 14),
                    u'ETag': '"20d2cb13afb394301bbea0bcff19e12b"',
                    u'StorageClass': 'STANDARD',
                    u'Key': self._path,
                    u'Owner': {
                        u'DisplayName': 'test',
                        u'ID': '31d89f79718dbd4435290740e6fa5e41cffafa7d9a3c323c85b525342e6341ae'
                    },
                    u'Size': 77824
                }],
                'EncodingType': 'url',
                'ResponseMetadata': {
                            'RequestId': 'abc123',
                            'HTTPStatusCode': 200,
                            'HostId': 'abc123'
                        },
                'Marker': ''
        }
        stubber.add_response(
            'list_objects',
            list_objects_response, {
                'Bucket': ANY,
                'Prefix':self._uuid
            })
        stubber.add_response(
            'delete_object',
            self._base_response, {
                'Bucket': ANY,
                'Key': self._path
            })

        with patch('eventkit_cloud.utils.s3.open', mock_open(read_data='test'), create=True) as mock_open_obj:
            upload_to_s3(self._uuid, self._filename, self._filename, client=client)

        delete_from_s3(self._uuid, client=client)
