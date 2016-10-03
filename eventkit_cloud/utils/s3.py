import os

import boto3
from django.conf import settings



def upload_to_s3(run_uuid, slug, filename):
    BUCKET_NAME = settings.AWS_BUCKET_NAME
    asset_path = os.path.join(
        settings.EXPORT_DOWNLOAD_ROOT,
        run_uuid,
        slug,
        filename
    )
    asset_remote_path = os.path.join(os.path.join(run_uuid, slug), filename)
    client = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY,
        aws_secret_access_key=settings.AWS_SECRET_KEY,
    )

    with open(asset_path, 'rb') as asset_file:
        asset_file.seek(0)
        client.put_object(
            Bucket=BUCKET_NAME, 
            Key=asset_remote_path,
            Body=asset_file.read()
        )

    client.put_object_acl(
        ACL='public-read',
        Bucket=BUCKET_NAME,
        Key=asset_remote_path
    )
    return client.generate_presigned_url(
        'get_object',
        Params={'Bucket': BUCKET_NAME, 'Key': asset_remote_path}
    ).split('?')[0]
