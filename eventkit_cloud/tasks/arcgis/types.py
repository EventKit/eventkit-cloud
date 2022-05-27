from typing import TypedDict, Literal, List


class CIMRGBColor(TypedDict):
    type: Literal["CIMRGBColor"]
    values: List[any]

class CIMSolidStroke(TypedDict):
    type: Literal["CIMSolidStroke"]
    enable: bool
    capStyle: str
    joinStyle: str
    lineStyle3D: str
    miterLimit: int
    width: int
    color: CIMRGBColor

class CIMLineSymbol(TypedDict):
    type: Literal["CIMLineSymbol"]
    symbolLayers: list[CIMSolidStroke]

class CIMSymbolReference(TypedDict):
    type: Literal["CIMSymbolReference"]
    symbol: CIMLineSymbol

class CIMSimpleRenderer(TypedDict):
    type: Literal["CIMSimpleRenderer"]
    patch: Literal["Default"]
    symbol: CIMLineSymbol