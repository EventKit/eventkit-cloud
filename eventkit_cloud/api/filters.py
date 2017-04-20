"""Module providing classes to filter api results."""
# -*- coding: utf-8 -*-
import logging

import django_filters

from django.db.models import Q

from eventkit_cloud.jobs.models import Job
from eventkit_cloud.tasks.models import ExportRun

logger = logging.getLogger(__name__)


class JobFilter(django_filters.FilterSet):
    """Filter export results according to a range of critera."""
    name = django_filters.CharFilter(name="name", lookup_expr="icontains")
    description = django_filters.CharFilter(name="description", lookup_expr="icontains")
    event = django_filters.CharFilter(name="event", lookup_expr="icontains")
    start = django_filters.DateTimeFilter(name="created_at", lookup_expr="gte")
    end = django_filters.DateTimeFilter(name="created_at", lookup_expr="lte")
    region = django_filters.CharFilter(name="region__name")
    user = django_filters.CharFilter(name="user__username", lookup_expr="exact")
    feature = django_filters.CharFilter(name="tags__name", lookup_expr="icontains")
    published = django_filters.BooleanFilter(name="published", lookup_expr="exact")
    user_private = django_filters.CharFilter(method='user_private_filter')

    class Meta:
        model = Job
        fields = ('name', 'description', 'event', 'start', 'end', 'region',
                  'user', 'user_private', 'feature', 'published')
        order_by = ('-created_at',)

    @staticmethod
    def user_private_filter(queryset, value):
        """
        Filter export results by user and/or published status.

        Return exports for the specified user where exports are either published or unpublished.
        OR
        Return exports for all other users and where the export is published.
        """
        return queryset.filter(
            (Q(user__username=value) | (~Q(user__username=value) & Q(published=True)))
        )


class ExportRunFilter(django_filters.FilterSet):
    """Filter export runs by status."""
    status = django_filters.CharFilter(name="status", lookup_expr="icontains")
    job_uid = django_filters.CharFilter(name="job__uid", lookup_expr="exact")

    class Meta:
        model = ExportRun
        fields = ('status',)
        order_by = ('-started_at',)
