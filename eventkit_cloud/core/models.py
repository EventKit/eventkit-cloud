# -*- coding: utf-8 -*-


import unicodedata
import uuid

from django.contrib.auth.models import User, Group
from django.contrib.gis.db import models
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone
from enum import Enum
from notifications.models import Notification
import logging
from typing import Union, List, Callable
from django.contrib.postgres.fields import JSONField

logger = logging.getLogger(__name__)


Notification.old_str_func = Notification.__str__


def normalize_unicode_str(self):
    return str(unicodedata.normalize("NFKD", self.old_str_func()).encode("ascii", "ignore"))


# Modify the Notification model's __str__ method to not return a unicode string, since this seems to cause problems
# with the logger.
Notification.__str__ = normalize_unicode_str


class LowerCaseCharField(models.CharField):
    """
    Defines a charfield which automatically converts all inputs to
    lowercase and saves.
    """

    def pre_save(self, model_instance, add):
        """
        Converts the string to lowercase before saving.
        """
        current_value = getattr(model_instance, self.attname)
        setattr(model_instance, self.attname, current_value.lower())
        return getattr(model_instance, self.attname)



class TimeStampedModelMixin(models.Model):
    """
    Mixin for timestamped models.
    """

    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super(TimeStampedModelMixin, self).save(*args, **kwargs)


class TimeTrackingModelMixin(models.Model):
    """
    Mixin for timestamped models.
    """

    started_at = models.DateTimeField(default=timezone.now, editable=False)
    finished_at = models.DateTimeField(editable=False, null=True)

    class Meta:
        abstract = True

    @property
    def duration(self):
        """Get the duration for this ExportTaskRecord."""
        started = self.started_at
        finished = self.finished_at
        if started and finished:
            return str(finished - started)
        else:
            return None  # can't compute yet

    @property
    def get_started_at(self):
        if not self.started_at:
            return None  # not started yet
        else:
            return self.started_at

    @property
    def get_finished_at(self):
        if not self.finished_at:
            return None  # not finished yet
        else:
            return self.finished_at


class CachedModelMixin(models.Model):
    """
    Mixin for saving and updating cache
    """

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        super(CachedModelMixin, self).save(*args, **kwargs)
        cache_key_props = ["pk", "uid", "slug"]
        for cache_key_prop in cache_key_props:
            if hasattr(self, cache_key_prop):
                cache.set(f"{type(self).__name__}-{cache_key_prop}-{getattr(self, cache_key_prop)}", self)


class UIDMixin(models.Model):
    """
    Mixin for adding identifiers to a model.
    """

    id = models.AutoField(primary_key=True, editable=False)
    uid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False, db_index=True)

    class Meta:
        abstract = True


class DownloadableMixin(models.Model):
    """
    Mixin for models that have a downloadable product.
    """

    filename = models.CharField(max_length=508, blank=True, editable=False)
    size = models.FloatField(null=True, editable=False)
    download_url = models.URLField(verbose_name="URL to export task result output.", max_length=508)

    class Meta:
        abstract = True


class GroupPermissionLevel(Enum):
    NONE = "NONE"
    MEMBER = "MEMBER"
    ADMIN = "ADMIN"


