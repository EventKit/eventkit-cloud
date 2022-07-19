from datetime import datetime
from typing import Any, Literal, Optional, TypedDict, Union


# https://v3-apidocs.cloudfoundry.org/version/3.0.0/index.html#list-tasks
class Link(TypedDict):
    href: str


class _TaskResource(TypedDict):
    name: str
    state: Literal["PENDING", "RUNNING", "SUCCEEDED", "CANCELING", "FAILED"]
    memory_in_mb: int
    disk_in_mb: int


class TaskResource(_TaskResource, total=False):
    guid: str
    created_at: datetime
    updated_at: datetime
    links: dict[str, Link]


class _Pagination(TypedDict):
    total_results: int


class Pagination(_Pagination, total=False):
    total_pages: float
    first: Optional[Link]
    last: Optional[Link]
    next: Optional[Link]
    previous: Optional[Link]


Annotations = Optional[dict[str, Optional[Union[str, int]]]]
Labels = Optional[dict[str, Optional[Union[str, int]]]]


class Metadata(TypedDict):
    labels: Labels
    annotations: Annotations


class Relationship(TypedDict):
    data: dict[Literal["guid"], Any]


class PcfEntity(TypedDict):
    guid: str
    created_at: datetime
    updated_at: datetime
    name: str
    links: dict[str, Link]
    metadata: Metadata


class PcfOrganization(PcfEntity):
    suspended: bool
    relationships: dict[Literal["quota"], Relationship]


class PcfSpace(PcfEntity):
    suspended: bool
    relationships: dict[Literal["organization", "quota"], Relationship]


class PcfApp(PcfEntity):
    relationships: dict[Literal["space"], Relationship]


class PaginatedResponse(TypedDict):
    pagination: Pagination


# A generic here would be great... https://github.com/python/mypy/issues/3863
class ListTaskResponse(PaginatedResponse):
    resources: list[TaskResource]


class ListOrgResponse(PaginatedResponse):
    resources: list[PcfOrganization]


class ListSpaceResponse(PaginatedResponse):
    resources: list[PcfSpace]


class ListAppResponse(PaginatedResponse):
    resources: list[PcfApp]


ListResponse = Union[ListSpaceResponse, ListOrgResponse, ListAppResponse, ListTaskResponse]
Entity = Union[PcfSpace, PcfOrganization, PcfApp, TaskResource]
