# -*- coding: utf-8 -*-




from .views import download
from django.conf.urls import url


urlpatterns = []


urlpatterns += [
    url(r'^download', download)
]

