from __future__ import absolute_import

from contextlib import contextmanager
import os

from django.conf import settings
from django.utils import timezone
from django.template.loader import get_template, render_to_string


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
    run = ExportRun.objects.get(uid=run_uid)
    stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(run_uid))

    job_name = run.job.name.lower()

    gpkg_file = '{}.gpkg'.format(job_name)
    style_file = os.path.join(stage_dir, '{0}-{1}.qgs'.format(job_name,
                                                                  timezone.now().strftime("%Y%m%d")))

    with open(style_file, 'w') as open_file:
        open_file.write(render_to_string('styles/Style.qgs', context={'gpkg_filename': os.path.basename(gpkg_file),
                                                                      'layer_id_prefix': '{0}-osm-{1}'.format(job_name,
                                                                                                              timezone.now().strftime(
                                                                                                                  "%Y%m%d")),
                                                                      'layer_id_date_time': '{0}'.format(
                                                                          timezone.now().strftime("%Y%m%d%H%M%S%f")[
                                                                          :-3]),
                                                                      'bbox': run.job.extents,
                                                                      'job_name' : job_name}))
    return style_file

def get_file_paths(directory):

   paths = {}
   with cd(directory):
       for dirpath,_,filenames in os.walk('./'):
           for f in filenames:
               paths[os.path.abspath(os.path.join(dirpath, f))] =  os.path.join(dirpath, f)
   return paths
