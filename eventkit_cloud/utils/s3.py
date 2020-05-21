import logging
import os

import boto3
from django.conf import settings

logger = logging.getLogger(__name__)


def get_s3_client():
    return boto3.client(
        "s3", aws_access_key_id=settings.AWS_ACCESS_KEY_ID, aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


def upload_to_s3(run_uuid, source_path, destination_filename, client=None, user_details=None):
    # This is just to make it easier to trace when user_details haven't been sent
    if user_details is None:
        user_details = {"username": "unknown-upload_to_s3"}

    if not client:
        client = get_s3_client()

    if not os.path.isfile(source_path):
        raise Exception("The file path given to upload to S3:\n {0} \n Does not exist.".format(source_path))

    asset_remote_path = os.path.join(str(run_uuid), destination_filename)

    from audit_logging.file_logging import logging_open

    with logging_open(source_path, "rb", user_details=user_details) as asset_file:
        client.upload_fileobj(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=asset_remote_path, Fileobj=asset_file)

    return client.generate_presigned_url(
        "get_object", Params={"Bucket": settings.AWS_STORAGE_BUCKET_NAME, "Key": asset_remote_path},
    ).split("?")[0]


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
        path_objects = client.list_objects(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Prefix=run_uid)
        items = path_objects.get("Contents", [])

    if download_url:
        parts = download_url.split("/")
        items = [{"Key": "/".join([parts[-2], parts[-1]])}]

    for item in items:
        _key = item["Key"]
        client.delete_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=_key)
        if "Contents" in client.list_objects(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Prefix=_key):
            logger.warn("Could not delete {0} from S3.".format(_key))


def get_presigned_url(download_url=None, client=None):

    if not client:
        client = get_s3_client()

    parts = download_url.split("/")
    key = "{0}/{1}".format(parts[-2], parts[-1])
    return client.generate_presigned_url(
        "get_object", Params={"Bucket": settings.AWS_STORAGE_BUCKET_NAME, "Key": key}, ExpiresIn=300,
    )
