from typing import Dict, List, TypedDict


class LayerConfiguration(TypedDict, total=False):
    task_uid: str
    path: str
    base_path: str
    bbox: List[int]
    layer_name: str
    src_srs: int
    dst_src: int
    distinct_field: str


class LayerDescription(TypedDict, total=False):
    name: str
    url: str
    level: int


class Layer(LayerConfiguration, LayerDescription, total=False):
    extent: dict[str, dict]


layer_name = str

LayersDescription = Dict[layer_name, Layer]


class ProcessFormat(TypedDict):
    name: str
    slug: str
    description: str
