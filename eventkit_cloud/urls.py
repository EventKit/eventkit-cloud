from django.contrib.staticfiles.storage import staticfiles_storage
from django.urls import re_path
from django.views.generic.base import RedirectView

from eventkit_cloud.core.urls import urlpatterns as eventkit_cloud_urlpatterns

urlpatterns = [
    re_path(
        r"^favicon.png$",
        RedirectView.as_view(url=staticfiles_storage.url("images/favicon.png"), permanent=False),
        name="favicon",
    ),
]

urlpatterns += eventkit_cloud_urlpatterns
