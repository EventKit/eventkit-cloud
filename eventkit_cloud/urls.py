from typing import List, Union

from django.conf import urls
from django.contrib.staticfiles.storage import staticfiles_storage
from django.urls import URLPattern, URLResolver, re_path
from django.views.generic.base import RedirectView

from eventkit_cloud.core.urls import urlpatterns as eventkit_cloud_urlpatterns
from eventkit_cloud.ui.views import not_found_error_view

urls.handler404 = not_found_error_view

urlpatterns: List[Union[URLPattern, URLResolver]] = [
    re_path(
        r"^favicon.png$",
        RedirectView.as_view(url=staticfiles_storage.url("images/favicon.png"), permanent=False),
        name="favicon",
    ),
]

urlpatterns += eventkit_cloud_urlpatterns
