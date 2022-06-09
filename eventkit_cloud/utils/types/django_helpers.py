from typing import List, Union, TypeVar, TYPE_CHECKING

from django.db.models import QuerySet

if TYPE_CHECKING:
    from django.contrib.auth.models import User as DjangoUserType
else:
    DjangoUserType = None


T = TypeVar("T")

ListOrQuerySet = Union[List[T], QuerySet[T]]
