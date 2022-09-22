from typing import Any, Literal, Optional, TypeAlias, TypedDict, Union

# https://github.com/Esri/cim-spec/blob/master/docs/v2/CIMEnumerations.md
AltitudeMode = Literal["ClampToGround", "RelativeToGround", "Absolute"]
AnimationTransition = Literal["None", "Linear", "Stepped", "Hop", "FixedArc", "AdjustableArc", "Hold"]
BaseElevationType = Literal["Expression", "Surface", "Shape"]
BillboardMode = Literal["None", "SignPost", "FaceNearPlane"]
ColorModel = Literal["RGB", "CMYK"]
DisplayCacheType = Literal["Permanent", "InSession", "None", "MaxAge"]
DominantSizeAxis = Literal["Z", "X", "Y"]
ElevationMode = Literal["BaseGlobeSurface", "CustomSurface", "None"]

EsriDatasetType = Literal[
    "esriDTAny",
    "esriDTContainer",
    "esriDTGeo",
    "esriDTFeatureDataset",
    "esriDTFeatureClass",
    "esriDTPlanarGraph",
    "esriDTGeometricNetwork",
    "esriDTText",
    "esriDTTable",
    "esriDTRelationshipClass",
    "esriDTRasterDataset",
    "esriDTRasterBand",
    "esriDTTin",
    "esriDTCadDrawing",
    "esriDTRasterCatalog",
    "esriDTTopology",
    "esriDTToolbox",
    "esriDTTool",
    "esriDTNetworkDataset",
    "esriDTTerrain",
    "esriDTRepresentationClass",
    "esriDTCadastralFabric",
    "esriDTSchematicDataset",
    "esriDTLocator",
    "esriDTMap",
    "esriDTLayer",
    "esriDTStyle",
    "esriDTMosaicDataset",
    "esriDTLasDataset",
    "esriDTLayout",
    "esriDTStandaloneTable",
    "esriDTUtilityNetwork",
    "esriDTDiagramDataset",
    "esriDTDiagramFolder",
    "esriDTNetworkDiagram",
    "esriDTParcelDataset",
    "esriDTStandaloneVideo",
    "esriDTReport",
]

EsriSpatialRelEnum = Literal[
    "esriSpatialRelUndefined",
    "esriSpatialRelIntersects",
    "esriSpatialRelEnvelopeIntersects",
    "esriSpatialRelIndexIntersects",
    "esriSpatialRelTouches",
    "esriSpatialRelOverlaps",
    "esriSpatialRelCrosses",
    "esriSpatialRelWithin",
    "esriSpatialRelContains",
    "esriSpatialRelRelation",
]

EsriSearchOrder = Literal["esriSearchOrderSpatial", "esriSearchOrderAttribute"]

ExtrusionType = Literal["None", "MinZ", "MaxZ", "Base", "Absolute"]
FaceCulling3D = Literal["Backface", "Frontface", "None", "FromGeometry"]
GradientStrokeMethod = Literal["AcrossLine", "AlongLine"]
LabelFeatureType = Literal["Point", "Line", "Polygon"]
LabelWeight = Literal["Low", "Medium", "High"]

MapLayerType = Literal["Operational", "BasemapBackground", "BasemapTopReference", "MapNotes"]
MapViewingMode = Literal["Map", "SceneLocal", "SceneGlobal", "MapStereo"]
OffsetCurveMethod = Literal["Square", "Mitered", "Bevelled", "Rounded"]
OffsetCurveOption = Literal["Fast", "Accurate"]
PolygonSymbolColorTarget = Literal["Fill", "Outline", "FillOutline"]
PrimitiveShapeType = Literal["Unknown", "Cone", "Cube", "Cylinder", "Diamond", "Sphere", "Tetrahedron"]
PrimitiveType3D = Literal["TriangleStrip", "TriangleFan", "TriangleList", "PointList", "LineList"]
RasterResamplingType = Literal[
    "NearestNeighbor",
    "BilinearInterpolation",
    "CubicConvolution",
    "Majority",
    "BilinearInterpolationPlus",
    "BilinearGaussianBlur",
    "BilinearGaussianBlurPlus",
    "Average",
    "Minimum",
    "Maximum",
    "VectorAverage",
]
RasterStretchStatsType = Literal["AreaOfView", "Dataset", "GlobalStats"]
RasterStretchType = Literal[
    "None",
    "DefaultFromSource",
    "Custom",
    "StandardDeviations",
    "HistogramEqualize",
    "MinimumMaximum",
    "HistogramSpecification",
    "PercentMinimumMaximum",
    "Count",
    "ESRI",
]
RotationOrder = Literal["XYZ", "ZXY", "YXZ"]
EsriTimeUnits = Literal[
    "esriTimeUnitsUnknown",
    "esriTimeUnitsMilliseconds",
    "esriTimeUnitsSeconds",
    "esriTimeUnitsMinutes",
    "esriTimeUnitsHours",
    "esriTimeUnitsDays",
    "esriTimeUnitsWeeks",
    "esriTimeUnitsMonths",
    "esriTimeUnitsYears",
    "esriTimeUnitsDecades",
    "esriTimeUnitsCenturies",
]
BlendingMode = Literal[
    "None",
    "Alpha",
    "Screen",
    "Multiply",
    "Add",
    "Color",
    "ColorBurn",
    "ColorDodge",
    "Darken",
    "Difference",
    "Exclusion",
    "HardLight",
    "Hue",
    "Luminosity",
    "Normal",
    " Overlay",
    "Saturation",
    "SoftLight",
    "LinearBurn",
    "LinearDodge",
    "LinearLight",
    "PinLight",
    "VividLight",
]
StandardFeatureWeight = Literal["None", "Low", "Medium", "High"]
StandardLabelWeight = Literal["Low", "Medium", "High"]
StandardNumLabelsOption = Literal["NoLabelRestrictions", "OneLabelPerName", " OneLabelPerShape", " OneLabelPerPart"]
StandardPointPlacementMethod = Literal["AroundPoint", "OnTOpPoint", "SpecifiedAngles", "RotationField"]
StandardPolygonPlacementMethod = Literal["AlwaysHorizontal", "AlwaysStraight", "MixedStrategy"]

