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
        # levels = range(provider.level_from, provider.level_to+1)
        levels = range(0, 20)
        # hard coded for testing
        bbox = (-71.036536, 42.348070, -71.035259, 42.348927)
        bbox_srs = mapproxy_srs.SRS(4326)
        srs = mapproxy_srs.SRS(4326)
        bbox = mapproxy_grid.grid_bbox(bbox, bbox_srs, srs)

        # def tile_grid_for_epsg(epsg, bbox=None, tile_size=(256, 256), res=None):
        tile_grid = mapproxy_grid.tile_grid_for_epsg('4326', bbox=bbox, tile_size=(256, 256))
        total_tiles = 0
        for level in tile_grid.grid_sizes.iteritems():
            if levels[0] <= int(level[0]) <= levels[len(levels) - 1]:
                # get_affected_level_tiles() returns a list with three
                # things: first a tuple with the bounding box, second
                # the height and width in tiles, and third a list of tile
                # coordinate tuples. result[1] gives the tuple with
                # the width/height of the desired set of tiles.
                result = tile_grid.get_affected_level_tiles(bbox, int(level[0]))
                total_tiles += result[1][0] * result[1][1]
        print [total_tiles, get_gb_estimate(total_tiles)]
        # return [total_tiles, get_gb_estimate(total_tiles)]


def get_gb_estimate(total_tiles, tile_width=256, tile_height=256):
    # the literal number there is the average pixels/GB ratio for tiles.
    # I got it by taking ~30 sample tiles from a sample cache, averaging
    # their size, and dividing the pixels per tile by average size.
    gigs_per_pixel_constant = 0.000000000302036202936
    return total_tiles*tile_width*tile_height*gigs_per_pixel_constant

