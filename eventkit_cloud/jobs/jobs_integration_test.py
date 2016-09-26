import requests
import json

passed = False
username = 'admin'
password = 'admin'
base_url = 'http://cloud.eventkit.dev'
login_url = base_url + '/en/login'
create_export_url = base_url + '/en/exports/create'
job_url = base_url + '/api/jobs'

client = requests.session()

client.get(login_url)
csrftoken = client.cookies['csrftoken']

login_data = dict(username=username, password=password, csrfmiddlewaretoken=csrftoken, next='/')
r = client.post(login_url, data=login_data, headers=dict(Referer=login_url), auth=(username,password))

client.get(base_url)
client.get(create_export_url)
csrftoken = client.cookies['csrftoken']
my_data = {
    "csrfmiddlewaretoken": csrftoken,
    "name": "Rio_Airport",
    "description": "Rio",
    "event": "Rio",
    "formats": ["thematic"],
    "preset": "",
    "translation": "",
    "transform": "",
    "xmin": "-43.266177",
    "ymin": "-22.833742",
    "xmax": "-43.212962",
    "ymax": "-22.783581",
    "tags": [{
            "name": "Apron",
            "key": "aeroway",
            "value": "apron",
            "geom_types": ["polygon", "polygon"],
            "data_model": "HDM",
            "groups": ["Humanitarian Data Model", "Transportation", "Transportation means", "Airport"]
        }, {
            "name": "Runway",
            "key": "aeroway",
            "value": "runway",
            "geom_types": ["line"],
            "data_model": "HDM",
            "groups": ["Humanitarian Data Model", "Transportation", "Transportation means", "Airport"]
        }, {
            "name": "Airport Ground",
            "key": "aeroway",
            "value": "aerodrome",
            "geom_types": ["point", "polygon", "polygon"],
            "data_model": "HDM",
            "groups": ["Humanitarian Data Model", "Transportation", "Transportation means", "Airport"]
        }, {
            "name": "Taxiway",
            "key": "aeroway",
            "value": "taxiway",
            "geom_types": ["line"],
            "data_model": "HDM",
            "groups": ["Humanitarian Data Model", "Transportation", "Transportation means", "Airport"]
        }, {
            "name": "Terminal",
            "key": "aeroway",
            "value": "terminal",
            "geom_types": ["point", "polygon", "polygon"],
            "data_model": "HDM",
            "groups": ["Humanitarian Data Model", "Transportation", "Transportation means", "Airport"]
        }, {
            "name": "Helipad",
            "key": "aeroway",
            "value": "helipad",
            "geom_types": ["point", "polygon", "polygon"],
            "data_model": "HDM",
            "groups" : ["Humanitarian Data Model", "Transportation", "Transportation means", "Airport"]
        }, {
            "name" : "Gate",
            "key" : "aeroway",
            "value" : "gate",
            "geom_types" : ["point"],
            "data_model" : "HDM",
            "groups": ["Humanitarian Data Model", "Transportation", "Transportation means", "Airport"]
        }, {
            "name": "Hangar",
            "key": "building",
            "value": "hangar",
            "geom_types": ["point", "polygon", "polygon"],
            "data_model": "HDM",
            "groups": ["Humanitarian Data Model", "Transportation", "Transportation means", "Airport"]
        }
    ]
}
r2 = client.post(job_url, json=my_data, headers={'X-CSRFToken':csrftoken, 'Referer':create_export_url})

jobs = client.get(job_url).json()

rio_job_url = None
for job in jobs:
    if job['name'] == 'Rio_Airport':
        passed = True
        rio_job_url = job['url']

if passed:
    print("####### The jobs test has been completed successfully. #######")
    client.delete(rio_job_url, headers={'X-CSRFToken':csrftoken, 'Referer':create_export_url})
else:
    print("####### Uh oh! Jobs test has failed! #######")

