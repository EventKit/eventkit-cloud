import os

import boto3
from django.conf import settings

# TODO(mvv): move to settings
BUCKET_NAME = os.environ.get('AWS_BUCKET_NAME')


def upload_to_s3(run_uuid, filename):
    asset_path = os.path.join(
        settings.EXPORT_DOWNLOAD_ROOT,
        run_uuid, 
        filename
    )
    asset_remote_path = os.path.join(run_uuid, filename)
    client = boto3.client('s3')
    s3 = boto3.resource('s3')
    _object = s3.Object(
        BUCKET_NAME,
        asset_remote_path,
    )
    with open(asset_path, 'rb') as asset_file:
        asset_file.seek(0)
        client.put_object(
            Bucket=BUCKET_NAME, 
            Key=asset_remote_path,
            Body=asset_file.read()
        )

    _object.Acl().put(ACL='public-read')

    return client.generate_presigned_url(
        'get_object',
        Params={'Bucket': BUCKET_NAME, 'Key': asset_remote_path}
    ).split('?')[0]