SymbolUnits = Literal["Relative", "Absolute"]

MaplexUnit = Literal["Map", "MM", "Inch", "Point", "Percentage"]

GlyphHinting = Literal["None", "Default", "Force"]

HorizontalAlignment = Literal["Left", "Right", "Center", "Justify"]

LineGapType = Literal["ExtraLeading", "Multiple", "Exact"]
TextCase = Literal["Normal", "LowerCase", "Allcaps"]
TextReadingDirection = Literal["LTR", "RTL"]
VerticalAlignment = Literal["Top", "Center", "Baseline", "Bottom"]
VerticalGlyphOrientation = Literal["Right", "Upright"]
BlockProgression = Literal["TTB", "RTL", "BTT"]
FontEffects = Literal["Normal", "SuperScript", "Subscript"]

FontEncoding = Literal["MSSymbol", "Unicode"]

FontType = Literal["Unspecified", "TrueType", "PSOpenType", "TTOpenType", "Type1"]
ClippingType = Literal["Intersect", "Subtract"]

PatchShape = Literal[
    "Default",
    "Point",
    "LineHorizontal",
    "LineZigZag",
    "LineAngles",
    "LineArc",
    "LineCurve",
    "LineTrail",
    "LineHydro",
    "LineVertical3D",
    "LineZigZag3D",
    "LineCorkscrew3D",
    "AreaRectangle",
    "AreaRoundedRectangle",
    "AreaPolygon",
    "AreaCircle",
    "AreaEllipse",
    "AreaFootprint",
    "AreaBoundary",
    "AreaHydroPoly",
    "AreaNaturalPoly",
    "AreaSquare",
    "AreaHexagonFlat",
    "AreaHexagonPointy",
]
ExpressionReturnType = Literal["Default", "String", "Numeric"]

WorkspaceFactory = Literal[
    "SDE",
    "FileGDB",
    "Raster",
    "Shapefile",
    "OLEDB",
    "Access",
    "DelimitedTextFile",
    "Custom",
    "Sql",
    "Tin",
    "TrackingServer",
    "NetCDF",
    "LASDataset",
    "SqlLite",
    "FeatureService",
    "ArcInfo",
    "Cad",
    "Excel",
    "WFS",
    "StreamService",
    "BIMFile",
    "InMemoryDB",
    "NoSQL",
    "BigDataConnection",
    "KnowledgeGraph",
    "NITF",
]


class SpatialReference(TypedDict, total=False):
    wkid: int
    latestWkit: int
    vcsWkid: int
    latestVcsWkid: int


class _Geometry(TypedDict, total=False):
    spatialReference: SpatialReference
    hasM: bool
    hasZ: bool


class __Point(TypedDict):
    x: Union[float, int]
    y: Union[float, int]


class _Point(__Point, total=False):
    spatialReference: SpatialReference
    m: Union[float, int]
    z: Union[float, int]


Point: TypeAlias = Union[_Point, list[float], list[int], list[Union[float, int]]]

CIMICCColorSpace = Any

CIMSpotColorSpace = Any

ColorSpace = Union[CIMICCColorSpace, CIMSpotColorSpace]


class CIMColor(TypedDict, total=False):
    colorSpace: ColorSpace  # Optional
    values: list[float]


class CIMCMYKColor(CIMColor):
    type: Literal["CIMCMYKColor"]


class CIMGrayColor(CIMColor):
    type: Literal["CIMGrayColor"]


class CIMHSLColor(CIMColor):
    type: Literal["CIMHSLColor"]


