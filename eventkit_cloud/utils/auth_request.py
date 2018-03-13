# -*- coding: utf-8 -*-
import logging
import requests
import os
from tempfile import NamedTemporaryFile

logger = logging.getLogger(__name__)


class AuthRequest(object):
    """
    Requests wrapper that checks for client certificates in environment vars, and includes them in requests if found.
    """

    def __init__(self, slug=None):
        """
        Initialize the AuthRequest utility.
        :param slug: Provider slug, used for looking up environment variables.
        """
        self.slug = slug

    def with_cert(self, method, url, **kwargs):
        try:
            cert_env = os.getenv(self.slug + "_CERT") or os.getenv(self.slug.upper() + "_CERT")
            if self.slug and cert_env:
                logger.info("Requesting {} with cert for {}".format(url, self.slug))
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

    def get(self, url, **kwargs):
        return self.with_cert(requests.get, url, **kwargs)

    def post(self, url, **kwargs):
        return self.with_cert(requests.post, url, **kwargs)
