# -*- coding: utf-8 -*-
import datetime
import logging
import os
import unicodedata
import uuid
from enum import Enum
from pathlib import Path
from typing import Any, Callable, List, Optional, Tuple, Union, cast

from django.conf import settings
from django.contrib.auth.models import Group, User
from django.contrib.gis.db import models
from django.core.cache import cache
from django.core.files import File
from django.db import transaction
from django.db.models import Case, Count, Q, QuerySet, Value, When
from django.utils import timezone
from django.utils.text import slugify
from notifications.models import Notification

from eventkit_cloud.tasks.enumerations import Directory

logger = logging.getLogger(__name__)


Notification.old_str_func = Notification.__str__

DEFAULT_TIMEOUT = 60 * 60 * 24  # One Day


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

    status: Optional[Any]
    started_at = models.DateTimeField(null=True, editable=False)
    finished_at = models.DateTimeField(editable=False, null=True)

    def save(self, *args, **kwargs):
        from eventkit_cloud.tasks.enumerations import TaskState

        if hasattr(self, "status"):
            if self.status and TaskState[self.status] == TaskState.RUNNING:
                self.started_at = timezone.now()
            if self.status and TaskState[self.status] in TaskState.get_finished_states():
                self.finished_at = timezone.now()
        super(TimeTrackingModelMixin, self).save(*args, **kwargs)

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
                # TODO: Confirm if this is being used.
                cache_key = f"{type(self).__name__}-{cache_key_prop}-{getattr(self, cache_key_prop)}"
                cache.set(cache_key, self, timeout=DEFAULT_TIMEOUT)
                self.update_cache_key_list(cache_key)

        self.clear_cache_key_list()

    @classmethod
    def get_caches_key(cls):
        return f"{slugify(cls.__name__)}_caches_key"

    @classmethod
    def update_cache_key_list(cls, cache_key):
        caches_key = cls.get_caches_key()
        caches = cache.get(caches_key, dict())
        caches[cache_key] = datetime.datetime.now()
        cache.set(caches_key, caches, timeout=DEFAULT_TIMEOUT)

    @classmethod
    def clear_cache_key_list(cls):
        caches = cache.get(cls.get_caches_key(), dict())
        if caches:
            cache.delete_many(caches.keys())
            cache.delete(cls.get_caches_key())


class UIDMixin(models.Model):
    """
    Mixin for adding identifiers to a model.
    """

    id = models.AutoField(primary_key=True, editable=False)
    uid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False, db_index=True)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.uid:
            self.uid = uuid.uuid4()
        super(UIDMixin, self).save(*args, **kwargs)


class FileFieldMixin(models.Model):
    """
    Mixin for models that have a file(s).
    """

    filename = models.CharField(max_length=508, blank=True, editable=False)
    file = models.FileField(verbose_name="File", null=True, blank=True)
    size = models.FloatField(null=True, editable=False)
    directory = models.CharField(
        max_length=100, null=True, blank=True, help_text="An optional directory name to store the file in."
    )

    @property
    def download_url(self):
        return self.file.url

    class Meta:
        abstract = True

    def save(self, write_file=True, *args, **kwargs):
        # File path is where the file is on disk before push.
        #  Example: /some/local/stage/path/file.txt
        file_path = Path(self.file.name)
        self.filename = self.file.name
        if Path(settings.EXPORT_STAGING_ROOT) in file_path.parents:
            # The file name is the relative path for the file.
            #  Example: path/file.txt
            self.filename = str(file_path.relative_to(settings.EXPORT_STAGING_ROOT))
        if self.pk:
            try:
                # We are updating an existing file, and need to delete the old one
                # before uploading the new one.
                stored_file = type(self).objects.get(pk=self.pk)
                if stored_file.file.name != self.file.name:
                    stored_file.file.delete(save=False)
                else:
                    write_file = False
            except self.DoesNotExist:
                # Manually setting a Pk?, eitherway this is new.
                self.file.delete(save=False)
        if write_file:
            with open(str(file_path), "rb") as open_file:
                self.file.save(self.filename, File(open_file), save=False)
            self.size = self.file.size / 1_000_000
        super().save(*args, **kwargs)

    def get_file_path(self, staging: bool = True, archive: bool = False):
        """
        A helper method to consolidate the logic for storing the files within datapacks and in the staging directory.
        """
        if archive:
            return os.path.join(Directory.DATA.value, *self.filename.split("/")[1:])
        if staging:
            return os.path.join(settings.EXPORT_STAGING_ROOT, self.filename)
        return self.filename


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
    permission = models.CharField(
        choices=[("MEMBER", "Member"), ("ADMIN", "Admin")],
        max_length=10,
    )

    # A user should only have one type of permission per group.
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "group", "permission"], name="unique_user_permission_per_group"),
        ]

    def __str__(self):
        return "{0}: {1}: {2}".format(self.user, self.group.name, self.permission)

    def __unicode__(self):
        return "{0}: {1}: {2}".format(self.user, self.group.name, self.permission)


