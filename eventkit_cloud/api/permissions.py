"""Provides custom permissions for API endpoints."""
from django.contrib.auth.models import User
from rest_framework import permissions, status

from eventkit_cloud.auth.views import has_valid_access_token


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission which restricts delete and update
    operations on models to the owner of the object.
    """

    @staticmethod
    def has_object_permission(request, view, obj, **kwargs):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the object.
        if isinstance(obj, User):
            return obj == request.user

        return obj.user == request.user


class HasValidAccessToken(permissions.BasePermission):
    """
    Validate that the user has a valid oauth authentication token.
    """

    code = status.HTTP_403_FORBIDDEN
    message = "Your access token has expired, please log in again."

    def has_permission(self, request, view):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        return has_valid_access_token(request)