class CIMHSVColor(CIMColor):
    type: Literal["CIMHSVColor"]


class CIMLABColor(CIMColor):
    type: Literal["CIMLABColor"]


class CIMRGBColor(CIMColor):
    type: Literal["CIMRGBColor"]


class CIMSpotColor(CIMColor):
    type: Literal["CIMSpotColor"]


class CIMXYZColor(CIMColor):
    type: Literal["CIMXYZColor"]


Color = Union[CIMCMYKColor, CIMGrayColor, CIMHSLColor, CIMHSVColor, CIMLABColor, CIMRGBColor, CIMSpotColor, CIMXYZColor]


class CIMSymbolLayerIdentifier(TypedDict, total=False):
    symbolLayerName: str


class CIMSymbolLayer(TypedDict, total=False):
    effects: list["CIMGeometricEffect"]
    enable: bool
    name: str
    colorLocked: bool
    pritiveName: str
    overprint: bool


LineCapStyle = Literal["Butt", "Round", "Square"]
LineJoinStyle = Literal["Bevel", "Round", "Miter"]
Simple3DLineStyle = Literal["Tube", "Strip", "Wall"]


class CIMStroke(TypedDict, total=False):
    capStyle: LineCapStyle
    joinStyle: LineJoinStyle
    lineStyle3d: Simple3DLineStyle
    miterLimit: float
    width: float
    closeCaps3d: bool


class CIMSolidStroke(CIMSymbolLayer, CIMStroke):
    type: Literal["CIMSolidStroke"]
    color: CIMRGBColor


class LineProps(TypedDict, total=False):
    color: CIMRGBColor
    width: float
    dash_template: Optional[list[int]]


class CIMSolidFill(TypedDict):
    type: Literal["CIMSolidFill"]
    enable: bool
    color: CIMRGBColor


MarkerPlacement = Any


class CIMMarker(TypedDict, total=False):
    anchorPoint: Point
    anchorPointUnits: SymbolUnits
    angleX: int
    angleY: int
    dominantSizeAxis3D: DominantSizeAxis
    offsetX: int
    offsetY: int
    offsetZ: int
    rotateClockwise: bool
    rotation: int
    size: int
    billboardMode3D: BillboardMode
    markerPlacement: MarkerPlacement


CIMBarChartMarker = Any

CIMCharacterMarker = Any

CIMGradientFill = Any

CIMGradientStroke = Any

CIMHatchFill = Any

CIMMaterialSymbolLayer = Any

CIMObjectMarker3D = Any

CIMPictureFill = Any

CIMPictureStroke = Any

CIMPieChartMarker = Any

CIMProceduralSymbolLayer = Any

CIMSolidMeshEdge = Any

CIMStackedBarChartMarker = Any


class Envelope(TypedDict, total=False):
    mmax: float
    mmin: float
    spatialReference: SpatialReference
    xmax: float
    xmin: float
    ymax: float
    ymin: float
    zmax: float
    zmin: float


CurveGeometry = Union[Point, "Curve"]
Path: TypeAlias = Union[Point, list[Point], list[list[Point]]]
CurvePath: TypeAlias = Union[CurveGeometry, list[CurveGeometry], list[list[CurveGeometry]]]
Ring: TypeAlias = list[Union[Point, list[Point]]]
CurveRing: TypeAlias = Union[CurveGeometry, list[CurveGeometry], list[list[CurveGeometry]]]


class Multipoint(_Geometry, total=False):
    points: list[Point]


class Polygon(_Geometry, total=False):
    rings: list[Ring]
    curveRings: list[CurveRing]


Material = Any


class Multipatch(_Geometry, total=False):
    binaryPatches: str
    materials: list[Material]


class Polyline(_Geometry, total=False):
    paths: list[Path]
    curvePaths: list[CurvePath]


Area = Union[Envelope, Polygon]


class CircularArc(TypedDict):
    c: list[Point]


class EllipticArc(TypedDict):
    a: list[Union[Point, int, float]]


class BezierCurve(TypedDict):
    b: list[Point]


Curve: TypeAlias = Union[CircularArc, EllipticArc, BezierCurve]


class GeometryBag(_Geometry):
    points: list["Geometry"]  # type: ignore  # cyclic


Geometry: TypeAlias = Union[  # type: ignore  # cyclic
    Point,
    Multipoint,
    Multipatch,
    Polyline,
    Polygon,
    Envelope,
    GeometryBag,
    Area,
    Path,
    CurvePath,
    Ring,
    CurveRing,
    Curve,
]


CIMWaterFill = Any

CIMglTFMarker3D = Any

CIMGeometricEffectAddControlPoints = Any

CIMGeometricEffectArrow = Any

CIMGeometricEffectBuffer = Any

CIMGeometricEffectCircularSector = Any

CIMGeometricEffectCut = Any

