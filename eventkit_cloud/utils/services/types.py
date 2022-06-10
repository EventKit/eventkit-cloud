from typing import Dict, TypedDict, List


class LayerConfiguration(TypedDict, total=False):
    task_uid: str
    path: str
    base_path: str
    bbox: List[int]
    layer_name: str
    projection: str
    distinct_field: str


class LayerDescription(TypedDict):
    name: str
    url: str


class Layer(LayerConfiguration, LayerDescription):
    pass


layer_name = str

LayersDescription = Dict[layer_name, Layer]