class AttributeClass(UIDMixin, TimeStampedModelMixin):

    __original_filter: dict = None
    __original_exclude: dict = None
    __original_complex: dict = None

    name = models.CharField(max_length=100, blank=False, unique=True)
    slug = LowerCaseCharField(max_length=40, blank=False, unique=True, db_index=True)
    filter = models.JSONField(
        null=True,
        blank=True,
        help_text="This field should be a dict which is passed directly to the user model for filtering users. "
        "For help see django docs on filtering models.",
    )
    exclude = models.JSONField(
        null=True,
        blank=True,
        help_text="This field should be a dict which is passed directly to the user model for excluding users. "
        "For help see django docs on excluding models.",
    )
    complex = models.JSONField(
        null=True,
        blank=True,
        unique=True,
        help_text='This is a thruple of nested thruples represented as lists. Example: \'["blue","==","color"]\'.',
    )
    users = models.ManyToManyField(User, related_name="attribute_classes")

    def __init__(self, *args, **kwargs):
        super(AttributeClass, self).__init__(*args, **kwargs)
        self.__original_filter = self.filter
        self.__original_exclude = self.exclude
        self.__original_complex = self.complex

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["filter", "exclude"], name="unique_filter_exclude"),
        ]
        verbose_name_plural = "Attribute Classes"
        verbose_name = "Attribute Class"

    def save(self, *args, **kwargs):
        # Save is here twice because if this is a NEW object it won't have an ID yet which is required.
        super(AttributeClass, self).save(*args, **kwargs)
        if any(
            [
                self.filter != self.__original_filter,
                self.exclude != self.__original_exclude,
                self.complex != self.__original_complex,
            ]
        ):
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


def validate_object(filter: Union[List[Any], bool], object_dict: dict) -> bool:
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
        return filter
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
    return False


def validate_filter(filter: Union[List[Any], bool]) -> bool:
    """This function takes a filter and ensures that it is a valid filter, in that each element is a nested thruple,
    where the center element is a valid operation.
    """
    if isinstance(filter, bool):
        return filter
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
    query_filter = getattr(attribute_class, "filter") or dict()
    query_exclude = getattr(attribute_class, "exclude") or dict()
    complex_filter: List[Any] = getattr(attribute_class, "complex") or []
    if query_filter or query_exclude:
        user = cast(User, User.objects.filter(**query_filter).exclude(**query_exclude).filter(id=user.id))
        if user:
            return True
    elif complex_filter:
        if hasattr(user, "oauth"):
            if validate_object(complex_filter, user.oauth.user_info):
                return True
    return False


