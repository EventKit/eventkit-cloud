import ol from 'openlayers';
import * as jsts from 'jsts';
import * as utils from '../utils/mapUtils'

describe('mapUtils', () => {

    it('convertJSTSGeometry should covert a JSTS from one SRS to another', () => {
        const writer = new jsts.io.GeoJSONWriter();
        const geojsonReader = new jsts.io.GeoJSONReader();
        const ol3GeoJSON = new ol.format.GeoJSON();
        var reader = new jsts.io.WKTReader();
        var jstsGeom = reader.read('POINT (-20 0)');
        expect(jstsGeom.getCoordinate()).toEqual({x: -20, y: 0, z: undefined});
        var newGeom = utils.transformJSTSGeometry(jstsGeom, 'EPSG:4326', 'EPSG:3857')
        expect(newGeom.getCoordinate()).toEqual({
            "x": -2226389.8158654715,
            "y": -7.081154551613622e-10,
            "z": undefined
        });
        var newerGeom = utils.transformJSTSGeometry(newGeom, 'EPSG:3857', 'EPSG:4326')
        expect(newerGeom.getCoordinate()).toEqual({x: -20, y: 0, z: undefined});
        expect(newerGeom).toEqual(jstsGeom);
    });

    it('bufferGeometry should covert a point to a polygon', () => {
        const reader = new jsts.io.WKTReader();
        var jstsGeom = reader.read('POINT (-20 0)');
        expect(jstsGeom.getGeometryType()).toEqual("Point");
        var returnedGeom = utils.bufferGeometry(jstsGeom)
        expect(returnedGeom.getGeometryType()).toEqual("Polygon");
    });

    it('bufferGeometry should not change a polygon', () => {
        const reader = new jsts.io.WKTReader();
        var jstsGeom = reader.read('POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))');
        expect(jstsGeom.getGeometryType()).toEqual("Polygon");
        var returnedGeom = utils.bufferGeometry(jstsGeom)
        expect(returnedGeom.getGeometryType()).toEqual("Polygon");
        expect(jstsGeom).toEqual(returnedGeom);
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON Point to JSTS Geometry', () => {
        const point = {"type": "Point", "coordinates": [100.0, 0.0]};
        const returnedGeom = utils.convertGeoJSONtoJSTS(point)
        expect(returnedGeom.getGeometryType()).toEqual("Polygon");
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON LineString to JSTS Geometry', () => {
        const lineString = {
            "type": "LineString",
            "coordinates": [[100.0, 0.0], [101.0, 1.0]]
        }
        const returnedGeom = utils.convertGeoJSONtoJSTS(lineString)
        expect(returnedGeom.getGeometryType()).toEqual("Polygon");
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON Polygon(no holes) to JSTS Geometry', () => {
        const polygon = {
            "type": "Polygon",
            "coordinates": [
                [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]]
            ]
        }
        const returnedGeom = utils.convertGeoJSONtoJSTS(polygon)
        expect(returnedGeom.getGeometryType()).toEqual("Polygon");
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON Polygon(holes) to JSTS Geometry', () => {
        const polygon = {
            "type": "Polygon",
            "coordinates": [
                [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
                [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]
            ]
        }
        const returnedGeom = utils.convertGeoJSONtoJSTS(polygon)
        expect(returnedGeom.getGeometryType()).toEqual("Polygon");
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON MultiPoint to JSTS Geometry', () => {
        const multiPoint = {
            "type": "MultiPoint",
            "coordinates": [[100.0, 0.0], [101.0, 1.0]]
        }
        const returnedGeom = utils.convertGeoJSONtoJSTS(multiPoint)
        expect(returnedGeom.getGeometryType()).toEqual("MultiPolygon");
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON MultiLineString to JSTS Geometry', () => {
        const multiLineString = {
            "type": "MultiLineString",
            "coordinates": [
                [[100.0, 0.0], [101.0, 1.0]],
                [[102.0, 2.0], [103.0, 3.0]]
            ]
        }
        const returnedGeom = utils.convertGeoJSONtoJSTS(multiLineString)
        expect(returnedGeom.getGeometryType()).toEqual("MultiPolygon");
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON MultiPolygon to JSTS Geometry', () => {
        const multiPolygon = {
            "type": "MultiPolygon",
            "coordinates": [
                [[[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]]],
                [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
                    [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]
            ]
        }
        const returnedGeom = utils.convertGeoJSONtoJSTS(multiPolygon)
        expect(returnedGeom.getGeometryType()).toEqual("MultiPolygon");
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON GeometryCollection to JSTS Geometry', () => {
        const geometryCollection = {
            "type": "GeometryCollection",
            "geometries": [
                {
                    "type": "Point",
                    "coordinates": [100.0, 0.0]
                },
                {
                    "type": "LineString",
                    "coordinates": [[101.0, 0.0], [102.0, 1.0]]
                }
            ]
        }
        const returnedGeom = utils.convertGeoJSONtoJSTS(geometryCollection)
        expect(returnedGeom.getGeometryType()).toEqual("MultiPolygon");
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON FeatureCollection to JSTS Geometry', () => {
        const featureCollection = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [102.0, 0.5]
                },
                "properties": {
                    "prop0": "value0"
                }
            }, {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [102.0, 0.0],
                        [103.0, 1.0],
                        [104.0, 0.0],
                        [105.0, 1.0]
                    ]
                },
                "properties": {
                    "prop0": "value0",
                    "prop1": 0.0
                }
            }, {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [100.0, 0.0],
                            [101.0, 0.0],
                            [101.0, 1.0],
                            [100.0, 1.0],
                            [100.0, 0.0]
                        ]
                    ]
                },
                "properties": {
                    "prop0": "value0",
                    "prop1": {
                        "this": "that"
                    }
                }
            }]
        }
        const returnedGeom = utils.convertGeoJSONtoJSTS(featureCollection)
        expect(returnedGeom.getGeometryType()).toEqual("MultiPolygon");
    });
});