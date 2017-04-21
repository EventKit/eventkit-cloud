import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as actions from '../actions/mapToolActions';
import ol from 'openlayers';
import * as jsts from 'jsts';
import types from '../actions/mapToolActionTypes'

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('mapTool actions', () => {

    it('setBoxButtonSelected should return type SET_BOX_SELECTED', ()=> {
        expect(actions.setBoxButtonSelected()).toEqual({
            type: 'SET_BOX_SELECTED'
        })
    });

    it('setFreeButtonSelected should return type SET_FREE_SELECTED', () => {
        expect(actions.setFreeButtonSelected()).toEqual({
            type: 'SET_FREE_SELECTED'
        });
    });

    it('setMapViewButtonSelected should return type SET_VIEW_SELECTED', () => {
        expect(actions.setMapViewButtonSelected()).toEqual({
            type: 'SET_VIEW_SELECTED'
        });
    });

    it('setImportButtonSelected should return type SET_IMPORT_SELECTED', () => {
        expect(actions.setImportButtonSelected()).toEqual({
            type: 'SET_IMPORT_SELECTED'
        });
    });

    it('setSearchAOIButtonSelected should return type SET_SEARCH_SELECTED', () => {
        expect(actions.setSearchAOIButtonSelected()).toEqual({
            type: 'SET_SEARCH_SELECTED'
        });
    });

    it('setAllButtonsDefault should return type SET_BUTTONS_DEFAULT', () => {
        expect(actions.setAllButtonsDefault()).toEqual({
            type: 'SET_BUTTONS_DEFAULT'
        });
    });

    it('setImportModalState should return type SET_IMPORT_MODAL_STATE and the passed in bool', () => {
        expect(actions.setImportModalState(true)).toEqual({
            type: 'SET_IMPORT_MODAL_STATE',
            showImportModal: true,
        });
    });

    it('resetGeoJSONFile should return type FILE_RESET', () => {
        expect(actions.resetGeoJSONFile()).toEqual({
            type: 'FILE_RESET'
        });
    });

    it('convertJSTSGeometry should covert a JSTS from one SRS to another', () => {

        const writer = new jsts.io.GeoJSONWriter();
        const geojsonReader = new jsts.io.GeoJSONReader();
        const ol3GeoJSON = new ol.format.GeoJSON();
        var reader = new jsts.io.WKTReader();
        var jstsGeom = reader.read('POINT (-20 0)');
        expect(jstsGeom.getCoordinate()).toEqual({x: -20, y: 0, z: undefined});
        var newGeom = actions.transformJSTSGeometry(jstsGeom, 'EPSG:4326', 'EPSG:3857')
        expect(newGeom.getCoordinate()).toEqual({
            "x": -2226389.8158654715,
            "y": -7.081154551613622e-10,
            "z": undefined
        });
        var newerGeom = actions.transformJSTSGeometry(newGeom, 'EPSG:3857', 'EPSG:4326')
        expect(newerGeom.getCoordinate()).toEqual({x: -20, y: 0, z: undefined});
        expect(newerGeom).toEqual(jstsGeom);
    });

    it('bufferGeometry should covert a point to a polygon', () => {
        const reader = new jsts.io.WKTReader();
        var jstsGeom = reader.read('POINT (-20 0)');
        expect(jstsGeom.getGeometryType()).toEqual("Point");
        var returnedGeom = actions.bufferGeometry(jstsGeom)
        expect(returnedGeom.getGeometryType()).toEqual("Polygon");
    });

    it('bufferGeometry should not change a polygon', () => {
        const reader = new jsts.io.WKTReader();
        var jstsGeom = reader.read('POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))');
        expect(jstsGeom.getGeometryType()).toEqual("Polygon");
        var returnedGeom = actions.bufferGeometry(jstsGeom)
        expect(returnedGeom.getGeometryType()).toEqual("Polygon");
        expect(jstsGeom).toEqual(returnedGeom);
    });

    it('processGeoJSONFile should create error if extension is not geojson ', () => {
        // Initialize mockstore with empty state
        const initialState = {}
        const store = mockStore(initialState)
        const file = new File(["<!doctype html><div>file</div>"],
            "test.shp",
            {"type": "text/html"}
        )
        // Test if your store dispatched the expected actions
        const expectedPayload = [{type: types.FILE_PROCESSING},
            {type: types.FILE_ERROR, error: 'File must be .geojson NOT .shp'}]
        store.dispatch(actions.processGeoJSONFile(file))
            .catch(() => {
                expect(store.getActions()).toEqual(expectedPayload)
            })
    });

    it('processGeoJSONFile should raise error if not a json', () => {
        // Initialize mockstore with empty state
        const initialState = {}
        const store = mockStore(initialState)
        const file = new File(["Data"],
            "test.geojson",
            {"type": "application/json"}
        )

        // Test if your store dispatched the expected actions
        const expectedPayload = [{type: types.FILE_PROCESSING},
            {type: types.FILE_ERROR, error: 'Could not parse GeoJSON'}]
        store.dispatch(actions.processGeoJSONFile(file))
            .catch(() => {
                expect(store.getActions()).toEqual(expectedPayload)
            })
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON Point to JSTS Geometry', () => {
        const point = {"type": "Point", "coordinates": [100.0, 0.0]};
        const returnedGeom = actions.convertGeoJSONtoJSTS(point)
        expect(returnedGeom.getGeometryType()).toEqual("Polygon");
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON LineString to JSTS Geometry', () => {
        const lineString = {
            "type": "LineString",
            "coordinates": [[100.0, 0.0], [101.0, 1.0]]
        }
        const returnedGeom = actions.convertGeoJSONtoJSTS(lineString)
        expect(returnedGeom.getGeometryType()).toEqual("Polygon");
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON Polygon(no holes) to JSTS Geometry', () => {
        const polygon = {
            "type": "Polygon",
            "coordinates": [
                [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]]
            ]
        }
        const returnedGeom = actions.convertGeoJSONtoJSTS(polygon)
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
        const returnedGeom = actions.convertGeoJSONtoJSTS(polygon)
        expect(returnedGeom.getGeometryType()).toEqual("Polygon");
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON MultiPoint to JSTS Geometry', () => {
        const multiPoint = {
            "type": "MultiPoint",
            "coordinates": [[100.0, 0.0], [101.0, 1.0]]
        }
        const returnedGeom = actions.convertGeoJSONtoJSTS(multiPoint)
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
        const returnedGeom = actions.convertGeoJSONtoJSTS(multiLineString)
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
        const returnedGeom = actions.convertGeoJSONtoJSTS(multiPolygon)
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
        const returnedGeom = actions.convertGeoJSONtoJSTS(geometryCollection)
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
        const returnedGeom = actions.convertGeoJSONtoJSTS(featureCollection)
        expect(returnedGeom.getGeometryType()).toEqual("MultiPolygon");
    });

    it('processGeoJSONFile should add AOI to state if valid geojson', () => {
        // Initialize mockstore with empty state
        const initialState = {}
        const store = mockStore(initialState)
        const point = {"type": "Point", "coordinates": [100.0, 0.0]};
        const returnedGeom = actions.convertGeoJSONtoJSTS(point)
        const file = new File([point],
            "test.geojson",
            {"type": "application/json"}
        )

        // Test if your store dispatched the expected actions
        const expectedPayload = [{type: types.FILE_PROCESSING},
            {type: types.FILE_PROCESSED, geom: returnedGeom}]
        store.dispatch(actions.processGeoJSONFile(file))
            .catch(() => {
                expect(store.getActions()).toEqual(expectedPayload)
            })
    });

    it('processGeoJSONFile should not add AOI to state if invalid geojson', () => {
        // Initialize mockstore with empty state
        const initialState = {}
        const store = mockStore(initialState)
        const point = {"type": "point", "coordinates": [100.0, 0.0]};
        const file = new File([point],
            "test.geojson",
            {"type": "application/json"}
        )

        // Test if your store dispatched the expected actions
        const expectedPayload = [{type: types.FILE_PROCESSING},
            {type: types.FILE_ERROR, error: 'There was an error processing the geojson file.'}]
        store.dispatch(actions.processGeoJSONFile(file))
            .catch(() => {
                expect(store.getActions()).toEqual(expectedPayload)
            })
    });
});
