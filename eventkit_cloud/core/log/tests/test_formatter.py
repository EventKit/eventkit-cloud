import sys
from unittest.mock import Mock, patch

from django.test import TestCase

from eventkit_cloud.core.log.formatter import Formatter


class TestFormatter(TestCase):
    @patch("eventkit_cloud.core.log.formatter.logging.Formatter.formatMessage")
    def test_formatMessage(self, mock_formatMessage):
        test_message = """A
Newline"""
        mock_formatMessage.return_value = test_message
        formatter = Formatter()
        # Mock is passed in only to not confuse anyone.  Normally it would be a LogRecord,
        # but since we are just mocking the super class its not important what we pass-in
        with self.settings(LOGGING_SINGLE_LINE_OUTPUT=False):
            self.assertEqual(test_message, formatter.formatMessage(Mock()))
        with self.settings(LOGGING_SINGLE_LINE_OUTPUT=True):
            expected_response = r"A\nNewline"
            self.assertEqual(expected_response, formatter.formatMessage(Mock()))

    @patch("eventkit_cloud.core.log.formatter.io.StringIO")
    @patch("builtins.print")
    def test_formatException(self, mock_print, mock_IO):
        formatter = Formatter()
        try:
            raise Exception("Test")
        except Exception:
            with self.settings(LOGGING_SINGLE_LINE_OUTPUT=True):
                formatter.formatException(sys.exc_info())
                self.assertEqual(len(mock_print.mock_calls), 1)
            with self.settings(LOGGING_SINGLE_LINE_OUTPUT=False):
                formatter.formatException(sys.exc_info())
                self.assertGreater(len(mock_print.mock_calls), 1)
