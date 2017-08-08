from __future__ import absolute_import

from contextlib import contextmanager
import os


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


def get_file_paths(directory):

   paths = {}
   with cd(directory):
       for dirpath,_,filenames in os.walk('./'):
           for f in filenames:
               paths[os.path.abspath(os.path.join(dirpath, f))] =  os.path.join(dirpath, f)
   return paths

