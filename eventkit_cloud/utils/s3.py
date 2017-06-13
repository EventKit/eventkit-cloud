import os

import boto3
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def get_s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY,
        aws_secret_access_key=settings.AWS_SECRET_KEY,
    )


def upload_to_s3(run_uuid, source_filename, destination_filename, client=None):
    if not client:
        client = get_s3_client()

    asset_path = os.path.join(
        settings.EXPORT_STAGING_ROOT,
        run_uuid,
        source_filename
    )
    asset_remote_path = os.path.join(run_uuid, destination_filename)
    from audit_logging.file_logging import logging_open
    with logging_open(asset_path, 'rb') as asset_file:
        asset_file.seek(0)
        client.put_object(
            Bucket=settings.AWS_BUCKET_NAME,
            Key=asset_remote_path,
            Body=asset_file.read()
        )

    return client.generate_presigned_url(
        'get_object',
        Params={'Bucket': settings.AWS_BUCKET_NAME, 'Key': asset_remote_path}
    ).split('?')[0]


def delete_from_s3(run_uid=None, download_url=None, client=None):
    """

    :param run_uid: An ExportRun uuid. If run uid is provided the entire run will be removed.
    :param download_url: A url for the download path. If a download url is provided only that file will be removed.
    :param client: An S3 Client, if not provided one will be created based on django settings if available.
    :return: None
    """

    if not client:
        client = get_s3_client()

    if run_uid:
        path_objects = client.list_objects(
            Bucket=settings.AWS_BUCKET_NAME,
            Prefix=run_uid
        )
        items = path_objects.get('Contents', [])

    if download_url:
        parts = download_url.split('/')
        items = [{'Key': '/'.join([parts[-2], parts[-1]])}]

    for item in items:
        _key = item['Key']
        response = client.delete_object(Bucket=settings.AWS_BUCKET_NAME, Key=_key)
        if not response.get("DeleteMarker"):
            logger.warn("Could not delete {0} from S3.".format(_key))


def get_presigned_url(download_url=None, client=None):

    if not client:
        client = get_s3_client()

    parts = download_url.split('/')
    key = "{0}/{1}".format(parts[-2], parts[-1])
    return client.generate_presigned_url('get_object', Params={'Bucket': settings.AWS_BUCKET_NAME, 'Key': key},
                                         ExpiresIn=300)
