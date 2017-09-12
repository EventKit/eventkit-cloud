# -*- coding: utf-8 -*-
import requests
import os

def get_id(user):
    if hasattr(user, "oauth"):
        return user.oauth.identification
    else:
        return user.username

def download_file(self, url, download_dir=None):
    download_dir = download_dir or self.download_dir
    file_location = os.path.join(download_dir, os.path.basename(url))
    r = requests.get(url, stream=True)
    if r.status_code == 200:
        with open(file_location, 'wb') as f:
            for chunk in r:
                f.write(chunk)
        return file_location
    else:
        print("Failed to download file, STATUS_CODE: {0}".format(r.status_code))
    return None

data_url = "http://data.openstreetmapdata.com/land-polygons-split-3857.zip"

def load_land_vectors(url):

    file = download_file(url)
    
