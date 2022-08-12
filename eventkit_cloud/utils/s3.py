import logging
import os
import pathlib
from typing import Union
from urllib.parse import urlparse

import boto3
import botocore.exceptions
from django.conf import settings

logger = logging.getLogger(__name__)


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_S3_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_S3_SECRET_ACCESS_KEY,
    )


def get_s3_resource():
    return boto3.resource(
        "s3",
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_S3_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_S3_SECRET_ACCESS_KEY,
    )


def upload_to_s3(
    source_path: Union[str, pathlib.Path],
    destination_filename: Union[str, pathlib.Path] = None,
    client=None,
    user_details=None,
):
    """
    Upload a file to Amazon S3.
    :param source_path: The local file path.
    :param destination_filename: The path you want to store the file on on S3.
    :param client: An S3 client, optional.
    :param user_details: A dictionary containing the username of the user uploading the file, optional.
    """
    # This is just to make it easier to trace when user_details haven't been sent
    if user_details is None:
        user_details = {"username": "unknown-upload_to_s3"}

    source_path = pathlib.Path(source_path)
    destination_filename = pathlib.Path(destination_filename) if destination_filename else source_path
    stage_dir = pathlib.Path(settings.EXPORT_STAGING_ROOT)
    if stage_dir in destination_filename.parents:
        destination_filename = destination_filename.relative_to(stage_dir)

    if not client:
        client = get_s3_client()

    if not os.path.isfile(source_path):
        raise Exception("The file path given to upload to S3:\n {0} \n Does not exist.".format(source_path))

    from audit_logging.file_logging import logging_open

    with logging_open(source_path, "rb", user_details=user_details) as asset_file:
        try:
            logger.info(f"Uploading s3 file {source_path} -> {destination_filename}")
            client.upload_fileobj(
                Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=str(destination_filename), Fileobj=asset_file
            )
        except botocore.exceptions.ClientError:
            logger.error(f"Could not s3 upload file {source_path} -> {destination_filename}")
            raise

    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.AWS_STORAGE_BUCKET_NAME, "Key": str(destination_filename)},
    ).split("?")[0]


def download_folder_from_s3(folder_to_download: str, output_dir: str = None):
    """
    Downloads a folder from S3 into the EXPORT_STAGING_ROOT.
    :param folder_to_download: The folder path on S3 you want to download.
    :param output_dir: A different directory other than the original uid in the staging root.
    """
    logger.error(f"Downloading s3 {folder_to_download} to output_dir {output_dir}")
    resource = get_s3_resource()
    bucket = resource.Bucket(settings.AWS_STORAGE_BUCKET_NAME)

    for s3_object in bucket.objects.filter(Prefix=folder_to_download):

        destination_path = os.path.join(settings.EXPORT_STAGING_ROOT, s3_object.key)
        if output_dir:
            destination_path = os.path.join(output_dir, s3_object.key.lstrip(folder_to_download).lstrip("\/"))

        # We don't want or need the original zip file, since we're creating a new one.
        suffix = pathlib.PurePosixPath(s3_object.key).suffix
        logger.error(f"file suffix: {suffix}")
        if suffix == ".zip":
            logger.error(f"Skipping zip {s3_object.key}.")
            continue

        os.makedirs(os.path.dirname(destination_path), exist_ok=True)

        print(f"Downloading file {s3_object.key} -> {destination_path}")
        bucket.download_file(s3_object.key, destination_path)


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


def get_presigned_url(download_url=None, client=None, expires=300):

    if not client:
        client = get_s3_client()

    parsed = urlparse(download_url)
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.AWS_STORAGE_BUCKET_NAME, "Key": parsed.path.lstrip("/")},
        ExpiresIn=expires,
    )
