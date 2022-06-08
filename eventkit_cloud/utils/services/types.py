from typing import Dict, TypedDict


class LayerDescription(TypedDict):
    name: str
    url: str


LayersDescription = Dict[str, LayerDescription]