class GroupPermission(TimeStampedModelMixin):
    """
    Model associates users with groups.  Note this REPLACES the django.auth provided groupmembership
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="group_permissions")
    permission = models.CharField(choices=[("NONE", "None"), ("MEMBER", "Member"), ("ADMIN", "Admin")], max_length=10,)

    def __str__(self):
        return "{0}: {1}: {2}".format(self.user, self.group.name, self.permission)

    def __unicode__(self):
        return "{0}: {1}: {2}".format(self.user, self.group.name, self.permission)


class AttributeClass(UIDMixin, TimeStampedModelMixin):

    __original_filter = None
    __original_exclude = None
    __original_complex = None

    name = models.CharField(max_length=100, blank=False, unique=True)
    slug = LowerCaseCharField(max_length=40, blank=False, unique=True, db_index=True)
    filter = JSONField(null=True, blank=True,
                       help_text="This field should be a dict which is passed directly to the user model for filtering users. "
                                 "For help see django docs on filtering models.")
    exclude = JSONField(null=True, blank=True,
                        help_text="This field should be a dict which is passed directly to the user model for excluding users. "
                                  "For help see django docs on excluding models.")
    complex = JSONField(null=True, blank=True, unique=True,
                        help_text="""This is a thruple of nested thruples represented as lists. 
                        Example: '["blue","==","color"]'.""")
    users = models.ManyToManyField(User)

    def __init__(self, *args, **kwargs):
        super(AttributeClass, self).__init__(*args, **kwargs)
        self.__original_filter = self.filter
        self.__original_exclude = self.exclude
        self.__original_complex = self.complex

    class Meta:
        unique_together = ("filter", "exclude")
        verbose_name_plural = "Attribute Classes"
        verbose_name = "Attribute Class"

    def save(self, *args, **kwargs):
        # Save is here twice because if this is a NEW object it won't have an ID yet which is required.
        super(AttributeClass, self).save(*args, **kwargs)
        if any([self.filter != self.__original_filter,
                self.exclude != self.__original_exclude,
                self.complex != self.__original_complex]):
            # If this changes we need to ensure that all users correctly reflect the updates.
            update_all_users_with_attribute_class(self)
        self.__original_filter = self.filter
        self.__original_exclude = self.exclude
        self.__original_complex = self.complex

    def __str__(self):
        return self.name


def get_operation(operation) -> Callable[[str, str], bool]:
    # https://docs.python.org/3/reference/expressions.html#comparisons
    operations = {
        "in": lambda left, right: left in right,
        "not in": lambda left, right: left not in right,
        "<": lambda left, right: left < right,
        "<=": lambda left, right: left <= right,
        ">": lambda left, right: left > right,
        ">=": lambda left, right: left >= right,
        "==": lambda left, right: left == right,
        "!=": lambda left, right: left != right,
        "is": lambda left, right: left is right,
        "is not": lambda left, right: left is not right,
        "or": lambda left, right: left or right,
        "and": lambda left, right: left and right,
    }
    return operations[operation]


def validate_object(filter: Union[List[any], bool], object_dict: dict) -> bool:
    """This function takes a filter and a dict and validates it. The filter should be a three part List left part,
    operator (as a string), and right part which is the key for the desired value in object dict.  All values,
    are strings and the operator will be evaluated for safety.  While normally we can make
    say equalities are symmetric, for this function we treat the right part as a mapping to the dict and since we
    are allowing in to be an operation then we can't reverse them (i.e. value in [] does not equal [] in value).
    For example, to validate "if a 'MyGroup' is in 'groups' or the 'employmentStatus' is a 'student'
    then the following filter could be applied.
    [["MyGroup", "in", "groups"], "or", ["student", "==", "employmentStatus"]]
    """
    if isinstance(filter, bool):
        return bool
    else:
        try:
            left, operator, right = filter
        except Exception as e:
            logger.error(f"Failed to unpack: {filter}")
            raise e

    if isinstance(left, list):
        left = validate_object(left, object_dict)

    if isinstance(right, list):
        right = validate_object(right, object_dict)
    elif isinstance(right, str):
        right = object_dict.get(right)

    if isinstance(left, str):
        if left.lower() == "none":
            left = None

    try:
        # Its possible this it not a valid operation, filters should be checked with validate_filter prior to saving.
        operation = get_operation(operator)
        if operation:
            return operation(left, right)
    except TypeError:
        # If a field isn't defined then we will end up trying something against None,
        # which probably isn't allowed. Consider it a "fail" and continue with evaluation.
        return False


def validate_filter(filter: Union[List[any], bool]) -> bool:
    """This function takes a filter and ensures that it is a valid filter, in that each element is a nested thruple,
    where the center element is a valid operation.
    """
    if isinstance(filter, bool):
        return bool
    else:
        try:
            left, operator, right = filter
        except ValueError as ve:
            logger.info(ve)
            logger.info(f"Filter is a {type(filter)}")
            raise Exception(f"Unable to process {filter}, please ensure that there are three values in list.")

    if isinstance(left, list):
        if not validate_filter(left):
            raise Exception(f"The left side value {left} is invalid.")

    if isinstance(right, list):
        if not validate_filter(right):
            raise Exception(f"The right side value {right} is invalid.")

    # This Will raise a TypeError if not Valid, this is essentially what we are looking for.
    try:
        get_operation(operator)
    except TypeError:
        raise Exception(f"Invalid comparison operator {operator}.")

    return True


def validate_user_attribute_class(user: User, attribute_class: AttributeClass) -> bool:
    """
    Takes a user and an attribute class.  If the user's oauth.user_info matches the attribute_class filter,
    then the user is added, otherwise the user is removed.
    :param user: A User object
    :param attribute_class: An AttributeClass object.
    :return: True if the user is added, otherwise False.
    """
    query_filter = getattr(attribute_class, 'filter', {})
    query_exclude = getattr(attribute_class, 'exclude', {})
    complex_filter = getattr(attribute_class, 'complex', {})
    if query_filter or query_exclude:
        user = User.objects.filter(**query_filter).exclude(**query_exclude).filter(id=user.id)
        if user:
            return True
    elif complex_filter:
        if hasattr(user, "oauth"):
            if validate_object(complex_filter, user.oauth.user_info):
                return True
    return False


def get_users_from_attribute_class(attribute_class: AttributeClass):
    query_filter = getattr(attribute_class, 'filter', {})
    query_exclude = getattr(attribute_class, 'exclude', {})
    complex_filter = getattr(attribute_class, 'complex', {})
    users = []
    if query_filter or query_exclude:
        users = User.objects.filter(**query_filter).exclude(**query_exclude)
    elif complex_filter:
        for user in User.objects.all().select_related("oauth"):
            if hasattr(user, "oauth"):
                if validate_object(complex_filter, user.oauth.user_info):
                    users.append(user)
    return users


@transaction.atomic()
def update_all_users_with_attribute_class(attribute_class: AttributeClass):
    users = get_users_from_attribute_class(attribute_class)
    attribute_class.users.set(users, clear=True)


@transaction.atomic()
def update_all_attribute_classes_with_user(user: User):
    for attribute_class in AttributeClass.objects.all():
        if validate_user_attribute_class(user, attribute_class):
            attribute_class.users.add(user)
        else:
            attribute_class.users.remove(user)


