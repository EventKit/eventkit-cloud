from celery.utils.log import get_task_logger

from eventkit_cloud.utils.gpkg.gpkg_util import Geopackage
from eventkit_cloud.utils.gpkg.nsg_metadata_generator import Generator
from eventkit_cloud.utils.gpkg.sqlite_utils import get_database_connection

# Get an instance of a logger
logger = get_task_logger(__name__)


def build_abstract(*args):
    """Combines multiple messages into a single abstract over multiple lines."""
    return '\n'.join([_arg for _arg in args if _arg])


def add_geopackage_metadata(filepath, job, provider):
    """Add metadata information to the geopackage at the specified location."""
    bbox = job.extents
    job_description = job.description
    provider_description = provider.service_description
    # Read layers from the geopackage, these all need to be added to the metadata
    # Layers are the entries in `gpkg_contents` -- each entry has a corresponding table with data.
    with get_database_connection(filepath) as conn:
        cursor = conn.cursor()
        layers = Geopackage.get_layers(cursor)

    # Create a Generator object that will handle adding the necessary XML.
    generator = Generator(filepath, logger)
    for _layer in layers:
        # Add a layer identity to the meta data. If already present, the identity will be updated.
        generator.add_layer_identity(table_name=_layer['table_name'],
                                     abstract_msg=build_abstract(job_description,
                                                                 provider_description,
                                                                 _layer['description']),
                                     bbox=dict(min_x=_layer['min_x'] or bbox[0], min_y=_layer['min_y'] or bbox[1],
                                               max_x=_layer['max_x'] or bbox[2], max_y=_layer['max_y'] or bbox[3]),
                                     srs_id=_layer['srs_id'], srs_organization='EPSG',
                                     organization_name='EventKit')
    generator.write_metadata()


metadata_tasks = {'.gpkg': add_geopackage_metadata}
