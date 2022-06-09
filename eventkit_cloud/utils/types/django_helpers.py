from typing import TYPE_CHECKING, List, TypeVar, Union

from django.db.models import QuerySet

if TYPE_CHECKING:
    from django.contrib.auth.models import User as DjangoUserType
else:
    DjangoUserType = None


T = TypeVar("T")

ListOrQuerySet = Union[List[T], QuerySet[T]]
