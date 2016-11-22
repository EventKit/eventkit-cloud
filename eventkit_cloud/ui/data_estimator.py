from mapproxy import srs as mapproxy_srs
from mapproxy import grid as mapproxy_grid
from eventkit_cloud.jobs.models import ExportProvider
from django.core.exceptions import ObjectDoesNotExist


def get_size_estimate(provider, bbox):
        """
        Args:
            provider: The name of the provider, corresponds to the name field in Export Provider model
            bbox: A bbox in the format of an array

        Returns: Estimated size in GB
        """
        try:
            provider = ExportProvider.objects.get(name=provider)
        except ObjectDoesNotExist:
            return None
        lvl_from = provider.level_from
        lvl_to = provider.level_to
        srs = mapproxy_srs.SRS(4326)
        bbox = mapproxy_grid.grid_bbox(tuple(bbox), srs, srs)
        tile_grid = mapproxy_grid.tile_grid(srs=srs, bbox=bbox, bbox_srs=srs, num_levels=20, res_factor='sqrt2')

        total_tiles = 0
        tiles = []

        for level in range(lvl_from, lvl_to+1):
            # get_affected_level_tiles returns a tuple with first item being bbox,
            # second item being a tuple with (width, height) of tile grid, third
            # item being a list of tile coordinates
            result = tile_grid.get_affected_level_tiles(bbox, level)
            total_tiles += result[1][0]*result[1][1]
            tiles.append(result[1][0]*result[1][1])
        return [total_tiles, get_gb_estimate(total_tiles), tiles, bbox]


def get_gb_estimate(total_tiles, tile_width=256, tile_height=256):
    # the literal number there is the average pixels/GB ratio for tiles.
    # I got it by taking ~30 sample tiles from a sample cache, averaging
    # their size, and dividing the pixels per tile by average size.
    gigs_per_pixel_constant = 0.000000000302036202936
    return total_tiles*tile_width*tile_height*gigs_per_pixel_constant