def get_users_from_attribute_class(attribute_class: AttributeClass) -> List[User]:

    query_filter = getattr(attribute_class, "filter") or dict()
    query_exclude = getattr(attribute_class, "exclude") or dict()
    # TODO: verify this change is ok
    complex_filter: List[Any] = getattr(attribute_class, "complex") or []
    users: List[User] = []

    if query_filter or query_exclude:
        users = cast(List, User.objects.filter(**query_filter).exclude(**query_exclude))
    elif complex_filter:
        for user in User.objects.all().select_related("oauth"):
            if hasattr(user, "oauth"):
                if validate_object(complex_filter, user.oauth.user_info):
                    users.append(user)
    return users


@transaction.atomic()
def update_all_users_with_attribute_class(attribute_class: AttributeClass) -> None:
    users = get_users_from_attribute_class(attribute_class)
    attribute_class.users.set(users, clear=True)


@transaction.atomic()
def update_all_attribute_classes_with_user(user: User) -> None:
    for attribute_class in AttributeClass.objects.all():
        if validate_user_attribute_class(user, attribute_class):
            attribute_class.users.add(user)
        else:
            attribute_class.users.remove(user)


def get_unrestricted_users(users: QuerySet, job) -> QuerySet:
    # If there is no job then there is nothing to compare users against and none are restricted.
    if not job:
        return users

    attribute_classes = [provider_task.provider.attribute_class for provider_task in job.data_provider_tasks.all()]
    unrestricted = users.all()
    for attribute_class in attribute_classes:
        if attribute_class:
            unrestricted = unrestricted.filter(attribute_classes=attribute_class)
        unrestricted = unrestricted.distinct()
    return unrestricted


def annotate_users_restricted(users: QuerySet, job):
    unrestricted = get_unrestricted_users(users, job)
    users = users.annotate(
        restricted=Case(When(id__in=unrestricted, then=False), default=Value(True), output_field=models.BooleanField())
    )
    return users


def annotate_groups_restricted(groups: QuerySet, job):
    unrestricted_users = get_unrestricted_users(User.objects.all(), job)
    unrestricted_groups = groups.filter(
        Q(group_permissions__user__in=unrestricted_users) | Q(group_permissions__user__isnull=True)
    )
    groups = groups.annotate(
        restricted=Case(
            When(id__in=unrestricted_groups, then=False), default=Value(True), output_field=models.BooleanField()
        )
    )
    return groups


def get_group_counts(groups_queryset, user):
    # Computes against all groups where the inspected group has permissions pertaining to this user
    # counts the number of filtered groups where the permission is ADMIN
    # counts the number of filtered groups where the permission is MEMBER
    return groups_queryset.filter(group_permissions__user=user).aggregate(
        admin=Count(Case(When(Q(group_permissions__permission=GroupPermissionLevel.ADMIN.value), then=1))),
        member=Count(Case(When(Q(group_permissions__permission=GroupPermissionLevel.MEMBER.value), then=1))),
    )


def attribute_class_filter(queryset: QuerySet, user: User = None) -> Tuple[QuerySet, QuerySet]:

    if not user:
        return queryset, queryset.as_manager().filter().none()

    # Get all of the classes that we aren't in.
    restricted_attribute_classes = AttributeClass.objects.exclude(users=user)
    attribute_class_queries = {
        "ExportRun": {"data_provider_task_records__provider__attribute_class__in": restricted_attribute_classes},
        "RunZipFile": {"data_provider_task_records__provider__attribute_class__in": restricted_attribute_classes},
        "Job": {"data_provider_tasks__provider__attribute_class__in": restricted_attribute_classes},
        "DataProvider": {"attribute_class__in": restricted_attribute_classes},
        "DataProviderTask": {"provider__attribute_class__in": restricted_attribute_classes},
        "DataProviderTaskRecord": {"provider__attribute_class__in": restricted_attribute_classes},
    }
    item = queryset.first()
    attribute_class_query = {}

    if item:
        # Get all of the objects that don't include attribute classes that we aren't in.
        attribute_class_query = attribute_class_queries.get(type(item).__name__, {})
    filtered = queryset.filter(**attribute_class_query).distinct()
    queryset = queryset.exclude(**attribute_class_query).distinct()
    return queryset, filtered
