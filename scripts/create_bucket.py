import os
import sys

import botocore

import django
import time

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.prod")
django.setup()

from eventkit_cloud.utils.s3 import get_s3_resource
import logging

logger = logging.getLogger(__name__)

def create_bucket(bucket_name):
    """Create an S3 bucket in a specified region

    If a region is not specified, the bucket is created in the S3 default
    region (us-east-1).

    :param bucket_name: Bucket to create
    :param region: String region to create bucket in, e.g., 'us-west-2'
    :return: True if bucket created, else False
    """
    tries = 3
    while tries:
        try:
            s3 = get_s3_resource()
            s3.create_bucket(Bucket=bucket_name)
            return True
        except botocore.exceptions.ClientError as e:
            if "NoSuchBucket" in str(e):
                tries -= 1
                if not tries:
                    raise
                logger.info("Waiting for S3 Connection to try to create the bucket.")
                time.sleep(1)
            elif "BucketAlreadyOwnedByYou" in str(e):
                logger.info("Bucket already created.")
                return True
            else:
                raise
    return True


if __name__ == "__main__":
    create_bucket(sys.argv[1])
