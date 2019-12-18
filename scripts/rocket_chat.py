import requests
import json


class RocketChat(object):
    def __init__(self, url=None, username=None, password=None, auth_token=None, user_id=None):
        self.base_url = url
        self.login_url = F"{self.base_url}api/v1/login"
        self.message_url = F"{self.base_url}/api/v1/chat.postMessage"
        self.home_url = F"{self.base_url}/home"
        self.profile_url = F"{self.base_url}/api/v1/me"
        self.headers = None
        if username and password:
            response = requests.post(self.login_url, data={"username": self.rc_user, "password": self.rc_pass},
                                     headers={"X-Auth-Token": auth_token, "X-User-Id": user_id})
            if response.ok:
                data = response.json()
                self.user_id = data['data']['userId']
                self.auth_token = data['data']['authToken']
            else:
                raise Exception(F"Unable to login with username: {username} and the provided password")
        elif user_id and auth_token:
            self.auth_token = auth_token
            self.user_id = user_id
        else:
            raise Exception("Unable to login without a username/password or user_id/auth_token.")
        self.headers = {"X-Auth-Token": self.auth_token, "X-User-Id": self.user_id, "Content-type": "application/json"}
        # Make a request to ensure that the credentials are ok.
        response = requests.get(self.profile_url, headers=self.headers)
        if not response.ok:
            print(response.content)
            raise Exception(F"Unable to get profile.")

    def post_message(self, channel, message):
        data = {"channel": channel, "text": message}
        response = requests.post(self.message_url, headers=self.headers, data=json.dumps(data))
        if not response.ok:
            print(response.content)
            raise Exception(F"Failed to send {channel} the message: {message}")


def main():
    auth_token = ""
    user_id = ""
    channel = ""
    message = ""
    url = ""
    client = RocketChat(url=url, auth_token=auth_token, user_id=user_id)
    client.post_message(channel, message)


if __name__ == "__main__":
    main()