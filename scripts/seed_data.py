# -*- coding: utf-8 -*-
import argparse
import getpass
import json
import logging
import os

from eventkit_cloud.utils.client import EventKitClient

logging.basicConfig(format='%(levelname)s:%(message)s', level=os.getenv("LOG_LEVEL", "WARNING"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('url', help='The EventKit instance base url (i.e. http://cloud.eventkit.test).')
    parser.add_argument('file', help='A geojson file to be used for location data.')
    parser.add_argument('--name', default='name', help='The field to be used for the name of the location which will be the datapack name.')
    parser.add_argument('--description', default='description',
                        help='The field to be used for the description of the location which will be the datapack description.')
    parser.add_argument('--project', default='project',
                        help='The project name, will be the same for all datapacks (not based on file).')
    parser.add_argument('--sources', nargs='*', default='',
                        help='The project name, will be the same for all datapacks (not based on file).')
    parser.add_argument('--limit', type=int, default=0,
                        help='The project name, will be the same for all datapacks (not based on file).')
    parser.add_argument('--start', type=int, default=0,
                        help='The index (0-based) of the first geojson feature to use to create a datapack')
    args = parser.parse_args()
    user = os.getenv('EVENTKIT_USER')
    if not user:
        user = getpass.getpass("EventKit Username:")
    password = os.getenv('EVENTKIT_PASS')
    if not password:
        password = getpass.getpass("EventKit Password:")

    client = EventKitClient(args.url.rstrip('/'), user, password)
    if args.sources:
        provider_tasks = []
        for provider in client.get_providers():
            if provider.get('slug') in args.sources:
                provider_tasks += [{"provider": provider.get('name'), "formats": ["gpkg"]}]
    else:
        provider_tasks = [{"provider": provider.get('name'), "formats": ["gpkg"]} for provider in client.get_providers()]

    with open(args.file, 'rb') as geojson_file:
        geojson_data = json.load(geojson_file)

    count = args.limit or len(geojson_data['features'])
    index = args.start

    while count or (index > len(geojson_data['features'])):
        feature = geojson_data['features'][index]
        index += 1
        name = feature['properties'].get(args.name)

        description = feature['properties'].get(args.description) or "Created using the seed_data script."
        project = feature['properties'].get(args.project) or "seed"
        if name in [run['job']['name'] for run in client.get_runs(search_term=name)]:
            print(("Skipping {0} because data already exists in a DataPack with the same name.".format(name)))
            continue
        if not name:
            print(("Skipping: \n {0} \n"
                  "because a valid name wasn't provided or found.".format(feature)))
            continue
        response = client.run_job(name=name, description=description, project=project,
                                  provider_tasks=provider_tasks, selection=feature)

        if response:
            print(('Submitted job for {0}'.format(name)))
            count -= 1
        else:
            print(('Failed to submit job for {0}'.format(name)))
            print(response)


if __name__ == "__main__":
    main()