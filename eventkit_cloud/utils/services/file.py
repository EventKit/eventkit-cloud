import requests

from eventkit_cloud.utils.services.base import GisClient


class FileClient(GisClient):
    def check_response(self, head_only=True) -> requests.Response:
        return super().check_response(head_only=head_only)
