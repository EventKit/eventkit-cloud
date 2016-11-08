import os

import boto3
from django.conf import settings


def get_s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY,
        aws_secret_access_key=settings.AWS_SECRET_KEY,
    )


def upload_to_s3(run_uuid, filename, client=None):
    if not client:
        client = get_s3_client()

    asset_path = os.path.join(
        settings.EXPORT_DOWNLOAD_ROOT,
        run_uuid,
        filename
    )
    asset_remote_path = os.path.join(run_uuid, filename)
    with open(asset_path, 'rb') as asset_file:
        asset_file.seek(0)
        client.put_object(
            Bucket=settings.AWS_BUCKET_NAME,
            Key=asset_remote_path,
            Body=asset_file.read()
        )

    client.put_object_acl(
        ACL='public-read',
        Bucket=settings.AWS_BUCKET_NAME,
        Key=asset_remote_path
    )
    return client.generate_presigned_url(
        'get_object',
        Params={'Bucket': settings.AWS_BUCKET_NAME, 'Key': asset_remote_path}
    ).split('?')[0]


def delete_from_s3(run_uuid, client=None):
    if not client:
        client = get_s3_client()

    path_objects = client.list_objects(
        Bucket=settings.AWS_BUCKET_NAME,
        Prefix=run_uuid
    )
    for item in path_objects.get('Contents', []):
        _key = item['Key']
        client.delete_object(
            Bucket=settings.AWS_BUCKET_NAME,
            Key=_key,
        )
