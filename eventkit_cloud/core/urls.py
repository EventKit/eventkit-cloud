# -*- coding: utf-8 -*-
"""
HOT Exports URL Configuration
"""
from django.conf.urls import include, url
from django.conf.urls.i18n import i18n_patterns
from django.contrib import admin
from django.views.generic import TemplateView
from django.views.i18n import javascript_catalog
from django.http import HttpResponseRedirect

from django.contrib.auth.views import login

from eventkit_cloud.api.urls import router
from eventkit_cloud.api.views import HDMDataModelView, OSMDataModelView, RunJob
from eventkit_cloud.ui import urls as ui_urls
from eventkit_cloud.ui.views import (
    about, create_error_view, help_create, help_exports, help_features,
    help_formats, help_main, help_presets, logout
)

from tastypie.api import Api

admin.autodiscover()

urlpatterns = []

urlpatterns += i18n_patterns('eventkit_cloud.ui.views',
                             url(r'^$', lambda r: HttpResponseRedirect('exports/create/'), name='index'),
                             url(r'^exports/', include(ui_urls)),
                             url(r'^login/$', login, {'template_name': 'ui/login.html'}, name='login'),
                             url(r'^logout$', logout, name='logout'),
                             url(r'^error$', create_error_view, name='error'),
                             url(r'^about$', about, name='about'),
                             url(r'^update$', TemplateView.as_view(template_name='eventkit_cloud/ui/upgrade.html'),
                                 name='update'),
                             # url(r'^email/$', 'require_email', name='require_email'),
                             )

urlpatterns += i18n_patterns('eventkit_cloud.ui.help',
                             url(r'^help$', help_main, name='help'),
                             url(r'^help/create$', help_create, name='help_create'),
                             url(r'^help/features$', help_features, name='help_features'),
                             url(r'^help/exports$', help_exports, name='help_exports'),
                             url(r'^help/formats$', help_formats, name='help_formats'),
                             url(r'^help/presets$', help_presets, name='help_presets'),
                             )

urlpatterns += i18n_patterns('admin.views',
                             url(r'^admin/', include(admin.site.urls)),
                             )

## This was originally in HOT OSM Export Tool, and isn't used, but might be usued again in the future.
# # OAuth urls
# urlpatterns += i18n_patterns('eventkit_cloud.ui.social',
#     url('^osm/', include('social.apps.django_app.urls', namespace='osm')),
#     url('^osm/email_verify_sent/$', TemplateView.as_view(template_name='osm/email_verify_sent.html'), name='email_verify_sent'),
#     url('^osm/error$', TemplateView.as_view(template_name='osm/error.html'), name='login_error')
# )

# don't apply i18n patterns here.. api uses Accept-Language header
# urlpatterns += patterns('eventkit_cloud.api.views',
#     url(r'^api/', include(router.urls, namespace='api')),
#     url(r'^api/', include('rest_framework.urls', namespace='rest_framework')),
#     url(r'^api/rerun$', RunJob.as_view(), name='rerun'),
#     url(r'^api/hdm-data-model$', HDMDataModelView.as_view(), name='hdm-data-model'),
#     url(r'^api/osm-data-model$', OSMDataModelView.as_view(), name='osm-data-model'),
# )

urlpatterns += [
    url(r'^api/', include(router.urls, namespace='api')),
    url(r'^api/', include('rest_framework.urls', namespace='rest_framework')),
    url(r'^api/rerun$', RunJob.as_view(), name='rerun'),
    url(r'^api/hdm-data-model$', HDMDataModelView.as_view(), name='hdm-data-model'),
    url(r'^api/osm-data-model$', OSMDataModelView.as_view(), name='osm-data-model'),
]

# i18n for js
js_info_dict = {
    'packages': ('hot_osm',),
}

importer_api = Api(api_name='importer-api')

# urlpatterns += patterns('',
#     url(r'^jsi18n/$', javascript_catalog, js_info_dict),
#     url(r'^i18n/', include('django.conf.urls.i18n')),
# )

urlpatterns += [
    url(r'^jsi18n/$', javascript_catalog, js_info_dict),
    url(r'^i18n/', include('django.conf.urls.i18n')),
]

# handler500 = 'eventkit_cloud.ui.views.internal_error_view'


# handler404 = 'eventkit_cloud.ui.views.not_found_error_view'
