from django.conf.urls import patterns, url, include
from django.contrib.staticfiles.storage import staticfiles_storage
from django.views.generic import TemplateView
from django.views.generic.base import RedirectView
from oet2.core.urls import *

from eventkit_cloud.views import register_service, import_voyager_cart

urlpatterns = patterns('',
   url(
        r'^favicon.ico$',
        RedirectView.as_view(
            url=staticfiles_storage.url('img/favicon.ico'),
            permanent=False),
        name="favicon"
    ),
    url(r'^eventkit/register$', register_service),
    url(r'^eventkit/voyager$', import_voyager_cart),
) + urlpatterns

urlpatterns += patterns('',(r'^djmp/', include('djmp.urls')))
