from django.core.exceptions import ObjectDoesNotExist
from mapproxy import grid as mapproxy_grid
from mapproxy import srs as mapproxy_srs

from eventkit_cloud.jobs.models import DataProvider


def get_size_estimate(provider, bbox, srs='3857'):
    """
    Args:
        provider: The name of the provider, corresponds to the name field in Export Provider model
        bbox: A bbox in the format of an array
        srs: An EPSG code for the map being used.

    Returns: Estimated size in GB
    """
    try:
        provider = DataProvider.objects.get(name=provider)
    except ObjectDoesNotExist:
        return None
    levels = range(provider.level_from, provider.level_to+1)
    req_srs = mapproxy_srs.SRS(srs)
    bbox = mapproxy_grid.grid_bbox(bbox, mapproxy_srs.SRS(4326), req_srs)

    tile_size = (256, 256)
    tile_grid = mapproxy_grid.TileGrid(srs, tile_size=tile_size, levels=len(levels))
    total_tiles = 0
    tiles = []
    for level in levels:
        # get_affected_level_tiles() returns a list with three
        # things: first a tuple with the bounding box, second
        # the height and width in tiles, and third a list of tile
        # coordinate tuples. result[1] gives the tuple with
        # the width/height of the desired set of tiles.
        result = tile_grid.get_affected_level_tiles(bbox, int(level))
        total_tiles += result[1][0] * result[1][1]
        tiles.append(result[1][0] * result[1][1])
    return [total_tiles, get_gb_estimate(total_tiles), tiles]


def get_gb_estimate(total_tiles, tile_width=256, tile_height=256):
    # the literal number there is the average pixels/GB ratio for tiles.
    gigs_per_pixel_constant = 0.0000000006
    return total_tiles*tile_width*tile_height*gigs_per_pixel_constant

