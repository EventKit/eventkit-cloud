# -*- coding: utf-8 -*-


import logging

from django.test import TestCase
from mock import Mock

from eventkit_cloud.core.helpers import get_id

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