CIMGeometricEffectDashes = Any

CIMGeometricEffectDonut = Any

CIMGeometricEffectEnclosingPolygon = Any

CIMGeometricEffectExtension = Any

CIMGeometricEffectJog = Any

CIMGeometricEffectLocalizerFeather = Any

CIMGeometricEffectMove = Any

CIMGeometricEffectOffset = Any

CIMGeometricEffectOffsetHatch = Any

CIMGeometricEffectOffsetTangent = Any

CIMGeometricEffectRadial = Any

CIMGeometricEffectRegularPolygon = Any

CIMGeometricEffectReverse = Any

CIMGeometricEffectRotate = Any

CIMGeometricEffectScale = Any

CIMGeometricEffectSuppress = Any

CIMGeometricEffectTaperedPolygon = Any

CIMGeometricEffectWave = Any

CIMGeometricEffect = Union[
    CIMGeometricEffectAddControlPoints,
    CIMGeometricEffectArrow,
    CIMGeometricEffectBuffer,
    CIMGeometricEffectCircularSector,
    CIMGeometricEffectCut,
    CIMGeometricEffectDashes,
    CIMGeometricEffectDonut,
    CIMGeometricEffectEnclosingPolygon,
    CIMGeometricEffectExtension,
    CIMGeometricEffectJog,
    CIMGeometricEffectLocalizerFeather,
    CIMGeometricEffectMove,
    CIMGeometricEffectOffset,
    CIMGeometricEffectOffsetHatch,
    CIMGeometricEffectOffsetTangent,
    CIMGeometricEffectRadial,
    CIMGeometricEffectRegularPolygon,
    CIMGeometricEffectReverse,
    CIMGeometricEffectRotate,
    CIMGeometricEffectScale,
    CIMGeometricEffectSuppress,
    CIMGeometricEffectTaperedPolygon,
    CIMGeometricEffectWave,
]

SymbolLayer: TypeAlias = Union[  # type: ignore  # cyclic
    "CIMBarChartMarker",
    "CIMCharacterMarker",
    "CIMGradientFill",
    "CIMGradientStroke",
    "CIMHatchFill",
    "CIMMaterialSymbolLayer",
    "CIMObjectMarker3D",
    "CIMPictureFill",
    "CIMPictureMarker",
    "CIMPictureStroke",
    "CIMPieChartMarker",
    "CIMProceduralSymbolLayer",
    "CIMSolidFill",
    "CIMSolidMeshEdge",
    "CIMSolidStroke",
    "CIMStackedBarChartMarker",
    "CIMVectorMarker",  # type: ignore  # cyclic
    "CIMWaterFill",
    "CIMglTFMarker3D",
]


class _CIMMultiLayerSymbol(TypedDict):
    symbolLayers: list["SymbolLayer"]


class CIMMultiLayerSymbol(TypedDict, total=False):
    effects: list[CIMGeometricEffect]
    symbolLayers: list["SymbolLayer"]
    thumbnailURI: str
    useRealWorldSymbolSizes: bool


class CIMLineSymbol(CIMMultiLayerSymbol):
    type: Literal["CIMLineSymbol"]


class CIMMeshSymbol(CIMMultiLayerSymbol):
    type: Literal["CIMMeshSymbol"]


class CIMPolygonSymbol(CIMMultiLayerSymbol):
    type: Literal["CIMPolygonSymbol"]


Callout = Any


class CIMFontVariation(TypedDict):
    tagName: str
    value: float


class CIM3DSymbolProperties(TypedDict, total=False):
    dominateSizeAxis3D: DominantSizeAxis
    rotationOrder3D: RotationOrder
    scaleZ: float
    scaleY: float


class CIMTextSymbol(TypedDict, total=False):
    type: Literal["CIMTextSymbol"]
    angle: float
    angleX: float
    angleY: float
    blockProgression: BlockProgression
    callout: Callout
    compatibilityMode: bool
    countryISO: str
    depth3D: float
    drawGlyphsAsGeometry: bool
    drawSoftHyphen: bool
    extrapolateBaselines: bool
    flipAngle: float
    fontEffects: FontEffects
    fontEncoding: FontEncoding
    fontFamilyName: str
    fontStyleName: str
    fontType: FontType
    fontVariationSettings: list[CIMFontVariation]
    glyphRotation: float
    haloSize: float
    haloSymbol: CIMPolygonSymbol
    height: float
    hinting: GlyphHinting
    horizontalAlignment: HorizontalAlignment
    indentAfter: float
    indentBefore: float
    indentFirstLine: float
    kerning: bool
    languageISO: str
    letterSpacing: float
    letterWidth: float
    ligatures: bool
    lineGap: float
    lineGapType: LineGapType
    offsetX: float
    offsetY: float
    offsetZ: float
    shadowColor: Color
    shadowOffsetX: float
    shadowOffsetY: float
    smallCaps: bool
    strikethrough: bool
    symbol: CIMPolygonSymbol
    symbol3DProperties: CIM3DSymbolProperties
    textCase: TextCase
    textDirection: TextReadingDirection
    underline: bool
    verticalAlignment: VerticalAlignment
    verticalGlyphOrientation: VerticalGlyphOrientation
    wordSpacing: float
    billboardMode3D: BillboardMode
    overprint: bool


