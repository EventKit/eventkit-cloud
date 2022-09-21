from typing import Any, Literal, Optional, TypeAlias, TypedDict, Union

from eventkit_cloud.utils.arcgis.types.cim_types import CIMSymbolReference


class SpatialReference(TypedDict):
    wkid: int
    latestWkid: int


Color: TypeAlias = tuple[int, int, int, int]


class Outline(TypedDict):
    color: Color
    width: int


class UniqueValueInfo(TypedDict):
    symbol: "Symbol"
    value: Union[str, int]
    label: str
    description: str


class Label(TypedDict):
    pass


class CodedValue(TypedDict):
    name: str
    code: int


class CodedValueDomain(TypedDict):
    type: Literal["codedValue"]
    name: str
    codedValues: list[CodedValue]


class RangeDomain(TypedDict):
    type: Literal["range"]
    name: str
    range: list[int]


class InheritedDomain(TypedDict):
    type: Literal["inherited"]


Domain: TypeAlias = Union[CodedValueDomain, InheritedDomain, RangeDomain]

DrawingTool: TypeAlias = Literal[
    "esriFeatureEditToolAutoCompletePolygon",
    "esriFeatureEditToolCircle",
    "esriFeatureEditToolDownArrow",
    "esriFeatureEditToolEllipse",
    "esriFeatureEditToolFreehand",
    "esriFeatureEditToolLeftArrow",
    "esriFeatureEditToolLine",
    "esriFeatureEditToolNone",
    "esriFeatureEditToolPoint",
    "esriFeatureEditToolPolygon",
    "esriFeatureEditToolRectangle",
    "esriFeatureEditToolRightArrow",
    "esriFeatureEditToolText",
    "esriFeatureEditToolTriangle",
    "esriFeatureEditToolUpArrow",
]

Point: TypeAlias = tuple[float, float]
Ring: TypeAlias = list[Point]
Polyline: TypeAlias = list[Point]


class MultiPointGeometry(TypedDict):
    hasM: bool
    hasZ: bool
    points: list[Point]
    spatialReference: SpatialReference


class PointGeometry(TypedDict):
    m: bool
    spatialReference: SpatialReference
    x: float
    y: float
    z: float


class PolygonGeometry(TypedDict):
    hasM: bool
    hasZ: bool
    rings: list[Ring]
    spatialReference: SpatialReference


class PolylineGeometry(TypedDict):
    hasM: bool
    hasZ: bool
    paths: list[Polyline]
    spatialReference: SpatialReference


Geometry: TypeAlias = Union[MultiPointGeometry, PointGeometry, PolygonGeometry, PolylineGeometry]

LineStyle = Literal[
    "esriSLSDash",
    "esriSLSDashDot",
    "esriSLSDashDotDot",
    "esriSLSDot",
    "esriSLSLongDash",
    "esriSLSLongDashDot",
    "esriSLSOptional[]",
    "esriSLSShortDash",
    "esriSLSShortDashDot",
    "esriSLSShortDashDotDot",
    "esriSLSShortDot",
    "esriSLSSolid",
]
FillStyle = Literal[
    "esriSFSBackwardDiagonal",
    "esriSFSCross",
    "esriSFSDiagonalCross",
    "esriSFSForwardDiagonal",
    "esriSFSHorizontal",
    "esriSFSOptional[]",
    "esriSFSSolid",
    "esriSFSVertical",
]


class SimpleLineSymbol(TypedDict):
    type: Literal["esriSLS"]
    style: LineStyle
    color: Color
    width: int


class SimpleFillSymbol(TypedDict):
    type: Literal["esriSFS"]
    style: FillStyle
    color: Color
    outline: Optional[SimpleLineSymbol]


MarkerStyle: TypeAlias = Literal[
    "esriSMSCircle", "esriSMSCross", "esriSMSDiamond", "esriSMSSquare", "esriSMSTriangle", "esriSMSX"
]


class SimpleMarkerSymbol(TypedDict):
    type: Literal["esriSMS"]
    style: MarkerStyle
    color: Color
    size: int
    angle: int
    xoffset: int
    yoffset: int
    outline: Optional[SimpleLineSymbol]


class PictureFillSymbol(TypedDict):
    type: Literal["esriPFS"]
    angle: int
    contentType: str
    height: float
    imageData: str
    outline: Optional[SimpleLineSymbol]
    url: str
    width: int
    xoffset: int
    xscale: int
    yoffset: int
    yscale: int


