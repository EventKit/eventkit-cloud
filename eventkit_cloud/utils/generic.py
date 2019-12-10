import logging
import os

from contextlib import contextmanager
from zipfile import ZipFile, ZIP_DEFLATED

logger = logging.getLogger()


@contextmanager
def cd(newdir):
    prevdir = os.getcwd()
    os.chdir(newdir)
    try:
        yield
    finally:
        os.chdir(prevdir)


def get_file_paths(directory, paths=None):
    paths = paths or dict()
    with cd(directory):
        for dirpath, _, filenames in os.walk("./"):
            for f in filenames:
                paths[os.path.abspath(os.path.join(dirpath, f))] = os.path.join(dirpath, f)
    return paths


def requires_zip(file_format):
    zipped_formats = ["KML", "ESRI Shapefile"]
    if file_format in zipped_formats:
        return True


def create_zip_file(in_file, out_file):
    """

    :param in_file: The file to be compressed.
    :param out_file: The result.
    :return: The archive.
    """
    logger.debug("Creating the zipfile {0} from {1}".format(out_file, in_file))
    with ZipFile(out_file, "a", compression=ZIP_DEFLATED, allowZip64=True) as zipfile:
        if os.path.isdir(in_file):
            # Shapefiles will be all of the layers in a directory.
            # When this gets zipped they will all be in the same zip file.  Some applications (QGIS) will
            # read this without a problem whereas ArcGIS will need the files extracted first.
            file_paths = get_file_paths(in_file)
            for absolute_file_path, relative_file_path in file_paths.items():
                if os.path.isfile(absolute_file_path):
                    zipfile.write(absolute_file_path, arcname=os.path.basename(relative_file_path))
        else:
            zipfile.write(in_file)
    return out_file


def get_zip_name(file_name):
    basename, ext = os.path.splitext(file_name)
    if ext == ".kml":
        return basename + ".kmz"
    return basename + ".zip"
