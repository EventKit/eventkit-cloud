import os

from gunicorn.http import wsgi

# Used to configure gunicorn settings.


class Response(wsgi.Response):
    def default_headers(self, *args, **kwargs):
        headers = super(Response, self).default_headers(*args, **kwargs)
        content_security_policy = os.getenv("CONTENT_SECURITY_POLICY", None)
        if content_security_policy:
            headers.append(f"Content-Security-Policy: {content_security_policy}")
        return [header for header in headers if not header.startswith("Server:")]


wsgi.Response = Response
