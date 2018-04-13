"""Module providing classes to filter api results."""
# -*- coding: utf-8 -*-
import logging

import django_filters

from django.db.models import Q

from eventkit_cloud.jobs.models import Job, VisibilityState
from eventkit_cloud.tasks.models import ExportRun

from django.contrib.auth.models import User, Group
from ..core.models import GroupPermission, JobPermission

from rest_framework.filters import BaseFilterBackend

logger = logging.getLogger(__name__)


class ListFilter(django_filters.Filter):
    def filter(self, qs, value):
        value_list = value.split(u',')
        return super(ListFilter, self).filter(qs, django_filters.fields.Lookup(value_list, 'in'))


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
    visibility = django_filters.CharFilter(name="visibility", lookup_expr="exact")

    user_private = django_filters.CharFilter(method='user_private_filter')

    class Meta:
        model = Job
        fields = ('name', 'description', 'event', 'start', 'end', 'region',
                  'user', 'user_private', 'feature', 'visibility')
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
            (Q(user__username=value) | (~Q(user__username=value) & Q(visiblity=VisibilityState.PUBLIC.value)))
        )


class ExportRunFilter(django_filters.FilterSet):
    """Filter export runs by status."""
    user = django_filters.CharFilter(name="user__username", lookup_expr="exact")
    status = ListFilter(name="status")
    job_uid = django_filters.CharFilter(name="job__uid", lookup_expr="exact")
    min_date = django_filters.DateFilter(name="started_at", lookup_expr="gte")
    max_date = django_filters.DateFilter(name="started_at", lookup_expr="lte")
    started_at = django_filters.DateTimeFilter(name="started_at", lookup_expr="exact")
    visibility = django_filters.CharFilter(name="job__visibility", lookup_expr="exact")
    providers = ListFilter(name="job__provider_tasks__provider__slug")

    class Meta:
        model = ExportRun
        fields = ('user', 'status', 'job_uid', 'min_date', 'max_date',
                  'started_at', 'visibility', 'providers')


class UserFilter(django_filters.FilterSet):
    min_date = django_filters.DateFilter(name="date_joined", lookup_expr="gte")
    max_date = django_filters.DateFilter(name="date_joined", lookup_expr="lte")
    started_at = django_filters.DateTimeFilter(name="date_joined", lookup_expr="exact")
    groups = django_filters.CharFilter(method='group_filter')

    class Meta:
        model = User
        fields = ["min_date", "max_date", "started_at"]

    @staticmethod
    def group_filter(queryset, fieldname, value):
        """
        Filter users by what group they are in.
        The value can be a comma separated string of group ids and optionally the keyword "none"

        The value "none" will return any users who are not in any groups
        The value "1" will return any users in group 1
        And value "none,1,4,7" will return users in no groups, users in group 1, users in group 4, and users in group 7
        """

        target_users = []
        groups = value.split(",")

        # Find any users who are not in any groups
        if "none" in groups:
            users = User.objects.all()
            for user in users:
                perms = GroupPermission.objects.filter(user=user)
                if not perms:
                    target_users.append(user.id)
            groups.remove("none")

        # Find users in a specific group
        if groups:
            perms = GroupPermission.objects.filter(group__in=groups)
            for perm in perms:
                user = perm.user
                if not user.id in target_users: target_users.append(user.id)

        return queryset.filter(id__in=target_users)


class GroupFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(name="name", lookup_expr="icontains")

    class Meta:
        model = Group
        fields = ('id', 'name')
