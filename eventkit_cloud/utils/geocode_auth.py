from django.conf import settings
from django.core.cache import cache

import logging
import requests
import json

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

        with open(getattr(settings, 'GEOCODING_AUTH_CERT'), 'r') as myfile:
            pem=myfile.read().replace('\n', '')
        authResponse = requests.get(getattr(settings, 'GEOCODING_AUTH_URL'), verify=True, cert=(getattr(settings, 'GEOCODING_AUTH_CERT'), getattr(settings, 'GEOCODING_AUTH_KEY')), headers={ 'SSL_CLIENT_CERT': pem})
        cache.set('pelias_token', authResponse.json()['token'], None)
        return 
    except requests.exceptions.RequestException as e:
        logger.error(e)
        return