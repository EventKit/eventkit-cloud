from eventkit_cloud.utils.arcgis.types import cim_types, service_types

circle_arc: cim_types.EllipticArc = {"a": [[1.2246467991473532e-16, 2], [0, 0], 0, 1]}
point: cim_types.Point = [1.2246467991473532e-16, 2]
curve_geometry: list[cim_types.CurveGeometry] = [point, circle_arc]
sms_circle: cim_types.Polygon = {"curveRings": [curve_geometry]}

ring: cim_types.Ring = [
    [16.9899999999999984, 11.32],
    [16.9899999999999984, 5.66000000000000014],
    [11.34, 5.66000000000000014],
    [11.34, 0],
    [5.69000000000000039, 0],
    [5.69000000000000039, 5.66000000000000014],
    [0.01, 5.66000000000000014],
    [0.01, 11.32],
    [5.69000000000000039, 11.32],
    [5.69000000000000039, 17],
    [11.34, 17],
    [11.34, 11.32],
    [16.9899999999999984, 11.32],
]

sms_cross: cim_types.Polygon = {"rings": [ring]}

sms_diamond: cim_types.Polygon = {
    "rings": [
        [
            [13.35, 8.48000000000000043],
            [8.5, 0],
            [3.64999999999999991, 8.48000000000000043],
            [8.5, 17],
            [13.35, 8.48000000000000043],
        ]
    ]
}
sms_square: cim_types.Polygon = {"rings": [[[0, 17], [17, 17], [17, 0], [0, 0], [0, 17]]]}
sms_triangle: cim_types.Polygon = {"rings": [[[0, 0], [8.60999999999999943, 14.85], [17, 0], [0, 0]]]}


def get_marker_geometry(sms: service_types.SimpleMarkerSymbol) -> cim_types.Geometry:
    match sms.get("style"):
        case "esriSMSCircle":
            return sms_circle
        case "esriSMSCross":
            return sms_cross
        case "esriSMSDiamond":
            return sms_diamond
        case "esriSMSSquare":
            return sms_square
        case "esriSMSTriangle":
            return sms_triangle
        case "esriSMSX":
            raise NotImplementedError()
        case _:
            raise NotImplementedError()