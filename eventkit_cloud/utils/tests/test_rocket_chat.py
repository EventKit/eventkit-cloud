from django.test import TestCase
from eventkit_cloud.utils.rocket_chat import RocketChat
import json
import requests_mock


class TestRocketChatClient(TestCase):
    def setUp(self):
        self.mock_requests = requests_mock.Mocker()
        self.mock_requests.start()
        self.addCleanup(self.mock_requests.stop)

        self.url = "http://api.example.dev"
        self.username = "username"
        self.password = "password"
        self.auth_token = "auth_token"
        self.user_id = "user_id"
        self.channel = "channel"
        self.message = "message"
        self.data = json.dumps({"channel": self.channel, "text": self.message})

    def test_no_auth_provided(self):
        with self.assertRaises(Exception):
            self.client = RocketChat(url=self.url)

    def test_invalid_username_password(self):
        login_url = f"{self.url}/api/v1/login"
        profile_url = f"{self.url}/api/v1/me"
        self.mock_requests.post(login_url, status_code=401)

        with self.assertRaises(Exception):
            self.client = RocketChat(url=self.url, username=self.username, password=self.password)

    def test_invalid_auth_token(self):
        profile_url = f"{self.url}/api/v1/me"
        self.mock_requests.get(profile_url, status_code=401)

        with self.assertRaises(Exception):
            self.client = RocketChat(url=self.url, auth_token=self.auth_token, user_id=self.user_id)

    def test_failed_message(self):
        profile_url = f"{self.url}/api/v1/me"
        message_url = f"{self.url}/api/v1/chat.postMessage"

        self.mock_requests.get(profile_url, status_code=200)
        self.mock_requests.post(message_url, status_code=400)

        self.client = RocketChat(url=self.url, auth_token=self.auth_token, user_id=self.user_id)

        with self.assertRaises(Exception):
            self.client.post_message(self.channel, self.message)

    def test_get_token_with_username_password(self):
        login_url = f"{self.url}/api/v1/login"
        profile_url = f"{self.url}/api/v1/me"
        example_response = {"data": {"userId": self.user_id, "authToken": self.auth_token}}

        self.mock_requests.post(login_url, status_code=200, text=json.dumps(example_response))
        self.mock_requests.get(profile_url, status_code=200)

        self.client = RocketChat(url=self.url, username=self.username, password=self.password)

        self.assertEqual(self.user_id, self.client.user_id)
        self.assertEqual(self.auth_token, self.client.auth_token)

    def test_post_message(self):
        profile_url = f"{self.url}/api/v1/me"
        message_url = f"{self.url}/api/v1/chat.postMessage"
        self.mock_requests.get(profile_url, status_code=200)

        self.client = RocketChat(url=self.url, auth_token=self.auth_token, user_id=self.user_id)
        self.mock_requests.post(message_url, headers=self.headers, text=json.dumps(self.data))

        self.client.post_message(self.channel, self.message)
        self.assertEqual(self.mock_requests.last_request.url, message_url)
        self.assertEqual(self.mock_requests.last_request.headers["X-Auth-Token"], self.auth_token)
        self.assertEqual(self.mock_requests.last_request.headers["X-User-Id"], self.user_id)
        self.assertEqual(self.mock_requests.last_request.text, self.data)
