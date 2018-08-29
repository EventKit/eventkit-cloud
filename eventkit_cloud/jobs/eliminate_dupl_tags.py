

import json
import os

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventkit_cloud.settings.prod')
django.setup()

from eventkit_cloud.jobs.models import DatamodelPreset

osm = DatamodelPreset.objects.get(name='osm')
hdm = DatamodelPreset.objects.get(name='hdm')


def merge_dups(dmp):
    # Takes a DatamodelPreset instance and returns a dict of the form {(key, value): {key: <key>, value: <value>, geom: []}
    # This is indended to make it easy to eliminate duplicates in the json_tags field of DatamodelPreset instances.
    previous_count = len(dmp.json_tags)
    dmp_tags = dict()
    for tag in dmp.json_tags:
        if type(tag) != dict:
            print('Invalid tag, ignoring: {}'.format(tag))
            continue

        if (tag['key'], tag['value']) in dmp_tags:
            previous_tag = dmp_tags[(tag['key'], tag['value'])]
            print('matching tag: {}'.format(tag))
            print('previous tag: {}'.format(previous_tag))
            if type(previous_tag) != dict:
                print('Invalid tag, ignoring')
                continue
            print('new geom: {}'.format(tag['geom']))
            print('current geom: {}'.format(dmp_tags[(tag['key'], tag['value'])]))
            new_tag_geom = set(tag['geom'])
            previous_tag_geom = set(previous_tag['geom'])
            new_geom = list(new_tag_geom | previous_tag_geom)
            print('merged geom: {}'.format(new_geom))
            dmp_tags[(tag['key'], tag['value'])] = new_geom
        else:
            print('new tag: {}'.format(tag))
            if type(tag) == dict:
                dmp_tags[(tag['key'], tag['value'])] = tag
            else:
                print('unexpected tag type: {}'.format(type(tag)))
    new_count = len(dmp_tags)
    print('Reduced {}->{} tags'.format(previous_count, new_count))
    return dmp_tags

unique_osm = merge_dups(osm)
print('osm tags:')
print(json.dumps(list(unique_osm.values())))
print()
unique_hdm = merge_dups(hdm)
print('hdm tags:')
print(json.dumps(list(unique_hdm.values())))