class PictureMarkerSymbol(TypedDict):
    type: Literal["esriPMS"]
    url: str
    imageData: str
    contentType: str
    width: int
    height: int
    angle: int
    xoffset: int
    yoffset: int


class Font(TypedDict):
    family: str
    size: int
    style: Literal["italic", "normal", "oblique"]
    weight: Literal["bold", "bolder", "lighter", "normal"]
    decoration: Literal["line-through", "none", "underline"]


class TextSymbol(TypedDict):
    type: Literal["esriTS"]
    color: Color
    backgroundColor: Optional[Color]
    borderLineSize: Optional[int]
    borderLineColor: Optional[Color]
    haloSize: int
    haloColor: Color
    verticalAlignment: Literal["baseline", "bottom", "middle", "top"]
    horizontalAlignment: Literal["center", "justify", "left", "right"]
    rightToLeft: bool
    angle: int
    xoffset: int
    yoffset: int
    kerning: bool
    font: Font


Symbol: TypeAlias = Union[
    CIMSymbolReference,
    SimpleLineSymbol,
    PictureFillSymbol,
    PictureMarkerSymbol,
    SimpleFillSymbol,
    SimpleMarkerSymbol,
    TextSymbol,
]


class ProtoType(TypedDict):
    attributes: dict[str, str]
    geometry: Geometry
    popupInfo: Any
    symbol: Symbol


class Template(TypedDict):
    description: str
    drawingTool: str  # Enum
    name: str
    prototype: ProtoType


class Type(TypedDict):
    domains: dict[str, Domain]
    id: int
    name: str
    templates: Template


class SubType(TypedDict):
    domains: dict[str, Domain]
    defaultValues: dict[str, Union[str, int, float]]
    code: int
    name: str


class Field(TypedDict):
    type: Literal[
        "esriFieldTypeBlob",
        "esriFieldTypeDate",
        "esriFieldTypeDouble",
        "esriFieldTypeGeometry",
        "esriFieldTypeGlobalID",
        "esriFieldTypeGUID",
        "esriFieldTypeInteger",
        "esriFieldTypeOID",
        "esriFieldTypeRaster",
        "esriFieldTypeSingle",
        "esriFieldTypeSmallInteger",
        "esriFieldTypeString",
        "esriFieldTypeXML",
    ]
    name: str
    alias: str
    length: int
    nullable: bool
    editable: bool
    exactMatch: bool
    domain: Optional[Domain]


class ColorStop(TypedDict, total=False):
    color: Color
    label: str
    value: int


class LegendOptions(TypedDict):
    dotLabel: str
    order: Literal["ascendingValues", "descendingValues"]
    showLegend: bool
    title: str
    unit: str


RotationType = Literal["arithmetic", "geographic"]
ValueExpression = str


class _VisualVariable(TypedDict, total=False):
    field: str
    legendOptions: LegendOptions
    valueExpression: ValueExpression
    valueExpressionTitle: str
    valueUnit: str


class ColorInfo(_VisualVariable, total=False):
    type: Literal["colorInfo"]
    stops: list[ColorStop]
    normalizationField: str


class RotationInfo(_VisualVariable):
    type: Literal["rotationInfo"]
    rotationType: RotationType


class SizeStop(TypedDict):
    size: int
    value: Union[int, str, float]


class Size(TypedDict, total=False):
    expression: str
    stops: SizeStop
    type: Literal["sizeInfo"]
    valueExpression: ValueExpression


class SizeInfo(_VisualVariable, total=False):
    type: Literal["sizeInfo"]
    maxDataValue: Union[float, int]
    minDataValue: Union[float, int]
    maxSize: Union[Size, float, int]
    minSize: Union[Size, float, int]
    normalizationField: str
    stops: SizeStop
    target: Literal["outline"]


class TransparencyStop(TypedDict):
    label: str
    transparency: int
    value: int


class TranparencyInfo(_VisualVariable, total=False):
    type: Literal["transparencyInfo"]
    stops: TransparencyStop
    normalizationField: str


VisualVariable = Union[ColorInfo, RotationInfo, SizeInfo, TranparencyInfo]


class ClassBreakInfo(TypedDict):
    alternateSymbols: list[Any]
    classMaxValue: int
    classMinValue: int
    label: str
    description: str
    symbol: Symbol


