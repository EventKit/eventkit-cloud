import logging
import os

from django.conf import settings
import xml.etree.Element
import xml.etree.ElementTree as ET

logger = logging.getLogger()


def get_relative_path_from_staging(staging_path):
    """
    Tries to return a relative path from staging

    :param staging_path: Full file path positioned within the staging dir.
    :return: relative path or empty
    """
    staging_dir = settings.EXPORT_STAGING_ROOT.lstrip(os.path.sep).rstrip(os.path.sep)
    staging_path = staging_path.lstrip(os.path.sep)
    if staging_dir in staging_path:
        return staging_path.replace(staging_dir, "")
    return staging_path


def get_download_paths(relative_path):
    downloads_filepath = os.path.join(
        settings.EXPORT_DOWNLOAD_ROOT.rstrip(os.path.sep), relative_path.lstrip(os.path.sep),
    )
    download_url = os.path.join(settings.EXPORT_MEDIA_ROOT.rstrip(os.path.sep), relative_path.lstrip(os.path.sep),)
    return downloads_filepath, download_url


def extract_kml_styles(kml_file_path: str) -> str:
    """
    Parses KML document for styles descriptors and maps them to file names then stores the result in a file to be
    mapped into a kml file.
    :param kml_file_path: A path to a kml file.
    :return: A file path to the location of the stored styles
    """
    placemarks = get_all_kml_placemarks(kml_file_path)
    for placemark in placemarks:



def get_all_kml_placemarks(kml_file_path: str) -> List[xml.etree.Element]:
    namespaces = {'kml': 'http://www.opengis.net/kml/2.2'}
    tree = ET.parse('output.kml')
    root = tree.getroot()
    # xpath -> findall from this node (root) for all subnodes in entire tree.
    return root.findall('.//kml:Placemark', namespaces)