class CIMColorSubstitution(TypedDict):
    oldColor: Color
    newColor: Color


CIMAnimatedSymbolProperties = Any

TextureFilter = Any


class _CIMPictureMarker(CIMSymbolLayer, CIMMarker):
    type: Literal["CIMPictureMarker"]
    scaleX: int  # 1


class CIMPictureMarker(_CIMPictureMarker, total=False):
    colorSubstitutions: list[CIMColorSubstitution]
    depth3D: float
    invertBackfaceTexture: bool
    textureFilter: Union[TextureFilter]
    tintColor: Color
    url: str
    verticalOrientation3D: bool
    animatedSymbolProperties: CIMAnimatedSymbolProperties


class CIMPointSymbol(TypedDict):
    type: Literal["CIMPointSymbol"]
    symbolLayers: list["SymbolLayer"]
    haloSize: int
    scaleX: int
    angleAlignment: Literal["Display"]


class CIMScaleDependentSizeVariation(TypedDict):
    scale: float
    size: float


Symbol = Union[CIMLineSymbol, CIMMeshSymbol, CIMPointSymbol, CIMPolygonSymbol, CIMTextSymbol]  # type: ignore  # cyclic


class CIMClippingPath(TypedDict, total=False):
    clippingType: ClippingType
    path: Polygon


class _CIMVectorMarker(CIMSymbolLayer):
    type: Literal["CIMVectorMarker"]


class CIMVectorMarker(_CIMVectorMarker, CIMMarker, total=False):
    depth3D: int
    frame: Envelope
    markerGraphics: list["CIMMarkerGraphic"]  # type: ignore  # cyclic
    verticalOrientation3D: bool
    scaleSymbolsProportionally: bool
    respectFrame: bool
    clippingPath: CIMClippingPath


class _CIMMarkerGraphic(TypedDict):
    type: Literal["CIMMarkerGraphic"]


class CIMMarkerGraphic(_CIMMarkerGraphic, total=False):
    geometry: Geometry
    symbol: Symbol
    textString: str
    primitiveName: str


class _CIMSymbolReference(TypedDict):
    type: Literal["CIMSymbolReference"]
    symbol: Symbol


class CIMSymbolReference(_CIMSymbolReference, total=False):
    stylePath: str
    symbolName: str
    minScale: float
    maxScale: float
    scaleDependentSizeVariation: list[CIMScaleDependentSizeVariation]
    minDistance: float
    maxDistance: float


CIMColorVisualVariable = Any

CIMMultilevelColorVisualVariable = Any

CIMRotationVisualVariable = Any

CIMSizeVisualVariable = Any

CIMTransparencyVisualVariable = Any

CIMVisualVariable = Union[
    CIMColorVisualVariable,
    CIMMultilevelColorVisualVariable,
    CIMRotationVisualVariable,
    CIMSizeVisualVariable,
    CIMTransparencyVisualVariable,
]


class CIMVisualVariableRenderer(TypedDict, total=False):
    visualVariables: list[CIMVisualVariable]


class _CIMSimpleRenderer(CIMVisualVariableRenderer):
    type: Literal["CIMSimpleRenderer"]
    symbol: CIMSymbolReference
    patch: PatchShape  # "Default"


class CIMSimpleRenderer(_CIMSimpleRenderer, total=False):
    description: Optional[str]
    label: Optional[str]
    alternateSymbols: list[CIMSymbolReference]


CIMFixedColorRamp = Any

CIMLinearContinuousColorRamp = Any

CIMMultipartColorRamp = Any

CIMPolarContinuousColorRamp = Any

CIMRandomHSVColorRamp = Any

ColorRamp = Union[
    CIMFixedColorRamp,
    CIMLinearContinuousColorRamp,
    CIMMultipartColorRamp,
    CIMPolarContinuousColorRamp,
    CIMRandomHSVColorRamp,
]


class CIMUniqueValue(TypedDict, total=False):
    type: Literal["CIMUniqueValue"]
    fieldValues: list[str]


class CIMUniqueValueClass(TypedDict, total=False):
    type: Literal["CIMUniqueValueClass"]
    description: str
    editable: bool
    label: str
    patch: PatchShape
    symbol: CIMSymbolReference
    values: list[CIMUniqueValue]
    visible: bool
    alternateSymbols: list[CIMSymbolReference]


class CIMUniqueValueGroup(TypedDict, total=False):
    type: Literal["CIMUniqueValueGroup"]
    classes: list[CIMUniqueValueClass]
    heading: str


