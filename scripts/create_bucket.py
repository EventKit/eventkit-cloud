import os
import sys

from botocore.exceptions import ClientError
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.prod")
django.setup()

from eventkit_cloud.utils.s3 import get_s3_resource


def create_bucket(bucket_name):
    """Create an S3 bucket in a specified region

    If a region is not specified, the bucket is created in the S3 default
    region (us-east-1).

    :param bucket_name: Bucket to create
    :param region: String region to create bucket in, e.g., 'us-west-2'
    :return: True if bucket created, else False
    """
    try:
        s3 = get_s3_resource()
        s3.create_bucket(Bucket=bucket_name)
    except ClientError as e:
        if "BucketAlreadyOwnedByYou" not in str(e):
            raise
    return True


if __name__ == "__main__":
    create_bucket(sys.argv[1])
