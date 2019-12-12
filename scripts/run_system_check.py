# -*- coding: utf-8 -*-
import argparse
import getpass
import logging
import os
import time

from eventkit_cloud.utils.client import EventKitClient

logger = logging.getLogger(__name__)


def string2bool(string_value):
    """

    :param string_value: A value to attempt to convert to a boolean.
    :return: True if "true","t",1,"yes","y", False if "false","f",0',"no,"n", else returns the original value
    """
    if string_value.lower() in ["true", "t", 1, "yes", "y"]:
        return True
    if string_value.lower() in ["false", "f", 0, "no", "n"]:
        return False
    return string_value


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('url', help='The EventKit instance base url (i.e. http://cloud.eventkit.test).')
    parser.add_argument('--verify', default='',
                        help='True to enable ssl verification, false to disable ssl verification')
    parser.add_argument('--certificate', default='',
                        help='The path to a certificate to use for authentication')
    parser.add_argument('--full', default='',
                        help='')

    args = parser.parse_args()
    user = password = None
    certificate = args.certificate
    if not certificate:
        user = os.getenv('EVENTKIT_USER')
        if not user:
            user = input("EventKit Username: ")
        password = os.getenv('EVENTKIT_PASS')
        if not password:
            password = getpass.getpass("EventKit Password: ")

    if args.verify:
        verify = string2bool(args.verify)
    else:
        verify = True

    full_test = string2bool(args.full)

    tries = 3
    client = None
    while tries:
        print("Logging in...")
        try:
            client = EventKitClient(args.url.rstrip('/'), username=user, password=password, certificate=certificate,
                                    verify=verify)
            break
        except Exception as e:
            tries -= 1
            print("Failed to login.")
            print(e)
            print("{} attempts remaining.".format(tries))
            time.sleep(1)
    if not client:
        raise Exception(
            "Could not login to the url: {} using username:{} or certificate:{}".format(args.url, user, certificate))

    providers = client.get_providers()

    if full_test:
        provider_tasks = []

        for provider in providers:
            if provider.get('display'):
                level = provider.get('level_from')
                # Check if level is 0 because job api won't recognize it as a value
                if not level:
                    level = 1
                provider_tasks += [
                    {"provider": provider.get('name'), "formats": ["gpkg"], "min_zoom": level, 'max_zoom': level}]

        feature = {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {},
                                                              "geometry": {"type": "Polygon", "coordinates": [
                                                                  [[31.128165, 29.971509], [31.128521, 29.971509],
                                                                   [31.128521, 29.971804], [31.128165, 29.971804],
                                                                   [31.128165, 29.971509]]]}}]}

        name = "System Check"
        description = "This is a small periodic check to ensure the application is healthy."
        project = "System"
        print("Submitting job with provider_tasks: {}".format(provider_tasks))
        response = client.create_job(name=name, description=description, project=project,
                                     provider_tasks=provider_tasks, selection=feature)
        print("Successfully submitted the job.")
        job_uid = response.get('uid')

        run_uid = client.get_runs({"job_uid": job_uid})[0].get('uid')
        print("Waiting for run {} to finish...".format(run_uid))
        client.wait_for_run(run_uid)
        print("Run {} successfully finished.".format(run_uid))
        print("Attempting to delete the run {}.".format(run_uid))

        run = client.get_runs({"job_uid": job_uid})
        attempts = 3
        while run and attempts:
            client.delete_run(run_uid)
            run = client.get_runs({"job_uid": job_uid})[0]
            if run['deleted']:
                break
            else:
                attempts -= 1
        if not run['deleted']:
            raise Exception("Failed to delete the run {}.".format(run_uid))
        print("Successfully deleted the run {}.".format(run_uid))
    else:
        print('Running status checks...')
        bad_providers = []
        for provider in providers:
            if not provider.get('visible'):
                continue
            if not client.check_provider(provider.get('slug')):
                bad_providers += [provider.get('name')]
        if bad_providers:
            raise Exception("The following providers failed status checks: {0}".format(bad_providers))

    print("System check completed successfully.")

if __name__ == "__main__":
    main()
