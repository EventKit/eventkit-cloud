import json
import os

from gunicorn.http import wsgi

# Used to configure gunicorn settings.


def build_header(name, value):
    """
    Takes a header name and value and constructs a valid string to add to the headers list.
    """
    stripped_value = value.lstrip(" ").rstrip("\r\n").rstrip("\n")
    stripped_name = name.rstrip(":")
    return f"{stripped_name}: {stripped_value}\r\n"


class Response(wsgi.Response):
    def default_headers(self, *args, **kwargs):
        headers = super(Response, self).default_headers(*args, **kwargs)
        content_security_policy = os.getenv("CONTENT_SECURITY_POLICY", "").replace('"', "'")
        if content_security_policy:
            headers.append(build_header("Content-Security-Policy", content_security_policy))
        additional_headers = json.loads(os.getenv("HTTP_HEADERS", "{}"))
        for header, value in additional_headers.items():
            headers.append(build_header(header, value.replace('"', "'")))
        return [header for header in headers if not header.startswith("Server:")]


wsgi.Response = Response
