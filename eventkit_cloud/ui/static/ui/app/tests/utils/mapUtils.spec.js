import sinon from 'sinon';
import raf from 'raf';
import proj from 'ol/proj';
import View from 'ol/view';
import extent from 'ol/extent';
import Feature from 'ol/feature';
import Point from 'ol/geom/point';
import Polygon from 'ol/geom/polygon';
import Draw from 'ol/interaction/draw';
import VectorSource from 'ol/source/vector';
import VectorLayer from 'ol/layer/vector';
import WKTReader from 'jsts/org/locationtech/jts/io/WKTReader';
import * as utils from '../../utils/mapUtils';

// this polyfills requestAnimationFrame in the test browser, required for ol3
raf.polyfill();

describe('mapUtils', () => {
    it('jstsGeomToOlGeom should convert JSTS to Ol', () => {
        const Reader = new WKTReader();
        const jstsGeom = Reader.read('POINT (-20 0)');
        expect(jstsGeom.getCoordinate()).toEqual({ x: -20, y: 0, z: undefined });
        const olGeom = utils.jstsGeomToOlGeom(jstsGeom);
        expect(olGeom instanceof Point).toBe(true);
        const expected = [-20, 0];
        expect(olGeom.getCoordinates()).toEqual(expected);
    });

    it('convertJSTSGeometry should covert a JSTS from one SRS to another', () => {
        const Reader = new WKTReader();
        const jstsGeom = Reader.read('POINT (-20 0)');
        expect(jstsGeom.getCoordinate()).toEqual({ x: -20, y: 0, z: undefined });
        const newGeom = utils.transformJSTSGeometry(jstsGeom, 'EPSG:4326', 'EPSG:3857');
        expect(newGeom.getCoordinate()).toEqual({
            x: -2226389.8158654715,
            y: -7.081154551613622e-10,
            z: undefined,
        });
        const newerGeom = utils.transformJSTSGeometry(newGeom, 'EPSG:3857', 'EPSG:4326');
        expect(newerGeom.getCoordinate()).toEqual({ x: -20, y: 0, z: undefined });
        expect(newerGeom).toEqual(jstsGeom);
    });

    it('bufferGeometry should covert a point to a polygon', () => {
        const reader = new WKTReader();
        const jstsGeom = reader.read('POINT (-20 0)');
        expect(jstsGeom.getGeometryType()).toEqual('Point');
        const returnedGeom = utils.bufferGeometry(jstsGeom);
        expect(returnedGeom.getGeometryType()).toEqual('Polygon');
    });

    it('bufferGeometry should not change a polygon', () => {
        const reader = new WKTReader();
        const jstsGeom = reader.read('POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))');
        expect(jstsGeom.getGeometryType()).toEqual('Polygon');
        const returnedGeom = utils.bufferGeometry(jstsGeom);
        expect(returnedGeom.getGeometryType()).toEqual('Polygon');
        expect(jstsGeom).toEqual(returnedGeom);
    });

    it('bufferGeometry should change a polygon', () => {
        const reader = new WKTReader();
        const jstsGeom = reader.read('POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))');
        expect(jstsGeom.getGeometryType()).toEqual('Polygon');
        const returnedGeom = utils.bufferGeometry(jstsGeom, 10, true);
        expect(returnedGeom.getGeometryType()).toEqual('Polygon');
        expect(jstsGeom).not.toEqual(returnedGeom);
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON Point to JSTS Geometry', () => {
        const point = { coordinates: [100.0, 0.0], type: 'Point' };
        const returnedGeom = utils.convertGeoJSONtoJSTS(point);
        expect(returnedGeom.getGeometryType()).toEqual('Polygon');
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON LineString to JSTS Geometry', () => {
        const lineString = {
            coordinates: [[100.0, 0.0], [101.0, 1.0]],
            type: 'LineString',
        };
        const returnedGeom = utils.convertGeoJSONtoJSTS(lineString);
        expect(returnedGeom.getGeometryType()).toEqual('Polygon');
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON Polygon(no holes) to JSTS Geometry', () => {
        const polygon = {
            coordinates: [
                [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
            ],
            type: 'Polygon',
        };
        const returnedGeom = utils.convertGeoJSONtoJSTS(polygon);
        expect(returnedGeom.getGeometryType()).toEqual('Polygon');
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON Polygon(holes) to JSTS Geometry', () => {
        const polygon = {
            coordinates: [
                [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
                [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]],
            ],
            type: 'Polygon',
        };
        const returnedGeom = utils.convertGeoJSONtoJSTS(polygon);
        expect(returnedGeom.getGeometryType()).toEqual('Polygon');
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON MultiPoint to JSTS Geometry', () => {
        const multiPoint = {
            coordinates: [[100.0, 0.0], [101.0, 1.0]],
            type: 'MultiPoint',
        };
        const returnedGeom = utils.convertGeoJSONtoJSTS(multiPoint);
        expect(returnedGeom.getGeometryType()).toEqual('MultiPolygon');
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON MultiLineString to JSTS Geometry', () => {
        const multiLineString = {
            coordinates: [
                [[100.0, 0.0], [101.0, 1.0]],
                [[102.0, 2.0], [103.0, 3.0]],
            ],
            type: 'MultiLineString',
        };
        const returnedGeom = utils.convertGeoJSONtoJSTS(multiLineString);
        expect(returnedGeom.getGeometryType()).toEqual('MultiPolygon');
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON MultiPolygon to JSTS Geometry', () => {
        const multiPolygon = {
            coordinates: [
                [[[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]]],
                [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
                    [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]],
            ],
            type: 'MultiPolygon',
        };
        const returnedGeom = utils.convertGeoJSONtoJSTS(multiPolygon);
        expect(returnedGeom.getGeometryType()).toEqual('MultiPolygon');
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON GeometryCollection to JSTS Geometry', () => {
        const geometryCollection = {
            geometries: [
                {
                    coordinates: [100.0, 0.0],
                    type: 'Point',
                },
                {
                    coordinates: [[101.0, 0.0], [102.0, 1.0]],
                    type: 'LineString',
                },
            ],
            type: 'GeometryCollection',
        };
        const returnedGeom = utils.convertGeoJSONtoJSTS(geometryCollection);
        expect(returnedGeom.getGeometryType()).toEqual('MultiPolygon');
    });

    it('convertGeoJSONtoJSTS should convert GeoJSON FeatureCollection to JSTS Geometry', () => {
        const featureCollection = {
            features: [{
                geometry: {
                    coordinates: [102.0, 0.5],
                    type: 'Point',
                },
                properties: {
                    prop0: 'value0',
                },
                type: 'Feature',
            }, {
                geometry: {
                    coordinates: [
                        [102.0, 0.0],
                        [103.0, 1.0],
                        [104.0, 0.0],
                        [105.0, 1.0],
                    ],
                    type: 'LineString',
                },
                properties: {
                    prop0: 'value0',
                    prop1: 0.0,
                },
                type: 'Feature',
            }, {
                geometry: {
                    coordinates: [
                        [
                            [100.0, 0.0],
                            [101.0, 0.0],
                            [101.0, 1.0],
                            [100.0, 1.0],
                            [100.0, 0.0],
                        ],
                    ],
                    type: 'Polygon',
                },
                properties: {
                    prop0: 'value0',
                    prop1: {
                        this: 'that',
                    },
                },
                type: 'Feature',
            }],
            type: 'FeatureCollection',
        };
        const returnedGeom = utils.convertGeoJSONtoJSTS(featureCollection);
        expect(returnedGeom.getGeometryType()).toEqual('MultiPolygon');
    });

    it('bufferGeojson should read in feature collection and buffer each feature, then return a new feature collection', () => {
        const featureCollection = {
            features: [
                {
                    geometry: { type: 'Point', coordinates: [1, 1] },
                    properties: { name: 'feature1' },
                    type: 'Feature',
                },
                {
                    geometry: { type: 'Point', coordinates: [2, 2] },
                    properties: { name: 'feature2' },
                    type: 'Feature',
                },
                {
                    geometry: { type: 'Point', coordinates: [3, 3] },
                    properties: { name: 'feature3' },
                    type: 'Feature',
                },
            ],
            type: 'FeatureCollection',
        };
        const ret = utils.bufferGeojson(featureCollection, 10, false);
        expect(ret.features[0].geometry.type).toEqual('Polygon');
        expect(ret.features[0].properties.name).toEqual('feature1');
        expect(ret.features[1].geometry.type).toEqual('Polygon');
        expect(ret.features[1].properties.name).toEqual('feature2');
        expect(ret.features[2].geometry.type).toEqual('Polygon');
        expect(ret.features[2].properties.name).toEqual('feature3');
    });

    it('bufferGeojson should not return features with no area', () => {
        const featureCollection = {
            features: [
                {
                    geometry: { type: 'Point', coordinates: [1, 1] },
                    properties: { name: 'feature1' },
                    type: 'Feature',
                },
                {
                    geometry: { type: 'Point', coordinates: [2, 2] },
                    properties: { name: 'feature2' },
                    type: 'Feature',
                },
                {
                    geometry: { type: 'Point', coordinates: [3, 3] },
                    properties: { name: 'feature3' },
                    type: 'Feature',
                },
            ],
            type: 'FeatureCollection',
        };
        const expectedCollection = {
            features: [],
            type: 'FeatureCollection',
        };
        expect(utils.bufferGeojson(featureCollection, -10, true)).toEqual(expectedCollection);
    });

    it('generateDrawBoxInteraction should setup a new interaction', () => {
        const setActiveStub = sinon.stub(Draw.prototype, 'setActive');
        const layer = new VectorLayer({
            source: new VectorSource(),
        });
        const drawInteraction = utils.generateDrawBoxInteraction(layer);
        expect(drawInteraction instanceof Draw).toBe(true);
        expect(setActiveStub.called).toBe(true);
        expect(setActiveStub.calledWith(false)).toBe(true);
        setActiveStub.restore();
    });

    it('generateDrawFreeInteraction should setup a new interaction', () => {
        const setActiveStub = sinon.stub(Draw.prototype, 'setActive');
        const layer = new VectorLayer({
            source: new VectorSource(),
        });
        const drawInteraction = utils.generateDrawFreeInteraction(layer);
        expect(drawInteraction instanceof Draw).toBe(true);
        expect(setActiveStub.calledWith(false)).toBe(true);
        setActiveStub.restore();
    });

    it('featureToBbox should take a geojson feature and return the bbox', () => {
        const feature = {
            geometry: {
                coordinates: [
                    [
                        [21.708984375, 52.45600939264076],
                        [20.214843749999996, 52.214338608258196],
                        [21.181640624999996, 51.33061163769853],
                        [23.027343749999996, 52.669720383688166],
                        [21.423339843749996, 53.212612189941574],
                        [21.1376953125, 52.736291655910925],
                        [21.708984375, 52.45600939264076],
                    ],
                ],
                type: 'Polygon',
            },
            properties: {},
            type: 'Feature',
        };
        const bbox = [
            20.214843749999996,
            51.33061163769853,
            23.027343749999996,
            53.212612189941574,
        ];

        expect(utils.featureToBbox(feature)).toEqual(bbox);
    });

    it('serialize should transform to wgs84 and return a rounded bbox extent', () => {
        // this bbox extends past -180 and 180 and should be corrected
        const bbox = [
            -203.90625,
            -70.61261423801925,
            220.78125,
            83.27770503961696,
        ];
        // returned bbox should have overflow corrected and decimals rounded
        const expected = [
            -180,
            -70.61261,
            180,
            83.27771,
        ];

        const deserialized = utils.deserialize(bbox);

        const serialized = utils.serialize(deserialized);
        expect(serialized).toEqual(expected);
    });

    it('isGeoJSONValid should read the geom from a feature collection and return if it is valid', () => {
        const invalid = {
            features: [
                {
                    geometry: {
                        coordinates: [
                            [
                                [36.2109375, 47.040182144806664],
                                [20.390625, 37.16031654673677],
                                [52.734375, 31.952162238024975],
                                [16.875, 44.59046718130883],
                                [7.734374999999999, 38.272688535980976],
                                [34.453125, 51.17934297928927],
                                [31.289062500000004, 28.92163128242129],
                                [36.2109375, 47.040182144806664],
                            ],
                        ],
                        type: 'Polygon',
                    },
                    properties: {},
                    type: 'Feature',
                },
            ],
            type: 'FeatureCollection',
        };
        expect(utils.isGeoJSONValid(invalid)).toBe(false);

        const valid = {
            features: [
                {
                    geometry: {
                        coordinates: [
                            [
                                [11.953125, 26.115985925333536],
                                [10.546875, 16.636191878397664],
                                [29.53125, 13.581920900545844],
                                [30.234375, 25.799891182088334],
                                [18.6328125, 30.14512718337613],
                                [11.953125, 26.115985925333536],
                            ],
                        ],
                        type: 'Polygon',
                    },
                    properties: {},
                    type: 'Feature',
                },
            ],
            type: 'FeatureCollection',
        };
        expect(utils.isGeoJSONValid(valid)).toBe(true);
    });

    it('createGeoJSON should take an ol3 geom and return a feature collection containing a feature with that geom', () => {
        const extentSpy = sinon.spy(Point.prototype, 'getExtent');
        const coords = [-1, 1];
        const geom = new Point(coords);
        const expected = {
            features: [
                {
                    bbox: [-1, 1, -1, 1],
                    geometry: {
                        coordinates: [-1, 1],
                        type: 'Point',
                    },
                    type: 'Feature',
                },
            ],
            type: 'FeatureCollection',
        };
        const geojson = utils.createGeoJSON(geom);
        expect(extentSpy.calledOnce).toBe(true);
        expect(geojson).toEqual(expected);
    });

    it('createGeoJSONGeometry should take a ol3 geom and return the geom in geojson format', () => {
        const expected = {
            coordinates: [-1, 1],
            type: 'Point',
        };
        const coords = [-1, 1];
        const geom = new Point(coords);
        const cloneSpy = sinon.spy(Point.prototype, 'clone');
        const coordsSpy = sinon.spy(Point.prototype, 'getCoordinates');
        expect(utils.createGeoJSONGeometry(geom)).toEqual(expected);
        expect(cloneSpy.calledOnce).toBe(true);
        expect(coordsSpy.calledOnce).toBe(true);
        cloneSpy.restore();
        coordsSpy.restore();
    });

    it('clearDraw should get the layer source then clear it', () => {
        const clear = sinon.spy();
        const layer = {
            getSource: sinon.spy(() => ({ clear })),
        };
        utils.clearDraw(layer);
        expect(layer.getSource.calledOnce).toBe(true);
        expect(clear.calledOnce).toBe(true);
    });

    it('zoomToFeature should fit view to geom if its not a point type', () => {
        const feature = new Feature({
            geometry: new Polygon([[
                [-98, -31],
                [68, -31],
                [68, 57],
                [-98, 57],
                [-98, -31],
            ]]),
        });
        const featureSpy = sinon.spy(Feature.prototype, 'getGeometry');
        const geomSpy = sinon.spy(Polygon.prototype, 'getType');
        const fit = sinon.spy();
        const map = { getView: sinon.spy(() => ({ fit })) };
        utils.zoomToFeature(feature, map);
        expect(featureSpy.calledOnce).toBe(true);
        expect(geomSpy.calledOnce).toBe(true);
        expect(map.getView.calledOnce).toBe(true);
        expect(fit.calledOnce).toBe(true);
        featureSpy.restore();
        geomSpy.restore();
    });

    it('zoomToFeature should fit bbox if point feature has one', () => {
        const feature = new Feature({ geometry: new Point([1, 1]) });
        feature.setProperties({ bbox: [1, 1, 1, 1] });
        const fitSpy = sinon.spy();
        const map = { getView: sinon.spy(() => ({ fit: fitSpy })) };
        utils.zoomToFeature(feature, map);
        expect(fitSpy.calledOnce).toBe(true);
        expect(fitSpy.calledWith([1, 1, 1, 1])).toBe(true);
    });

    it('zoomToFeature should center on geom if it is a point type', () => {
        const feature = new Feature({ geometry: new Point([1, 1]) });
        const getTypeSpy = sinon.spy(Point.prototype, 'getType');
        const getCoordsSpy = sinon.spy(Point.prototype, 'getCoordinates');
        const center = sinon.spy();
        const map = { getView: sinon.spy(() => ({ setCenter: center })) };
        utils.zoomToFeature(feature, map);
        expect(getTypeSpy.calledOnce).toBe(true);
        expect(map.getView.calledOnce).toBe(true);
        expect(center.calledOnce).toBe(true);
        expect(getCoordsSpy.calledOnce).toBe(true);
        getTypeSpy.restore();
        getCoordsSpy.restore();
    });

    it('featureToPoint should return a point representing the center of a feature\'s extent', () => {
        expect(utils.featureToPoint()).toBe(null);
        const coords = [[[-15, -14], [14, -14], [14, 12], [-15, 12], [-15, -14]]];
        const bbox = [-15, -14, 14, 12];
        const feature = new Feature({
            geometry: new Polygon(coords),
        });
        const expectedCoords = extent.getCenter(bbox);
        const centerSpy = sinon.spy(extent, 'getCenter');
        const geomSpy = sinon.spy(Feature.prototype, 'getGeometry');
        const extentSpy = sinon.spy(Polygon.prototype, 'getExtent');
        const point = utils.featureToPoint(feature);
        expect(centerSpy.calledOnce).toBe(true);
        expect(centerSpy.calledWith(bbox)).toBe(true);
        expect(geomSpy.calledOnce).toBe(true);
        expect(extentSpy.calledOnce).toBe(true);
        expect(point.getCoordinates()).toEqual(expectedCoords);
        centerSpy.restore();
        geomSpy.restore();
        extentSpy.restore();
    });

    it('unwrapCoordinates should adjust x coords to be in valid extent', () => {
        const coordProj = proj.get('EPSG:4326');
        const coords = [[[-380, 20], [-160, 20], [-160, -20], [-380, -20]]];
        const expected = [[[-20, 20], [-160, 20], [-160, -20], [-20, -20]]];
        expect(utils.unwrapCoordinates(coords, coordProj)).toEqual(expected);
    });

    it('unwrapExtent should adjust min and max x coords to be in valid extent', () => {
        const coordProj = proj.get('EPSG:4326');
        const coordExtent = [700, -90, 740, 90];
        const expected = [-20, -90, 20, 90];
        expect(utils.unwrapExtent(coordExtent, coordProj)).toEqual(expected);
    });

    it('unwrapExtent should adjust min and max x coords to be in valid extent', () => {
        const coordProj = proj.get('EPSG:4326');
        const coordExtent = [-540, -90, -185, 90];
        const expected = [-180, -90, 175, 90];
        expect(utils.unwrapExtent(coordExtent, coordProj)).toEqual(expected);
    });

    it('unwrapExtent should return the extent unmodified', () => {
        const coordProj = proj.get('EPSG:4326');
        const coordExtent = [-120, -90, 180, 90];
        const expected = [-120, -90, 180, 90];
        expect(utils.unwrapExtent(coordExtent, coordProj)).toEqual(expected);
    });

    it('isViewOutsideValidExtent should return true or false', () => {
        const view = new View({ center: [-190, 40], projection: 'EPSG:4326' });
        expect(utils.isViewOutsideValidExtent(view)).toBe(true);
        const view2 = new View({ center: [-20, 20], projection: 'EPSG:4326' });
        expect(utils.isViewOutsideValidExtent(view2)).toBe(false);
    });

    it('goToValidExtent should set the center of view to be inside the valid map extent', () => {
        const view = new View({ center: [-190, 20], projection: 'EPSG:4326' });
        expect(utils.goToValidExtent(view)).toEqual([170, 20]);
        expect(view.getCenter()).toEqual([170, 20]);
    });

    it('isBox should return false if the feature has more than 5 coordinate pairs', () => {
        const feature = new Feature({
            geometry: new Polygon([
                [
                    [99.30541992187499, 2.6467632307409725],
                    [99.195556640625, 2.2296616399183624],
                    [100.074462890625, 2.04302395742204],
                    [100.03051757812499, 2.591888984149953],
                    [99.65698242187499, 2.943040910055132],
                    [99.107666015625, 3.0417830279332634],
                    [98.44848632812499, 2.8223442468940902],
                    [98.997802734375, 2.756504385543263],
                    [99.30541992187499, 2.6467632307409725],
                ],
            ]),
        });
        expect(utils.isBox(feature)).toBe(false);
    });

    it('isBox should return false if the extent coords of a 4 vertex feature are not the same as the feature coords', () => {
        const feature = new Feature({
            geometry: new Polygon([
                [
                    [101.75537109375, -0.37353251022880474],
                    [101.3818359375, -0.8239462091017558],
                    [102.041015625, -1.197422590365017],
                    [102.293701171875, -0.7140928403610857],
                    [101.75537109375, -0.37353251022880474],
                ],
            ]),
        });
        expect(utils.isBox(feature)).toBe(false);
    });

    it('isBox should return true if the extent coords are same as feature coords', () => {
        const feature = new Feature({
            geometry: new Polygon([
                [
                    [101.57958984375, 0.9667509997666425],
                    [101.79931640625, 0.9667509997666425],
                    [101.79931640625, 1.2962761196418218],
                    [101.57958984375, 1.2962761196418218],
                    [101.57958984375, 0.9667509997666425],
                ],
            ]),
        });
        expect(utils.isBox(feature)).toBe(true);
    });

    it('isVertx should check to see if a feature coordinate lies on the pixel and return the vertex if its with the tolerance', () => {
        const pixel = [10, 10];
        const tolerance = 2;
        const feature = new Feature({ geometry: new Point([1, 1]) });
        const getPixelStub = sinon.stub().returns([8, 8]);
        const map = { getPixelFromCoordinate: getPixelStub };
        expect(utils.isVertex(pixel, feature, tolerance, map)).toEqual([1, 1]);
    });

    it('isVertex should return false if feature coords are not within the tolerance', () => {
        const pixel = [10, 10];
        const tolerance = 2;
        const feature = new Feature({ geometry: new Point([1, 1]) });
        const getPixelStub = sinon.stub().returns([7, 7]);
        const map = { getPixelFromCoordinate: getPixelStub };
        expect(utils.isVertex(pixel, feature, tolerance, map)).toBe(false);
    });

    it('allHaveArea should return false if there are no features', () => {
        const collection = {
            features: [],
            type: 'FeatureCollection',
        };
        expect(utils.allHaveArea(collection)).toBe(false);
    });

    it('allHaveArea should return false if polygon has no area', () => {
        const collection = {
            features: [
                {
                    geometry: {
                        coordinates: [[
                            [0, 0],
                            [0, 0],
                            [0, 0],
                            [0, 0],
                            [0, 0],
                        ]],
                        type: 'Polygon',
                    },
                    type: 'Feature',
                },
            ],
            type: 'FeatureCollection',
        };
        expect(utils.allHaveArea(collection)).toBe(false);
    });

    it('allHaveArea should return false for points (no getArea func in ol)', () => {
        const collection = {
            features: [
                {
                    geometry: {
                        coordinates: [
                            20.3,
                            24.9,
                        ],
                        type: 'Point',
                    },
                    type: 'Feature',
                },
            ],
            type: 'FeatureCollection',
        };
        expect(utils.allHaveArea(collection)).toBe(false);
    });

    it('allHaveArea should retunr true', () => {
        const collection = {
            features: [
                {
                    geometry: {
                        coordinates: [[
                            [1, 1],
                            [2, 1],
                            [2, 2],
                            [1, 2],
                            [1, 1],
                        ]],
                        type: 'Polygon',
                    },
                    type: 'Feature',
                },
            ],
            type: 'FeatureCollection',
        };
        expect(utils.allHaveArea(collection)).toBe(true);
    });

    it('getDominantGeometry should return Point', () => {
        const collection = {
            features: [
                {
                    geometry: {
                        type: 'Point',
                    },
                    type: 'Feature',
                },
                {
                    geometry: {
                        type: 'Point',
                    },
                    type: 'Feature',
                },
            ],
            type: 'FeatureCollection',
        };
        expect(utils.getDominantGeometry(collection)).toEqual('Point');
    });

    it('getDominantGeometry should return Line', () => {
        const collection = {
            features: [
                {
                    geometry: {
                        type: 'PolyLine',
                    },
                    type: 'Feature',
                },
                {
                    geometry: {
                        type: 'PolyLine',
                    },
                    type: 'Feature',
                },
            ],
            type: 'FeatureCollection',
        };
        expect(utils.getDominantGeometry(collection)).toEqual('Line');
    });

    it('getDominantGeometry should return Polygon', () => {
        const collection = {
            features: [
                {
                    geometry: {
                        type: 'Polygon',
                    },
                    type: 'Feature',
                },
                {
                    geometry: {
                        type: 'MultiPolygon',
                    },
                    type: 'Feature',
                },
            ],
            type: 'FeatureCollection',
        };
        expect(utils.getDominantGeometry(collection)).toEqual('Polygon');
    });

    it('getDominantGeometry should return Collection', () => {
        const collection = {
            features: [
                {
                    geometry: {
                        type: 'Point',
                    },
                    type: 'Feature',
                },
                {
                    geometry: {
                        type: 'MultiPolygon',
                    },
                    type: 'Feature',
                },
            ],
            type: 'FeatureCollection',
        };
        expect(utils.getDominantGeometry(collection)).toEqual('Collection');
    });

    it('getDominantGeometry should return null', () => {
        const collection1 = {
            features: [
                {
                    geometry: {
                        type: 'blah',
                    },
                    type: 'Feature',
                },
                {
                    geometry: {
                        type: 'blah',
                    },
                    type: 'Feature',
                },
            ],
            type: 'FeatureCollection',
        };
        expect(utils.getDominantGeometry(collection1)).toEqual(null);
        const collection2 = {
            features: [],
            type: 'FeatureCollection',
        };
        expect(utils.getDominantGeometry(collection2)).toEqual(null);
    });
});
