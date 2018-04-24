from django.conf import settings
from django.core.cache import cache
import tempfile
from ..utils import auth_requests
import logging
import requests
import json
import traceback

logger = logging.getLogger(__name__)

def getAuthHeaders():
    if getattr(settings, 'GEOCODING_AUTH_URL') is not None:
        if cache.get('pelias_token') is None: 
            authenticate()
        return { 'Authorization' : 'Bearer ' + str(cache.get('pelias_token')) }
    else:
        return {}

def authenticate():
    logger.info('Receiving new authentication token for geocoder')
    try:  
        certArray = getattr(settings, 'GEOCODING_AUTH_CERT').split("\\n")
        certFile = tempfile.NamedTemporaryFile(suffix='.crt', delete=False)
        for certLine in certArray:
            certFile.write(certLine + '\n')
        keyArray = getattr(settings, 'GEOCODING_AUTH_KEY').split("\\n")
        for keyLine in keyArray:
            certFile.write(keyLine + '\n')
        certFile.flush()
        certFile.close()

        authResponse = requests.get(getattr(settings, 'GEOCODING_AUTH_URL'), verify=True, cert=(certFile.name), headers={ 'SSL_CLIENT_CERT': getattr(settings, 'GEOCODING_AUTH_CERT').replace('\\n','')})

        cache.set('pelias_token', authResponse.json()['token'], None)
        return 
    except requests.exceptions.RequestException as e:
        logger.info(traceback.print_exc())
        return