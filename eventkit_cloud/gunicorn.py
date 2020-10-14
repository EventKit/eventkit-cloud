from gunicorn.http import wsgi

# Used to configure gunicorn settings.


class Response(wsgi.Response):
    def default_headers(self, *args, **kwargs):
        headers = super(Response, self).default_headers(*args, **kwargs)
        return [header for header in headers if not header.startswith("Server:")]


wsgi.Response = Response
