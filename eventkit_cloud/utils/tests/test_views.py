# -*- coding: utf-8 -*-
import json
import logging
import tempfile

from django.contrib.auth.models import User, Group
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client
from django.test import TestCase, override_settings
from mock import Mock, patch, MagicMock, ANY
from eventkit_cloud.utils.views import map, get_conf_dict

logger = logging.getLogger(__name__)


class TestUtilViews(TestCase):

    def setUp(self):
        group, created = Group.objects.get_or_create(name='TestDefaultExportExtentGroup')
        with patch('eventkit_cloud.jobs.signals.Group') as mock_group:
            mock_group.objects.get.return_value = group
            self.user = User.objects.create_user(
                        username='user', email='user@email.com', password='pass')
        self.client = Client()
        self.client.login(username='user', password='pass')

    # @patch('eventkit_cloud.utils.views.DataProvider')
    @patch('eventkit_cloud.utils.views.cache')
    def test_conf_dict(self, mock_cache: MagicMock):
        ssl_verify: bool = True
        slug: str = 'slug'
        config_yaml: str = 'services: [stuff]'
        expected_config: dict = {'services': ['stuff'],
                                 'globals': {'cache': {'lock_dir': "./locks",
                                                       'tile_lock_dir': "./locks"}}}
        mock_data_provider = Mock(config=config_yaml)
        mock_cache.get_or_set.return_value = mock_data_provider
        returned_conf = get_conf_dict(slug)
        mock_cache.get_or_set.assert_called_once_with(F"DataProvider-{slug}", ANY, 360)
        # print(mock_data_provider.mock_calls)
        # mock_data_provider.objects.get.assert_called_once_with(slug=slug)
        self.assertEquals(returned_conf, expected_config)
