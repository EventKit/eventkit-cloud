# -*- coding: utf-8 -*-

import logging

import requests

logger = logging.getLogger(__name__)


class EventKitClient(object):

    def __init__(self, url, username, password):
        self.base_url = url
        self.login_url = self.base_url + '/api/login'
        self.create_export_url = self.base_url + '/create'
        self.jobs_url = self.base_url + '/api/jobs'
        self.runs_url = self.base_url + '/api/runs'
        self.providers_url = self.base_url + '/api/providers'
        self.client = requests.session()
        self.client.get(self.login_url)
        self.csrftoken = self.client.cookies.get('csrftoken')

        login_data = dict(username=username, password=password, csrfmiddlewaretoken=self.csrftoken, next='/')
        self.client.post(self.login_url, data=login_data, headers=dict(Referer=self.login_url),
                         auth=(username, password))
        self.client.get(self.base_url)
        self.client.get(self.create_export_url)
        self.csrftoken = self.client.cookies.get('csrftoken')

    def get_providers(self, ):
        response = self.client.get(self.providers_url,
                                    headers={'X-CSRFToken': self.csrftoken,
                                             'Referer': self.create_export_url})
        if response.status_code != 200:
            logger.error("There was an error getting the providers.")
            logger.error(response.text)
            raise Exception("Unable to get providers.")
        return response.json()

    def get_runs(self, search_term=None):
        params={"search_term":search_term}
        response = self.client.get("{0}/filter".format(self.runs_url), params=params,
                                    headers={'X-CSRFToken': self.csrftoken,
                                             'Referer': self.create_export_url})
        if response.status_code not in [200, 206]:
            logger.error("There was an error getting the runs.")
            logger.error(response.text)
            raise Exception("Unable to get runs.")
        return response.json()

    def run_job(self, **kwargs):
        """
        :param name: A name for the datapack.
        :param description: A description for the datapack.
        :param project: A title for the project/event.
        :param selection: A geojson FeatureCollection representing the selection.
        :param provider_tasks: A list of providers (data sources).
           Example:
              [{
                "provider": "OpenStreetMap Data (Themes)",
                "formats": ["shp", "gpkg"]
              }]
        :return:
        """
        if not all(kwargs.values()):
            for kwarg in kwargs:
                if not kwargs[kwarg]:
                    logger.error('Attempted to create a job without a {0}.'.format(kwarg))
                    raise Exception('Attempted to create a job without a {0}.'.format(kwarg))
        data = {
            "name": kwargs.get('name'),
            "description": kwargs.get('description'),
            "event": kwargs.get('project'),
            "include_zipfile": True,
            "selection": kwargs.get('selection'),
            "tags": [],
            "provider_tasks": kwargs.get('provider_tasks')
        }
        response = self.client.post(self.jobs_url,
                                    json=data,
                                    headers={'X-CSRFToken': self.csrftoken,
                                             'Referer': self.create_export_url})
        print(response.status_code)
        if response.status_code != 202:
            logger.error("There was an error creating the job: {0}".format(kwargs.get('name')))
            logger.error(response.text)
            raise Exception("Unable to get create Job.")
        return response.json()