class CIMExpressionInfo(TypedDict, total=False):
    type: Literal["CIMExpressionInfo"]
    title: str
    expression: str
    name: str
    returnType: ExpressionReturnType


CIMUniqueValueRendererAuthoringInfo = Any


# CIMVisualVariable
class CIMUniqueValueRenderer(CIMVisualVariableRenderer, total=False):
    type: Literal["CIMUniqueValueRenderer"]
    colorRamp: ColorRamp
    defaultDescription: str
    defaultLabel: str
    defaultSymbol: CIMSymbolReference
    defaultSymbolPatch: PatchShape
    fields: list[str]
    groups: list[CIMUniqueValueGroup]
    useDefaultSymbol: bool
    styleGallery: str
    valueExpressionInfo: CIMExpressionInfo
    polygonSymbolColorTarget: PolygonSymbolColorTarget
    authoringInfo: CIMUniqueValueRendererAuthoringInfo


class CIMSourceModifiedTime(TypedDict):
    type: Literal["TimeInstant"]


class CIMLayerElevationSurface(TypedDict):
    type: Literal["CIMLayerElevationSurface"]
    mapElevationID: Literal["{752ADD4F-A4BC-44F1-8B73-D03138DD2020}"]


class CIMMaplexStackingSeparator(TypedDict):
    type: Literal["CIMMaplexStackingSeparator"]
    separator: Literal[" ", ","]
    splitAfter: bool


class CIMMaplexLabelStackingProperties(TypedDict):
    type: Literal["CIMMaplexLabelStackingProperties"]
    stackAlignment: Literal["ChooseBest"]
    maximumNumberOfLines: int
    minimumNumberOfCharsPerLine: int
    maximumNumberOfCharsPerLine: int
    separators: list[CIMMaplexStackingSeparator]


class CIMMaplexExternalZonePriorities(TypedDict):
    type: Literal["CIMMaplexExternalZonePriorities"]
    aboveLeft: int
    aboveCenter: int
    aboveRight: int
    centerRight: int
    belowRight: int
    belowCenter: int
    belowLeft: int
    centerLeft: int


class CIMStandardLineLabelPriorities(TypedDict, total=False):
    type: Literal["CIMStandardLineLabelPriorities"]
    aboveStart: int
    aboveAlong: int
    aboveEnd: int
    centerStart: int
    centerAlong: int
    centerEnd: int
    belowStart: int
    belowAlong: int
    belowEnd: int


class CIMMaplexOffsetAlongLineProperties(TypedDict):
    type: Literal["CIMMaplexOffsetAlongLineProperties"]
    placementMethod: Literal["BestPositionAlongLine"]
    labelAnchorPoint: Literal["CenterOfLabel"]
    distanceUnit: Literal["Percentage"]
    useLineDirection: bool


class CIMMaplexRotationProperties(TypedDict):
    type: Literal["CIMMaplexRotationProperties"]
    rotationType: Literal["Arithmetic"]
    alignmentType: Literal["Straight"]


class CIMMaplexStrategyPriorities(TypedDict):
    type: Literal["CIMMaplexStrategyPriorities"]
    stacking: int
    overrun: int
    fontCompression: int
    fontReduction: int
    abbreviation: int


class CIMMaplexLabelPlacementProperties(TypedDict, total=False):
    type: Literal["CIMMaplexLabelPlacementProperties"]
    featureType: LabelFeatureType
    avoidPolygonHoles: bool
    canOverrunFeature: bool
    canPlaceLabelOutsidePolygon: bool
    canRemoveOverlappingLabel: bool
    canStackLabel: bool
    connectionType: Literal["Unambiguous"]
    constrainOffset: Literal["NoConstraint"]
    contourAlignmentType: Literal["Page"]
    contourLadderType: Literal["Straight"]
    contourMaximumAngle: int
    enableConnection: bool
    enablePointPlacementPriorities: bool
    featureWeight: int
    fontHeightReductionLimit: int
    fontHeightReductionStep: float
    fontWidthReductionLimit: int
    fontWidthReductionStep: int
    graticuleAlignmentType: Literal["Straight"]
    keyNumberGroupName: Literal["Default"]
    labelBuffer: int
    labelLargestPolygon: bool
    labelPriority: int
    labelStackingProperties: list[CIMMaplexLabelStackingProperties]
    lineFeatureType: Literal["General"]
    linePlacementMethod: Literal["OffsetCurvedFromLine"]
    maximumLabelOverrun: int
    maximumLabelOverrunUnit: Literal["Point"]
    minimumFeatureSizeUnit: Literal["Map"]
    multiPartOption: Literal["OneLabelPerPart"]
    offsetAlongLineProperties: CIMMaplexOffsetAlongLineProperties
    pointExternalZonePriorities: CIMMaplexExternalZonePriorities
    pointPlacementMethod: Literal["AroundPoint"]
    polygonAnchorPointType: Literal["GeometricCenter"]
    polygonBoundaryWeight: int
    polygonExternalZones: CIMMaplexExternalZonePriorities
    polygonFeatureType: Literal["General"]
    polygonInternalZones: CIMMaplexExternalZonePriorities
    polygonPlacementMethod: Literal["CurvedInPolygon"]
    primaryOffset: int
    primaryOffsetUnit: Literal["Point"]
    removeExtraWhiteSpace: bool
    repetitionIntervalUnit: Literal["Point"]
    rotationProperties: CIMMaplexRotationProperties
    secondaryOffset: int
    strategyPriorities: CIMMaplexStrategyPriorities
    thinningDistanceUnit: Literal["Point"]
    truncationMarkerCharacter: str
    truncationMinimumLength: int
    truncationPreferredCharacters: str
    truncationExcludedCharacters: str
    polygonAnchorPointPerimeterInsetUnit: Literal["Point"]


