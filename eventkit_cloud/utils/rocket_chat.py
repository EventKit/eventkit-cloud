from typing import Optional
import requests
import json


class RocketChat(object):
    def __init__(self, url: str, username: Optional[str]=None, password: Optional[str]=None, auth_token: Optional[str]=None, user_id: Optional[str]=None, **kwargs):
        self.base_url = url
        self.login_url = f"{self.base_url}/api/v1/login"
        self.message_url = f"{self.base_url}/api/v1/chat.postMessage"
        self.home_url = f"{self.base_url}/home"
        self.profile_url = f"{self.base_url}/api/v1/me"
        self.headers = None
        if username and password:
            response = requests.post(
                self.login_url,
                data={"username": username, "password": password},
                headers={"X-Auth-Token": auth_token, "X-User-Id": user_id},
            )
            if response.ok:
                data = response.json()
                self.user_id = data["data"]["userId"]
                self.auth_token = data["data"]["authToken"]
            else:
                raise Exception(f"Unable to login with username: {username} and the provided password")
        elif user_id and auth_token:
            self.auth_token = auth_token
            self.user_id = user_id
        else:
            raise Exception("Unable to login without a username/password or user_id/auth_token.")
        self.headers = {"X-Auth-Token": self.auth_token, "X-User-Id": self.user_id, "Content-type": "application/json"}
        # Make a request to ensure that the credentials are ok.
        response = requests.get(self.profile_url, headers=self.headers, verify=False)
        if not response.ok:
            print(response.content)
            raise Exception(f"Unable to get profile.")

    def post_message(self, channel: str, message: str):
        data = {"channel": channel, "text": message}
        response = requests.post(self.message_url, headers=self.headers, data=json.dumps(data), verify=False)
        if not response.ok:
            print(response.content)
            raise Exception(f"Failed to send {channel} the message: {message}")
