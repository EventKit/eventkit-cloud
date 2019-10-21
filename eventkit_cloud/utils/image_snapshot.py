import os
import requests
import logging
import copy

from PIL import Image
from io import BytesIO

from django.conf import settings
from eventkit_cloud.utils import s3
from eventkit_cloud.jobs.models import MapImageSnapshot
from eventkit_cloud.jobs.helpers import get_provider_image_download_dir

from mapproxy.grid import tile_grid

logger = logging.getLogger(__name__)

WGS84_FULL_WORLD = [-180, -90, 180, 90]


def get_wmts_snapshot_image(base_url, zoom_level, bbox=None):
    """
    Returns an image comprised of all tiles touched by bbox at a given zoom_level for the provided provider URL.

    The higher zoom_level is and the bigger the area encompossed by bbox, the longer this takes. At high zooms this
    can be prohibitively expensive, even if optimized. This function should be used to generate small images of
    small regions or high level (low zoom) snapshots of a map. Full world, zoom level 0 is used to generate Thumbnails.

    :param base_url: URL that tiles are to be requested from, must be formatted with {x], {y}, and {z}
    :param zoom_level: level to look for tiles at.
    :param bbox: region of the world to get tiles for
    :return: A Pillow Image object built for the collected tiles.
    """
    if bbox is None:
        bbox = copy.copy(WGS84_FULL_WORLD)
    # Creates and returns a TileGrid object, let's us specify min_res instead of supplying the resolution list.
    mapproxy_grid = tile_grid(srs=4326, min_res=0.703125,
                              bbox_srs=4326, bbox=copy.copy(WGS84_FULL_WORLD),
                              origin='ul')

    tiles = mapproxy_grid.get_affected_level_tiles(bbox, zoom_level)
    dim_col, dim_row = tiles[1]
    # this will be a generator that returns all affected tile coords, scanning row by row (col increasing first)
    # convert to list for easy access
    tiles = [_tile_coords for _tile_coords in tiles[2]]

    # Grab a tile and read it to get the size we will be working with.
    # This is WMTS, all subsequent tiles will be the same size
    request = requests.get(base_url.format(x=0, y=0, z=0))
    tile = Image.open(BytesIO(request.content))
    size_x, size_y = tile.size  # These should be the same

    # Create the image we will paste all other tiles into.
    snapshot = Image.new('RGB', (size_x * dim_col, size_y * dim_row))
    tile_count = 0
    for _row in range(dim_row):
        for _col in range(dim_col):
            # Capture the coords for this tile.
            tile_coords = tiles[tile_count]
            request = requests.get(base_url.format(x=tile_coords[0], y=tile_coords[1], z=zoom_level))
            tile = Image.open(BytesIO(request.content))
            # Paste this tile into the corresponding position relative to the overall image.
            # Tiles will inserted one after the other, left to right, top to bottom.
            snapshot.paste(im=tile, box=(size_x * _col, size_y * _row))
            tile_count += 1
    return snapshot


def save_thumbnail(base_url, filepath):
    """
    Grab a high level snapshot of a map in EPSG:4326.

    :param base_url: A TMS style URL capable to be formatted with {x}, {y}, and {z}.
    :param filepath: name for the file to be saved as.
    :return: Full filepath on success
    """
    thumbnail = get_wmts_snapshot_image(base_url, zoom_level=0)

    full_filepath = f'{filepath}.jpg'
    thumbnail.thumbnail((90, 45))
    thumbnail.save(full_filepath)
    return full_filepath


def make_thumbnail_downloadable(filepath, provider_uid, download_filename=None):
    filename = os.path.basename(filepath)
    if download_filename is None:
        download_filename = filename

    filesize = os.stat(filepath).st_size
    thumbnail_snapshot = MapImageSnapshot.objects.create(download_url='', filename=filepath, size=filesize)
    if getattr(settings, "USE_S3", False):
        download_url = s3.upload_to_s3(
            thumbnail_snapshot.uid,
            filepath,
            download_filename,
        )
        os.remove(filepath)
    else:
        download_url = os.path.join(get_provider_image_download_dir(provider_uid), download_filename)
    thumbnail_snapshot.download_url = download_url
    thumbnail_snapshot.save()

    return thumbnail_snapshot
