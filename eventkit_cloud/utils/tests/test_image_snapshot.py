import logging

from unittest.mock import patch, Mock, MagicMock
from django.test import TestCase
from eventkit_cloud.utils.image_snapshot import (
    get_tile,
    get_wmts_snapshot_image,
    save_thumbnail,
    make_thumbnail_downloadable,
    get_width,
    get_height,
    get_resolution_for_extent,
)

logger = logging.getLogger(__name__)


class TestImageSnapshot(TestCase):
    @patch("eventkit_cloud.utils.image_snapshot.Image")
    @patch("eventkit_cloud.utils.image_snapshot.get_tile")
    @patch("eventkit_cloud.utils.image_snapshot.create_mapproxy_app")
    def test_get_wmts_snapshot_image(self, mock_create_mapproxy_app, mock_get_tile, mock_image):
        test_slug = "slug"
        test_url = f"http://url.test/map/{test_slug}/path/to/service"
        test_zoom_level = 0
        mock_get_tile.return_value = Mock(size=(1, 1))
        mocked_image_object = MagicMock()
        mock_image.new.return_value = mocked_image_object
        mock_mapproxy_app = Mock()
        mock_create_mapproxy_app.return_value = mock_mapproxy_app
        test_bbox = [-180, -90, 180, 90]
        with self.settings(SITE_NAME="url.test"):
            returned_value = get_wmts_snapshot_image(test_url, test_zoom_level, test_bbox)
            self.assertEquals(mocked_image_object, returned_value)
            mock_create_mapproxy_app.assert_called_once_with(test_slug)
            mock_mapproxy_app.get.assert_called()
            mocked_image_object.paste.assert_called()
            mock_get_tile.assert_called()

    @patch("eventkit_cloud.utils.image_snapshot.BytesIO")
    @patch("eventkit_cloud.utils.image_snapshot.Image")
    def test_get_tiles(self, mock_image, mock_bytesio):
        expected_content = "An Image"

        mocked_response = Mock(content=expected_content)
        mock_bytesio.return_value = expected_content
        mock_image.open.return_value = expected_content
        returned_image = get_tile(mocked_response)
        mock_bytesio.called_once_with(expected_content)
        mock_image.called_once_with(expected_content)
        self.assertEquals(returned_image, expected_content)

        mocked_response = Mock(body=expected_content)
        mock_bytesio.return_value = expected_content
        mock_image.open.return_value = expected_content
        returned_image = get_tile(mocked_response)
        mock_bytesio.called_once_with(expected_content)
        mock_image.called_once_with(expected_content)
        self.assertEquals(returned_image, expected_content)

    @patch("eventkit_cloud.utils.image_snapshot.get_wmts_snapshot_image")
    def test_save_thumbnail(self, mock_get_wmts_snapshot_image):
        mock_thumbnail = MagicMock()
        thumbnail_size = (90, 45)
        example_filepath = "/some/path"
        expected_file_path = f"{example_filepath}.jpg"
        test_slug = "slug"
        test_url = f"http://url.test/map/{test_slug}/path/to/service"
        mock_get_wmts_snapshot_image.return_value = mock_thumbnail
        returned_path = save_thumbnail(test_url, example_filepath)
        mock_thumbnail.thumbnail.called_once_with(thumbnail_size)
        mock_thumbnail.save.assert_called()
        self.assertEquals(expected_file_path, returned_path)

    @patch("eventkit_cloud.utils.image_snapshot.make_dirs")
    @patch("eventkit_cloud.utils.image_snapshot.MapImageSnapshot")
    def test_make_thumbnail_downloadable(self, mock_map_image_snapshot, mock_make_dirs):
        example_filepath = "/some/path/file.jpg"
        example_uid = "UID"
        expected_size = "1000"
        mock_snapshot = MagicMock()
        mock_map_image_snapshot.objects.create.return_value = mock_snapshot
        with self.settings(USE_S3=False), patch("eventkit_cloud.utils.image_snapshot.os") as mock_os, patch(
            "eventkit_cloud.utils.image_snapshot.shutil"
        ) as mock_shutil:
            mock_os.stat().return_value = Mock(expected_size)
            returned_snapshot = make_thumbnail_downloadable(example_filepath, example_uid)
            mock_map_image_snapshot.objects.create.called_once_with(
                download_url="", filename=example_filepath, size=expected_size
            )
            mock_shutil.copy.assert_called_once()
            mock_snapshot.save.assert_called_once()
            self.assertEquals(returned_snapshot, mock_snapshot)

    @patch("eventkit_cloud.utils.image_snapshot.get_height")
    @patch("eventkit_cloud.utils.image_snapshot.get_width")
    def test_get_resolution_for_extent(self, mock_get_width, mock_get_height):
        extent = (-180, -90, 180, 90)
        mock_get_width.return_value = 360
        mock_get_height.return_value = 180
        resolution = get_resolution_for_extent(extent)
        self.assertEqual(resolution, 0.3515625)

    def test_get_width(self):
        extent = (-180, -90, 180, 90)
        width = get_width(extent)
        self.assertEqual(width, 360)

    def test_get_height(self):
        extent = (-180, -90, 180, 90)
        height = get_height(extent)
        self.assertEqual(height, 180)