class ClassBreaksRenderer(TypedDict, total=False):
    type: Literal["classBreaks"]
    field: str
    minValue: int
    classBreakInfos: list[ClassBreakInfo]
    defaultSymbol: Optional[Symbol]
    legendOptions: LegendOptions
    normalizationField: str
    normalizationTotal: str
    normalizationType: Literal["esriNormalizeByField", "esriNormalizeByLog", "esriNormalizeByPercentOfTotal"]
    rotationExpression: Any
    rotationType: RotationType
    visualVariables: list[VisualVariable]


class DictionaryRenderer(TypedDict, total=False):
    configuration: dict
    dictionaryName: str
    fieldMap: str
    scalingExpressionInfo: str
    type: Literal["dictionary"]
    url: str


class AttributeColorInfo(TypedDict, total=False):
    color: Color
    field: str
    label: str
    valueExpression: ValueExpression
    valueExpressionTitle: str


class DotDensityRenderer(TypedDict, total=False):
    type: Literal["dotDensity"]
    attributes: list[AttributeColorInfo]
    authoringInfo: dict
    backgroundColor: Color
    dotBlendingEnabled: bool
    dotValue: int
    legendOptions: LegendOptions
    outline: SimpleLineSymbol
    referenceScale: str
    seed: int
    visualVariables: list[VisualVariable]


class SimpleRenderer(TypedDict, total=False):
    type: Literal["simple"]
    authoringInfo: dict
    description: str
    label: Optional[str]
    rotationExpression: str
    rotationType: RotationType
    symbol: Symbol
    visualVariables: list[VisualVariable]


class _UniqueValueRenderer(TypedDict):
    type: Literal["uniqueValue"]
    uniqueValueInfos: list[UniqueValueInfo]


class UniqueValueRenderer(TypedDict, total=False):
    authoringInfo: dict
    backgroundFillSymbol: Union[SimpleFillSymbol, PictureFillSymbol]
    defaultSymbol: Optional[Symbol]
    defaultLabel: Optional[str]
    field1: str
    field2: Optional[str]
    field3: Optional[str]
    fieldDelimiter: str
    legendOptions: LegendOptions
    rotationExpression: str
    rotationType: RotationType
    uniqueValueInfos: list[UniqueValueInfo]
    valueExpression: str
    valueExpressionTitle: str
    visualVariables: list[VisualVariable]


Renderer = Union[ClassBreaksRenderer, DictionaryRenderer, DotDensityRenderer, SimpleRenderer, UniqueValueRenderer]

DeconflictionStrategy = Literal["dynamic", "dynamicNeverRemove", "none", "static"]

DateFormat = Literal[
    "dayShortMonthYear",
    "dayShortMonthYearLongTime",
    "dayShortMonthYearLongTime24",
    "dayShortMonthYearShortTime",
    "dayShortMonthYearShortTime24",
    "longDate",
    "longDateLongTime",
    "longDateLongTime24",
    "longDateShortTime",
    "longDateShortTime24",
    "longMonthDayYear",
    "longMonthDayYearLongTime",
    "longMonthDayYearLongTime24",
    "longMonthDayYearShortTime",
    "longMonthDayYearShortTime24",
    "longMonthYear",
    "shortDate",
    "shortDateLE",
    "shortDateLELongTime",
    "shortDateLELongTime24",
    "shortDateLEShortTime",
    "shortDateLEShortTime24",
    "shortDateLongTime",
    "shortDateLongTime24",
    "shortDateShortTime",
    "shortDateShortTime24",
    "shortMonthYear",
    "year",
]


class Format(TypedDict, total=False):
    dateFormat: DateFormat
    digitSeparator: bool
    places: int


class FieldInfo(TypedDict, total=False):
    fieldName: str
    format: Format


LabelPlacement = Literal[
    "esriServerLinePlacementAboveAfter",
    "esriServerLinePlacementAboveAlong",
    "esriServerLinePlacementAboveBefore",
    "esriServerLinePlacementAboveEnd",
    "esriServerLinePlacementAboveStart",
    "esriServerLinePlacementBelowAfter",
    "esriServerLinePlacementBelowAlong",
    "esriServerLinePlacementBelowBefore",
    "esriServerLinePlacementBelowEnd",
    "esriServerLinePlacementBelowStart",
    "esriServerLinePlacementCenterAfter",
    "esriServerLinePlacementCenterAlong",
    "esriServerLinePlacementCenterBefore",
    "esriServerLinePlacementCenterEnd",
    "esriServerLinePlacementCenterStart",
    "esriServerPointLabelPlacementAboveCenter",
    "esriServerPointLabelPlacementAboveLeft",
    "esriServerPointLabelPlacementAboveRight",
    "esriServerPointLabelPlacementBelowCenter",
    "esriServerPointLabelPlacementBelowLeft",
    "esriServerPointLabelPlacementBelowRight",
    "esriServerPointLabelPlacementCenterCenter",
    "esriServerPointLabelPlacementCenterLeft",
    "esriServerPointLabelPlacementCenterRight",
    "esriServerPolygonPlacementAlwaysHorizontal",
]
LineConnection = Literal["minimizeLabels", "none", "unambiguousLabels"]
MultiPart = Literal["labelLargest", "labelPerFeature", "labelPerPart", "labelPerSegment"]


