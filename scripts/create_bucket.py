import os
import sys

import botocore

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.prod")
django.setup()

from eventkit_cloud.utils.s3 import get_s3_resource, get_s3_client
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
    try:
        s3 = get_s3_resource()
        s3.create_bucket(Bucket=bucket_name)
    except botocore.exceptions.ClientError as e:
        if "NoSuchBucket" in str(e):
            client = get_s3_client()
            response = client.list_buckets()
            for bucket in response.get("Buckets"):
                if bucket["Name"] == bucket_name:
                    return True
            logger.error("Received no such bucket error, this can happen due to a hostname resolution error.")
            logger.error("Also check that the AWS Endpoint URL is correct and isn't a bucket path.")
            logger.error("Could not find the bucket using list buckets.")
            raise
        elif "BucketAlreadyOwnedByYou" not in str(e):
            raise
    return True


if __name__ == "__main__":
    create_bucket(sys.argv[1])
