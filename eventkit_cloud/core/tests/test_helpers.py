# -*- coding: utf-8 -*-


import logging
from unittest.mock import patch, MagicMock

from django.test import TestCase
from mock import Mock

from eventkit_cloud.core.helpers import get_id, get_cached_model, get_model_by_params

logger = logging.getLogger(__name__)


class TestCoreHelpers(TestCase):
    def test_get_id(self):
        username = "test"

        # test regular user (no oauth)
        mock_user = Mock(username=username)
        del mock_user.oauth
        user_identification = get_id(mock_user)
        self.assertEqual(user_identification, username)

        # test oauth user
        mock_user_oauth = Mock(oauth=Mock(identification=username))
        user_identification = str(get_id(mock_user_oauth))
        self.assertEqual(user_identification, username)

    @patch("eventkit_cloud.core.helpers.cache")
    def test_get_cached_model(self, mocked_cache: MagicMock):
        export_provider = MagicMock()
        expected_name = "SomeProvider"
        expected_prop = "slug"
        expected_val = "osm"
        export_provider.__name__ = expected_name

        mocked_cache.get_or_set.return_value = export_provider
        get_model = get_model_by_params(export_provider)

        return_value = get_cached_model(export_provider, expected_prop, expected_val)

        self.assertEquals(export_provider, return_value)
        expected_call_value = f"{expected_name}-{expected_prop}-{expected_val}"

        mocked_cache.get_or_set.assert_called_once_with(expected_call_value, get_model, 360)