class LabelingInfo(TypedDict, total=False):
    allowOverrun: bool
    deconflictionStrategy: DeconflictionStrategy
    fieldInfos: list[FieldInfo]
    labelExpression: str
    labelPlacement: LabelPlacement
    lineConnection: LineConnection
    minScale: int
    maxScale: int
    multipart: MultiPart
    name: str
    priority: int
    removeDuplicates: Literal["all", "featureType", "labelClass", "none"]
    removeDuplicatesDistance: int
    repeatLabel: bool
    repeatLabelDistance: int
    stackAlignment: Literal["dynamic", "textSymbol"]
    stackLabel: bool
    useCodedValues: bool
    symbol: Symbol
    where: str


class DrawingInfo(TypedDict):
    scaleSymbols: bool
    renderer: Renderer
    transparency: int
    labelingInfo: list[LabelingInfo]
    showLabels: bool


class LayerID(TypedDict):
    id: int
    name: str


class Extent(TypedDict):
    xmin: float
    ymin: float
    xmax: float
    ymax: float
    spatialReference: SpatialReference


class GeometryField(TypedDict):
    type: Literal["esriFieldTypeGeometry"]
    name: str
    alias: str


class Index(TypedDict):
    name: str
    fields: str
    isAscending: bool
    isUnique: bool
    description: str


class AdvancedQueryCapabilities(TypedDict):
    useStandardizedQueries: bool
    supportsStatistics: bool
    supportsHavingClause: bool
    supportsCountDistinct: bool
    supportsOrderBy: bool
    supportsDistinct: bool
    supportsPagination: bool
    supportsboolCurve: bool
    supportsReturningQueryExtent: bool
    supportsQueryWithDistance: bool
    supportsSqlExpression: bool


GeometryType = Literal[
    "esriGeometryPoint", "esriGeometryMultipoint", "esriGeometryPolyline", "esriGeometryPolygon", "esriGeometryEnvelope"
]
HtmlPopupType = Literal[
    "esriServerHTMLPopupTypeNone", "esriServerHTMLPopupTypeAsURL", "esriServerHTMLPopupTypeAsHTMLText"
]

LayerType = Literal["Group Layer", "Feature Layer"]


class _MapServiceSpecification(TypedDict):
    id: int
    name: str
    type: LayerType
    geometryType: Optional[GeometryType]
    parentLayer: Optional[LayerID]
    layers: list["MapServiceSpecification"]  # type: ignore  # cyclic
    # Not standard, but used to store entire service description.
    subLayers: list["MapServiceSpecification"]  # type: ignore  # cyclic


class MapServiceSpecification(_MapServiceSpecification, total=False):
    currentVersion: float
    description: str
    sourceSpatialReference: SpatialReference
    copyrightText: str
    minScale: int
    maxScale: int
    drawingInfo: DrawingInfo
    defaultVisibility: bool
    extent: Extent
    hasAttachments: bool
    htmlPopupType: HtmlPopupType
    displayField: str
    typeIdField: str
    subtypeFieldName: str
    subtypeField: str
    defaultSubtypeCode: int
    fields: list[Field]
    geometryField: GeometryField
    indexes: list[Index]
    types: list[Type]
    subtypes: list[SubType]
    relationships: list
    canModifyLayer: bool
    canScaleSymbols: bool
    hasLabels: bool
    capabilities: str
    maxRecordCount: int
    supportsStatistics: bool
    supportsAdvancedQueries: bool
    supportedQueryFormats: str
    isDataVersioned: bool
    ownershipBasedAccessControlForFeatures: dict[str, bool]
    useStandardizedQueries: bool
    advancedQueryCapabilities: AdvancedQueryCapabilities
    supportsDatumTransformation: bool
    dateFieldsTimeReference: Optional[Any]
    supportsCoordinatesQuantization: bool