class CIMStandardPointPlacementPriorities(TypedDict, total=False):
    type: Literal["CIMStandardPointPlacementPriorities"]
    aboveLeft: int
    aboveCenter: int
    aboveRight: int
    centerLeft: int
    centerRight: int
    belowLeft: int
    belowCenter: int
    belowRight: int


class CIMStandardLineLabelPosition(TypedDict, total=False):
    type: Literal["CIMStandardLineLabelPosition"]
    above: bool
    inLine: bool
    parallel: bool


class CIMStandardLabelPlacementProperties(TypedDict, total=False):
    type: Literal["CIMStandardLabelPlacementProperties"]
    featureType: LabelFeatureType
    featureWeight: StandardFeatureWeight
    labelWeight: StandardLabelWeight
    numLabelsOption: Literal["OneLabelPerName"]
    lineLabelPosition: CIMStandardLineLabelPosition
    lineLabelPriorities: CIMStandardLineLabelPriorities
    pointPlacementMethod: StandardPointPlacementMethod
    pointPlacementPriorities: CIMStandardPointPlacementPriorities
    rotationType: Literal["Arithmetic"]
    polygonPlacementMethod: StandardPolygonPlacementMethod


class CIMLabelClass(TypedDict, total=False):
    type: Literal["CIMLabelClass"]
    expressionTitle: Literal["Custom"]
    expression: str
    expressionEngine: Literal["Arcade", "Python"]
    featuresToLabel: Literal["AllVisibleFeatures"]
    maximumScale: int
    minimumScale: int
    maplexLabelPlacementProperties: CIMMaplexLabelPlacementProperties
    name: str
    priority: int
    standardLabelPlacementProperties: CIMStandardLabelPlacementProperties
    textSymbol: CIMSymbolReference
    useCodedValue: bool
    visibility: bool
    iD: int


class CIMNumericFormat(TypedDict):
    type: Literal["CIMNumericFormat"]
    alignmentOption: Literal["esriAlignRight"]
    alignmentWidth: int
    roundingOption: Literal["esriRoundNumberOfDecimals"]
    roundingValue: int


class _CIMFieldDescription(TypedDict, total=False):
    type: Literal["CIMFieldDescription"]
    fieldName: str


class CIMFieldDescription(_CIMFieldDescription, total=False):
    alias: str
    numberFormat: CIMNumericFormat
    visible: bool
    searchMode: Literal["Exact"]


class CIMMapElevationSurface(TypedDict):
    type: Literal["CIMMapElevationSurface"]
    elevationMode: Literal["BaseGlobeSurface"]
    name: Literal["Ground"]
    verticalExaggeration: int
    mapElevationID: Literal["{752ADD4F-A4BC-44F1-8B73-D03138DD2020}"]
    color: CIMRGBColor
    surfaceTINShadingMode: Literal["Smooth"]
    visibility: bool
    expanded: bool


class CIMStandardDataConnection(TypedDict, total=False):
    type: Literal["CIMStandardDataConnection"]
    workspaceConnectionString: str
    workspaceFactory: WorkspaceFactory
    customWorkspaceFactorCLSID: str
    dataset: str
    datasetType: EsriDatasetType


CIMDataConnection = Union[CIMStandardDataConnection]


class CIMFeatureTable(TypedDict, total=False):
    type: Literal["CIMFeatureTable"]
    displayField: str
    editable: bool
    fieldDescriptions: list[CIMFieldDescription]
    dataConnection: CIMDataConnection
    studyAreaSpatialRel: EsriSpatialRelEnum
    searchOrder: EsriSearchOrder


class CIMBinaryReference(TypedDict):
    type: Literal["CIMBinaryReference"]
    uRI: str  # The URI of the binary reference. Typically set by the system but used as a reference path.
    data: str  # The base64 encoded data of the binary reference.


CIM3DLayerProperties = Any


