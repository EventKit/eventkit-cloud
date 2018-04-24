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
        #certString = getattr(settings, 'GEOCODING_AUTH_CERT')
        certArray = getattr(settings, 'GEOCODING_AUTH_CERT').split("\\n")
        certFile = tempfile.NamedTemporaryFile(suffix='.crt', delete=False)
        for certLine in certArray:
            certFile.write(certLine + '\n')

        certFile.flush()    # ensure all data written
        keyArray = getattr(settings, 'GEOCODING_AUTH_KEY').split("\\n")
        keyFile = tempfile.NamedTemporaryFile(suffix='.key', delete=False)
        for keyLine in keyArray:
            keyFile.write(keyLine + '\n')

        keyFile.flush()    # ensure all data written

        certFile.close()
        keyFile.close()


        authResponse = requests.get(getattr(settings, 'GEOCODING_AUTH_URL'), verify=True, cert=(certFile.name, keyFile.name), headers={ 'SSL_CLIENT_CERT': getattr(settings, 'GEOCODING_AUTH_CERT').replace('\\n','')})

        #authResponse = requests.get(getattr(settings, 'GEOCODING_AUTH_URL'), cert=(certFile.name))

        logger.info(authResponse)
        
        cache.set('pelias_token', authResponse.json()['token'], None)
        return 
    except requests.exceptions.RequestException as e:
        logger.info(traceback.print_exc())
        return

#@auth_requests.content_to_file(getattr(settings, 'GEOCODING_AUTH_CERT'))
#def getToken(*args, **kwargs):
    #logger.info("getToken:")
    #logger.info(kwargs.get("cert"))
    #return requests.get(requests.get(getattr(settings, 'GEOCODING_AUTH_URL'), verify=True, cert=(), headers={ 'SSL_CLIENT_CERT': getattr(settings, 'GEOCODING_AUTH_CERT')}))