import os
from django.test import TestCase
from mock import Mock, patch, call, mock_open
from ..middleware import IERedirect


class TestIERedirect(TestCase):
    def test_get_response(self):
        fake_request = Mock()
        fake_response = Mock()
        fake_get = Mock()
        fake_get.return_value = fake_response
        ie = IERedirect(fake_get)
        ret = ie(fake_request)
        fake_get.assert_called_with(fake_request)
        self.assertEqual(ret, fake_response)

    @patch('eventkit_cloud.ui.middleware.TemplateResponse')
    def test_process_template_response(self, template):
        ie = IERedirect(Mock())
        fake_request = Mock()
        fake_request.META = {'HTTP_USER_AGENT': 'something something MSIE'}
        default_response = Mock()
        template_response = Mock()
        template.return_value = template_response
        ret = ie.process_template_response(fake_request, default_response)
        self.assertEqual(ret, template_response)
        self.assertNotEqual(ret, default_response)

        fake_request.META = {'HTTP_USER_AGENT': 'not in here'}
        ret = ie.process_template_response(fake_request, default_response)
        self.assertEqual(ret, default_response)
        self.assertNotEqual(ret, template_response)
