# -*- coding: utf-8 -*-


import json
import logging

import requests
import requests_mock
from django.conf import settings
from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from mock import patch

from eventkit_cloud.core.models import validate_object

logger = logging.getLogger(__name__)


class TestHelpers(TestCase):
    def test_validate_object(self):
        filter = '[["MyGroup", "in", "groups"], "or", ["student", "==", "employmentStatus"]]'
        user = {"employmentStatus": "student"}
        self.assertTrue(validate_object(json.loads(filter), user))
        user = {"groups": "[MyGroup]"}
        self.assertTrue(validate_object(json.loads(filter), user))
        user = {"groups": "[OtherGroup]"}
        self.assertFalse(validate_object(json.loads(filter), user))

        filter = '[["MyGroup", "in", "groups"], "and", ["student", "==", "employmentStatus"]]'
        user = {"employmentStatus": "student", "groups": "[MyGroup]"}
        self.assertTrue(validate_object(json.loads(filter), user))
        user = {"employmentStatus": "student", "groups": "[OtherGroup]"}
        self.assertFalse(validate_object(json.loads(filter), user))

        filter = '["unemployed", "==", "employmentStatus"]'
        user = {"employmentStatus": "student"}
        self.assertFalse(validate_object(json.loads(filter), user))
        user = {"employmentStatus": "unemployed"}
        self.assertTrue(validate_object(json.loads(filter), user))

        filter = '["unemployed", "!=", "employmentStatus"]'
        user = {"employmentStatus": "student"}
        self.assertTrue(validate_object(json.loads(filter), user))
        user = {"employmentStatus": "unemployed"}
        self.assertFalse(validate_object(json.loads(filter), user))

        filter = '["none", "is", "employmentStatus"]'
        user = {"name": "Bob"}
        self.assertTrue(validate_object(json.loads(filter), user))
        user = {"employmentStatus": "student"}
        self.assertFalse(validate_object(json.loads(filter), user))

        filter = '["none", "is not", "employmentStatus"]'
        user = {"employmentStatus": "student"}
        self.assertTrue(validate_object(json.loads(filter), user))
        user = {"name": "Bob"}
        self.assertFalse(validate_object(json.loads(filter), user))

        filter = '[4, ">", "age"]'
        user = {"age": 4}
        self.assertFalse(validate_object(json.loads(filter), user))
        user = {"age": 3}
        self.assertTrue(validate_object(json.loads(filter), user))

        filter = '[4, ">=", "age"]'
        user = {"age": 5}
        self.assertFalse(validate_object(json.loads(filter), user))
        user = {"age": 4}
        self.assertTrue(validate_object(json.loads(filter), user))
        user = {"age": 3}
        self.assertTrue(validate_object(json.loads(filter), user))

        filter = '[4, "<", "age"]'
        user = {"age": 4}
        self.assertFalse(validate_object(json.loads(filter), user))
        user = {"age": 5}
        self.assertTrue(validate_object(json.loads(filter), user))

        filter = '[4, "<=", "age"]'
        user = {"age": 3}
        self.assertFalse(validate_object(json.loads(filter), user))
        user = {"age": 4}
        self.assertTrue(validate_object(json.loads(filter), user))
        user = {"age": 5}
        self.assertTrue(validate_object(json.loads(filter), user))

        filter = '[[["Bob", "==", "name"], "and", ["manager", "==", "position"]], "or", ["Jan", "==", "name"]]'
        user = {"name": "Bob"}
        self.assertFalse(validate_object(json.loads(filter), user))
        user = {"position": "manager"}
        self.assertFalse(validate_object(json.loads(filter), user))
        user = {"name": "Bob", "position": "manager"}
        self.assertTrue(validate_object(json.loads(filter), user))
        user = {"name": "Jan"}
        self.assertTrue(validate_object(json.loads(filter), user))
