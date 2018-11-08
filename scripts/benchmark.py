# -*- coding: utf-8 -*-
import getpass
import os
import json
import argparse
import time

from eventkit_cloud.utils.client import EventKitClient


class BenchmarkEventkit(object):

    def __init__(self, url, username, passwd, file_name, name_field, sources):
        self.url = url
        self.file = file_name
        self.sources = sources
        self.name = name_field
        self.username = username
        self.client = EventKitClient(self.url, username, passwd)

    def run_tests(self, batch_sizes):
        times = []
        start_time = time.time()
        times += [start_time]
        print("Starting tests:")
        for batch_size in batch_sizes.split(','):
            batch_size = int(batch_size)
            print("Running test for batch size: {0}".format(batch_size))
            batch_start_time = time.time()
            run_uid = self.run_iteration(batch_size)
            self.wait_for_run(run_uid)
            self.delete_runs()
            batch_finish_time = time.time()
            print("Test for batch size: {0} finished in {1} seconds".format(batch_size, batch_finish_time - batch_start_time))
            times += [batch_finish_time]
        print("Tests finished in {0} seconds.".format(batch_finish_time - start_time))
        return times

    def run_iteration(self, batch_size):

        if self.sources:
            provider_tasks = []
            for provider in self.client.get_providers():
                if provider.get('slug') in self.sources:
                    provider_tasks += [{"provider": provider.get('name'), "formats": ["gpkg"]}]
        else:
            provider_tasks = [{"provider": provider.get('name'), "formats": ["gpkg"]} for provider in
                              self.client.get_providers()]

        with open(self.file, 'r') as geojson_file:
            geojson_data = json.load(geojson_file)

        count = batch_size
        index = 0
        while count or (index > len(geojson_data['features'])):
            feature = geojson_data['features'][index]
            index += 1
            name = feature['properties'].get(self.name)
            description = "Created using the benchmark script."
            project = "benchmark"
            runs = [run for run in self.client.get_runs(search_term=name)]
            if name in [run['job']['name'] for run in runs] and self.username in [run['user'] for run in runs]:
                print("Skipping {0} because data already exists in a DataPack with the same name.".format(name))
                continue
            if not name:
                print("Skipping: \n {0} \n"
                      "because a valid name wasn't provided or found.".format(feature))
                continue
            response = self.client.run_job(name=name, description=description, project=project,
                                           provider_tasks=provider_tasks, selection=feature)

            if response:
                print('Submitted job for {0}'.format(name))
                count -= 1
                if not count:
                    return response['uid']
            else:
                print('Failed to submit job for {0}'.format(name))
                print(response)

    def delete_runs(self):
        response = self.client.get_runs()
        while response:
            for run in response:
                if run.get('user') == self.username:
                    job_url = run['job']['url']
                    if job_url:
                        self.client.client.delete(run['job']['url'],
                                                  headers={'X-CSRFToken': self.client.csrftoken})
            response = self.client.get_runs()

    def wait_for_run(self, job_uid, run_timeout=0):
        finished = False
        response = None
        first_check = time.time()
        while not finished:
            time.sleep(1)
            response = self.client.client.get(
                self.client.runs_url,
                params={"job_uid": job_uid},
                headers={'X-CSRFToken': self.client.csrftoken
                         }).json()
            status = response[0].get('status')
            if status == "COMPLETED":
                finished = True
            last_check = time.time()
            if run_timeout and last_check - first_check > run_timeout:
                raise Exception('Run timeout ({}s) exceeded'.format(run_timeout))

        return response[0]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('url', help='The EventKit instance base url (i.e. http://cloud.eventkit.test).')
    parser.add_argument('file', help='A geojson file to be used for location data.')
    parser.add_argument('--name', default='name',
                        help='The field to be used for the name of the location which will be the datapack name.')
    parser.add_argument('--description', default='description',
                        help='The field to be used for the description of the location which will be the datapack description.')
    parser.add_argument('--project', default='project',
                        help='The project name, will be the same for all datapacks (not based on file).')
    parser.add_argument('--sources', nargs='*', default='',
                        help='The project name, will be the same for all datapacks (not based on file).')
    parser.add_argument('--batches', default=0,
                        help='The project name, will be the same for all datapacks (not based on file).')

    args = parser.parse_args()
    user = os.getenv('EVENTKIT_USER')
    if not user:
        user = input("EventKit Username:")
    passwd = os.getenv('EVENTKIT_PASS')
    if not passwd:
        passwd = getpass.getpass("EventKit Password:")

    benchmarker = BenchmarkEventkit(args.url, user, passwd, args.file, args.name, args.sources)
    times = benchmarker.run_tests(batch_sizes=args.batches)
    print(times)


if __name__ == "__main__":
    main()