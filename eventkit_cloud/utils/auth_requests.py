# -*- coding: utf-8 -*-
import logging
import requests
import os
from tempfile import NamedTemporaryFile

logger = logging.getLogger(__name__)


def with_cert(method, url, slug=None, **kwargs):
    try:
        if slug:
            cert_env = os.getenv(slug + "_CERT") or os.getenv(slug.upper() + "_CERT")
        else:
            cert_env = None

        if slug and cert_env:
            logger.info("Requesting {} with cert for {}".format(url, slug))
            with NamedTemporaryFile() as f:
                f.write(cert_env)
                f.flush()
                response = method(url, cert=f.name, **kwargs)
                logger.info("Response: [{}], {} B".format(response.status_code, len(response.text)))
            return response
        else:
            response = method(url, **kwargs)
            return response
    except requests.exceptions.SSLError as e:
        logger.error('Could not establish SSL connection: possibly missing client certificate')
        raise requests.exceptions.SSLError(e)


def get(url, **kwargs):
    return with_cert(requests.get, url, **kwargs)


def post(url, **kwargs):
    return with_cert(requests.post, url, **kwargs)