class CIMLayerTemplate(TypedDict):
    uRI: str
    layerTemplateID: str
    parameters: dict


CIMChart = Any


class CIMStringMap(TypedDict):
    key: str
    value: str


class CIMSymbolLayerDrawing(TypedDict, total=False):
    symbolLayers: list[CIMSymbolLayerIdentifier]
    useSymbolLayerDrawing: bool


class CIMDefinition(TypedDict, total=False):
    name: str
    uRI: str
    sourceURI: str
    sourceModifiedTime: CIMSourceModifiedTime
    metadataURI: str
    useSourceMetadata: bool
    sourcePortalUrl: str


class CIMLayerDefinition(TypedDict, total=False):
    attribution: str
    description: str
    layerElevation: CIMLayerElevationSurface
    expanded: bool
    layer3DProperties: CIM3DLayerProperties
    layerMasks: list[str]
    maxScale: float
    minScale: float
    layerType: MapLayerType
    showLegends: bool
    transparency: float
    visibility: bool
    displayCacheType: DisplayCacheType
    maxDisplayCacheAge: int
    layerTemplate: CIMLayerTemplate
    showPopups: bool
    serviceLayerID: int
    charts: list[CIMChart]
    searchable: bool
    refreshRate: int
    refreshRateUnit: EsriTimeUnits
    showMapTips: bool
    customProperties: list[CIMStringMap]
    webMapLayerID: str
    blendingMode: BlendingMode
    allowDrapingOnIntegratedMesh: bool


CIMActivity = Any

CIMCondition = Any


class CIMLayerAction(TypedDict, total=False):
    activities: list[CIMActivity]
    conditions: list[CIMCondition]


SymbolSubstitutionType = Literal["Color", "IndividualSubordinate", "IndividualDominant"]
Renderer: TypeAlias = Union[CIMSimpleRenderer, CIMUniqueValueRenderer]  # type: ignore  # cyclic


class CIMSymbolLayerMasking(TypedDict, total=False):
    symbolLayers: list[CIMSymbolLayerIdentifier]


CIMBinningFeatureReduction = Any

CIMClusteringFeatureReduction = Any

FeatureReduction = Union[CIMBinningFeatureReduction, CIMClusteringFeatureReduction]


class _LayerDefinitions(TypedDict, total=False):
    layerDefinitions: list["LayerDefinition"]  # type: ignore  # cyclic


class CIMGeoFeatureLayerDefinition(TypedDict, total=False):
    actions: list[CIMLayerAction]
    exclusionSet: int
    featureMasks: list[CIMDataConnection]
    labelClasses: list[CIMLabelClass]
    labelVisibility: bool
    maskedSymbolLayers: list[CIMSymbolLayerMasking]
    mostCurrentRenderer: Renderer
    renderer: Renderer
    scaleSymbols: bool
    snappable: bool
    symbolLayerDrawing: CIMSymbolLayerDrawing
    trackLinesRenderer: Renderer
    previousObservationsRenderer: Renderer
    previousObservationsCount: int
    useRealWorldSymbolSizes: bool
    showPreviousObservations: bool
    featureReduction: FeatureReduction
    showTracks: bool


class CIMFeatureLayer(CIMDefinition, CIMGeoFeatureLayerDefinition, CIMLayerDefinition, _LayerDefinitions, total=False):
    type: Literal["CIMFeatureLayer"]
    autoGenerateFeatureTemplates: bool
    featureElevationExpression: str
    featureTable: CIMFeatureTable
    htmlPopupEnabled: bool
    selectable: bool
    featureCacheType: Literal["Session"]
    displayFiltersType: Literal["ByScale"]
    featureBlendingMode: BlendingMode


class CIMStandaloneTableContainer(TypedDict, total=False):
    standaloneTables: list[str]


class CIMGroupLayerDefinition(TypedDict, total=False):
    layers: list[str]
    symbolLayerDrawing: CIMSymbolLayerDrawing


class CIMGroupLayer(
    CIMDefinition, CIMLayerDefinition, CIMGroupLayerDefinition, CIMStandaloneTableContainer, _LayerDefinitions
):
    type: Literal["CIMGroupLayer"]


LayerDefinition = Union[  # type: ignore  # cyclic
    CIMFeatureLayer, CIMGroupLayer
]  # There are many others currently only feature is supported in EK.


class CIMVersion(TypedDict):
    version: str
    build: Literal[26828]


class CIMLayerDocument(CIMVersion):
    type: Literal["CIMLayerDocument"]
    layers: list[str]
    layerDefinitions: list[LayerDefinition]
    binaryReferences: list[CIMBinaryReference]
    elevationSurfaces: list[CIMMapElevationSurface]
    rGBColorProfile: Literal["sRGB IEC61966-2-1 noBPC"]
    cMYKColorProfile: Literal["U.S. Web Coated (SWOP) v2"]
