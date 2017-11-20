from __future__ import absolute_import

from contextlib import contextmanager
import os
import subprocess
import zipfile
import shutil
import json

from django.conf import settings
from django.utils import timezone
from django.template.loader import get_template, render_to_string
from celery.utils.log import get_task_logger
from ..utils.gdalutils import driver_for
from uuid import uuid4
from string import Template
from datetime import datetime
import pytz

logger = get_task_logger(__name__)


@contextmanager
def cd(newdir):
    prevdir = os.getcwd()
    os.chdir(newdir)
    try:
        yield
    finally:
        os.chdir(prevdir)


def get_style_files():
    """

    :return: A list of all of the static files used for styles (e.g. icons)
    """
    style_dir = os.path.join(os.path.dirname(__file__), 'static', 'ui', 'styles')
    return get_file_paths(style_dir)


def generate_qgs_style(run_uid=None, export_provider_task=None):
    """
    Task to create QGIS project file with styles for osm.
    """
    from eventkit_cloud.tasks.models import ExportRun
    from ..tasks.export_tasks import TaskStates
    from ..tasks.task_runners import normalize_name
    run = ExportRun.objects.get(uid=run_uid)
    stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(run_uid))

    job_name = run.job.name.lower()

    provider_tasks = run.provider_tasks.all()

    provider_details = []
    if export_provider_task:
        provider_slug = export_provider_task.slug
        provider_detail = {'provider_slug': provider_slug, 'file_path': ''}
        provider_details += [provider_detail]
    else:
        for provider_task in provider_tasks:
            if TaskStates[provider_task.status] not in TaskStates.get_incomplete_states():
                provider_slug = provider_task.slug
                for export_task in provider_task.tasks.all():
                    try:
                        filename = export_task.result.filename
                    except Exception:
                        continue
                    full_file_path = os.path.join(settings.EXPORT_STAGING_ROOT, str(run_uid),
                                                  provider_task.slug, filename)
                    if not os.path.isfile(full_file_path):
                        logger.error("Could not find file {0} for export {1}.".format(full_file_path,
                                                                                      export_task.name))
                        continue
                    # Exclude zip files created by zip_export_provider and the selection geojson
                    if not (full_file_path.endswith(".zip") or full_file_path.endswith(".geojson")):
                        provider_detail = {'provider_slug': provider_slug, 'file_path': full_file_path}
                        provider_details += [provider_detail]

    style_file = os.path.join(stage_dir, '{0}-{1}.qgs'.format(normalize_name(job_name),
                                                              timezone.now().strftime("%Y%m%d")))

    with open(style_file, 'w') as open_file:
        open_file.write(render_to_string('styles/Style.qgs', context={'job_name': normalize_name(job_name),
                                                                      'job_date_time': '{0}'.format(
                                                                          timezone.now().strftime("%Y%m%d%H%M%S%f")[
                                                                          :-3]),
                                                                      'provider_details': provider_details,
                                                                      'bbox': run.job.extents}))
    return style_file


def get_file_paths(directory):
    paths = {}
    with cd(directory):
        for dirpath, _, filenames in os.walk('./'):
            for f in filenames:
                paths[os.path.abspath(os.path.join(dirpath, f))] = os.path.join(dirpath, f)
    return paths


def file_to_geojson(in_memory_file):
    """
    :param in_memory_file: A WSGI In memory file
    :return: A geojson object if available
    """
    stage_dir = settings.EXPORT_STAGING_ROOT.rstrip('\/')
    uid = str(uuid4())
    dir = os.path.join(stage_dir, uid)

    try:
        os.mkdir(dir)
        file_name = in_memory_file.name
        file_name, file_extension = os.path.splitext(file_name)
        if not file_name or not file_extension:
            raise Exception('No file type detected')

        in_path = os.path.join(dir, 'in_{0}{1}'.format(file_name, file_extension))
        out_path = os.path.join(dir, 'out_{0}.geojson'.format(file_name))
        write_uploaded_file(in_memory_file, in_path)

        if file_extension == '.zip':
            if unzip_file(in_path, dir):
                has_shp = False
                for unzipped_file in os.listdir(dir):
                    if unzipped_file.endswith('.shp'):
                        in_path = os.path.join(dir, unzipped_file)
                        has_shp = True
                        break
                if not has_shp:
                    raise Exception('Zip file does not contain a shp')

        driver, raster = driver_for(in_path)

        if not driver:
            raise Exception("Could not find the proper driver to handle this file")

        cmd_template = Template("ogr2ogr -f $fmt $out_ds $in_ds")

        cmd = cmd_template.safe_substitute({
            'fmt': 'geojson',
            'out_ds': out_path,
            'in_ds': in_path
        })

        try:
            proc = subprocess.Popen(cmd, shell=True, executable='/bin/bash')
            proc.wait()
        except Exception as e:
            logger.debug(e)
            raise Exception('Failed to convert file')

        if os.path.exists(out_path):
            geojson = read_json_file(out_path)
            return geojson

        raise Exception('An unknown error occured while processing the file')

    except Exception as e:
        logger.error(e)
        raise e

    finally:
        if os.path.exists(dir):
            shutil.rmtree(dir)


def read_json_file(fp):
    """
    :param fp: Path to a geojson file
    :return: A geojson object
    """
    try:
        with open(fp) as file_geojson:
            geojson = json.load(file_geojson)
            return geojson
    except:
        raise Exception('Unable to read the file')


def unzip_file(fp, dir):
    """
    :param fp: Path to a zip file 
    :param dir: Directory where the files should be unzipped to
    :return: True if successful
    """
    if not fp or not dir:
        return False
    try:
        zip = zipfile.ZipFile(fp, 'r')
        zip.extractall(dir)
        zip.close()
        return True
    except Exception as e:
        logger.debug(e)
        raise Exception('Could not unzip file')


def write_uploaded_file(in_memory_file, write_path):
    """
    :param in_memory_file: An WSGI in memory file
    :param write_path: The path which the file should be written to on disk
    :return: True if successful
    """
    try:
        with open(write_path, 'w+') as temp_file:
            for chunk in in_memory_file.chunks():
                temp_file.write(chunk)
        return True
    except Exception as e:
        logger.debug(e)
        raise Exception('Could not write file to disk')


def set_session_user_last_active_at(request):
    # Set last active time, which is used for auto logout.
    last_active_at = datetime.utcnow().replace(tzinfo=pytz.utc)
    request.session[settings.SESSION_USER_LAST_ACTIVE_AT] = last_active_at.isoformat()

    # Return the last active datetime for convenience.
    return last_active_at
