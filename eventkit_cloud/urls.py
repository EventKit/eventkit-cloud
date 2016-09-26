from django.conf.urls import patterns, url, include
from django.contrib.staticfiles.storage import staticfiles_storage
from django.views.generic import TemplateView
from django.views.generic.base import RedirectView
from eventkit_cloud.core.urls import urlpatterns as eventkit_cloud_urlpatterns

from eventkit_cloud.views import register_service, import_voyager_cart

urlpatterns = [
    url(
        r'^favicon.ico$',
        RedirectView.as_view(
            url=staticfiles_storage.url('images/favicon.ico'),
            permanent=False),
        name="favicon"
    ),
    url(r'^eventkit/register$', register_service),
    url(r'^eventkit/voyager$', import_voyager_cart)] + eventkit_cloud_urlpatterns

