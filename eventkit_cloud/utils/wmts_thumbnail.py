from PIL import Image
import requests
from io import BytesIO


def save_thumbnail(base_url, filepath):
    """
    Grab a high level snapshot of a map in EPSG:4326.

    :param base_url: A TMS style URL capable to be formatted with {x}, {y}, and {z}.
    :param filepath: name for the file to be saved as.
    :return: Full filepath on success
    """

    def _map_to_coord(coordinate, zoom_level=0):
        return dict(z=zoom_level, y=coordinate[0], x=coordinate[1])

    # coords in (y, x) ordering
    # This can be expanded if we want to grab from a higher zoom level.
    coords = [(0, 0), (0, 1)]

    request = requests.get(base_url.format(**_map_to_coord(coords[0])))
    img = Image.open(BytesIO(request.content))
    size_x, size_y = img.size
    thumbnail = Image.new('RGB', (size_x * 2, size_y))
    thumbnail.paste(im=img, box=(0, 0))

    request = requests.get(base_url.format(**_map_to_coord(coords[1])))
    img = Image.open(BytesIO(request.content))
    thumbnail.paste(im=img, box=(size_x, 0))

    full_filepath = filepath + '.jpg'
    thumbnail.thumbnail((90, 45))
    thumbnail.save(full_filepath)
    return full_filepath
