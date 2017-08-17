import ol from 'openlayers';
import sinon from 'sinon';
import GeoJSONReader from 'jsts/org/locationtech/jts/io/GeoJSONReader';
import GeoJSONWriter from 'jsts/org/locationtech/jts/io/GeoJSONWriter';
import WKTReader from 'jsts/org/locationtech/jts/io/WKTReader';
import * as utils from '../utils/mapUtils'

// this polyfills requestAnimationFrame in the test browser, required for ol3
import raf from 'raf';
raf.polyfill();

describe('mapUtils', () => {

    it('convertJSTSGeometry should covert a JSTS from one SRS to another', () => {
        const writer = new GeoJSONWriter();
        const geojsonReader = new GeoJSONReader();
        const ol3GeoJSON = new ol.format.GeoJSON();
        var reader = new WKTReader();
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
        const reader = new WKTReader();
        var jstsGeom = reader.read('POINT (-20 0)');
        expect(jstsGeom.getGeometryType()).toEqual("Point");
        var returnedGeom = utils.bufferGeometry(jstsGeom)
        expect(returnedGeom.getGeometryType()).toEqual("Polygon");
    });

    it('bufferGeometry should not change a polygon', () => {
        const reader = new WKTReader();
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

    it('zoomToExtent should create dom elements and add listeners and stuff', () => {
        const fitSpy = new sinon.spy();
        const extentSpy = new sinon.spy();
        const projSpy = new sinon.spy(() => {return {getExtent: extentSpy}})
        const viewSpy = new sinon.spy(() => {return {fit: fitSpy, getProjection: projSpy}});
        const sizeSpy = new sinon.spy(() => {return [500,500]});
        const mapSpy = new sinon.spy(() => {return {getView: viewSpy, getSize: sizeSpy}});
        
        const fakeThis = {getMap: mapSpy}
        utils.zoomToExtent.bind({}, fakeThis);

        const button = document.createElement('button');
        const addSpy = new sinon.spy(button, 'addEventListener');
        const icon = document.createElement('i');
        const div = document.createElement('div');
        const stub = sinon.stub(document, 'createElement')
        stub.withArgs('button').returns(button);
        stub.withArgs('i').returns(icon);
        stub.withArgs('div').returns(div);

        ol.control.Control.call = new sinon.spy();

        utils.zoomToExtent.apply(fakeThis, [{className: 'fake', target: 'target', extent: [-1,1,-1,1]}]);
        expect(addSpy.calledTwice).toBe(true);
        expect(stub.calledThrice).toBe(true);
        expect(div.className).toEqual('fake ol-unselectable ol-control');
        expect(ol.control.Control.call.calledOnce).toBe(true);
        expect(ol.control.Control.call.calledWith(fakeThis, {element: div, target: 'target'})).toBe(true);

        stub.restore();

        button.dispatchEvent(new Event('click'));
        expect(mapSpy.calledOnce).toBe(true);
        expect(viewSpy.calledOnce).toBe(true);
        expect(sizeSpy.calledOnce).toBe(true);
        expect(projSpy.notCalled).toBe(true);
        expect(extentSpy.notCalled).toBe(true);
        expect(fitSpy.calledOnce).toBe(true);
        expect(fitSpy.calledWith([-1,1,-1,1], [500,500]))
    });

    it('generateDrawBoxInteraction should setup a new interaction', () => {
        const stroke = ol.style.Stroke;
        ol.style.Stroke = new sinon.spy();

        const shape = ol.style.RegularShape;
        ol.style.RegularShape = new sinon.spy();

        const style = ol.style.Style;
        ol.style.Style = new sinon.spy();

        const activeSpy = new sinon.spy();
        const createBoxSpy = new sinon.spy();

        const drawReturn = {setActive: activeSpy};

        const draw = ol.interaction.Draw;
        
        ol.interaction.Draw = (options) => {
            return {setActive: activeSpy};
        }

        ol.interaction.Draw.createBox = () => {return {}};

        const interactionSpy = new sinon.spy(ol.interaction, 'Draw');

        const layer = new ol.layer.Vector({
            source: new ol.source.Vector()
        });
        const drawInteraction = utils.generateDrawBoxInteraction(layer);
        expect(interactionSpy.calledOnce).toBe(true);
        expect(drawInteraction).toEqual(drawReturn);
        expect(activeSpy.calledOnce).toBe(true);

        ol.style.Stroke = stroke;
        ol.style.RegularShape = shape;
        ol.style.Style = style;
        ol.interaction.Draw = draw;
    });

    it('generateDrawFreeInteraction should setup a new interaction', () => {
        const stroke = ol.style.Stroke;
        ol.style.Stroke = new sinon.spy();

        const shape = ol.style.RegularShape;
        ol.style.RegularShape = new sinon.spy();

        const style = ol.style.Style;
        ol.style.Style = new sinon.spy();

        const activeSpy = new sinon.spy();
        const drawReturn = {setActive: activeSpy}

        const draw = ol.interaction.Draw;
        ol.interaction.Draw = new sinon.spy(() => {return drawReturn});

        const layer = new ol.layer.Vector({
            source: new ol.source.Vector()
        });
        const drawInteraction = utils.generateDrawFreeInteraction(layer);
        expect(ol.interaction.Draw.calledOnce).toBe(true);
        expect(drawInteraction).toEqual(drawReturn);
        expect(activeSpy.calledOnce).toBe(true);

        ol.style.Stroke = stroke;
        ol.style.RegularShape = shape;
        ol.style.Style = style;
        ol.interaction.Draw = draw;
    });

    it('featureToBbox should take a geojson feature and return the bbox', () => {
        const feature = {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                [
                    [21.708984375,52.45600939264076],
                    [20.214843749999996,52.214338608258196],
                    [21.181640624999996,51.33061163769853],
                    [23.027343749999996,52.669720383688166],
                    [21.423339843749996,53.212612189941574],
                    [21.1376953125,52.736291655910925],
                    [21.708984375,52.45600939264076]]
                ]
            },
        }
        const bbox = ol.proj.transformExtent([
            20.214843749999996,
            51.33061163769853,
            23.027343749999996,
            53.212612189941574
        ], utils.WGS84, utils.WEB_MERCATOR);

        expect(utils.featureToBbox(feature)).toEqual(bbox);
    });

    it('deserialize should transform the bbox to ESPG:3857 or return null if its not a bbox', () => {
        expect(utils.deserialize()).toBe(null);
        expect(utils.deserialize([-3,-3,3])).toBe(null);
        const bbox = [-90, -45, 90, 45];
        const expected = ol.proj.transformExtent(bbox, utils.WGS84, utils.WEB_MERCATOR);
        expect(utils.deserialize(bbox)).toEqual(expected);
    })

    it('serialize should transform to wgs84 and return a rounded bbox extent', () => {
        //this bbox extends past -180 and 180 and should be corrected
        const bbox = [
            -203.90625,
            -70.61261423801925,
            220.78125,
            83.27770503961696
        ];
        // returned bbox should have overflow corrected and decimals rounded
        const expected = [
            -180,
            -70.61261,
            180,
            83.27771
        ];
        // transform it to EPSG:3857
        const webMercator = utils.deserialize(bbox);

        const serialized = utils.serialize(webMercator);
        expect(serialized).toEqual(expected);
    });

    it('isGeoJSONValid should read the geom from a feature collection and return if it is valid', () => {
        const invalid = {
            "type": "FeatureCollection",
            "features": [
              {
                "type": "Feature",
                "properties": {},
                "geometry": {
                  "type": "Polygon",
                  "coordinates": [
                    [[36.2109375,47.040182144806664],
                      [20.390625,37.16031654673677],
                      [52.734375,31.952162238024975],
                      [16.875,44.59046718130883],
                      [7.734374999999999,38.272688535980976],
                      [34.453125,51.17934297928927],
                      [31.289062500000004,28.92163128242129],
                      [36.2109375,47.040182144806664]
                    ]
                  ]
                }
              }
            ]
          }
          expect(utils.isGeoJSONValid(invalid)).toBe(false);

          const valid = {
            "type": "FeatureCollection",
            "features": [
              {
                "type": "Feature",
                "properties": {},
                "geometry": {
                  "type": "Polygon",
                  "coordinates": [
                    [
                      [11.953125,26.115985925333536],
                      [10.546875,16.636191878397664],
                      [29.53125,13.581920900545844],
                      [30.234375,25.799891182088334],
                      [18.6328125,30.14512718337613],
                      [11.953125,26.115985925333536]
                    ]
                  ]
                }
              }
            ]
          }
          expect(utils.isGeoJSONValid(valid)).toBe(true);
    });

    it('createGeoJSON should take an ol3 geom and return a feature collection containing a feature with that geom', () => {
        const extentSpy = new sinon.spy(ol.geom.Point.prototype, 'getExtent');
        const coords = ol.proj.transform([-1,1], utils.WGS84, utils.WEB_MERCATOR);
        const geom = new ol.geom.Point(coords);
        const expected = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "bbox": [-1,1,-1,1],
                    "geometry": {"type": 'Point', "coordinates": [-1,1]}
                }
            ]
        };
        const geojson = utils.createGeoJSON(geom);
        expect(extentSpy.calledOnce).toBe(true);
        expect(geojson).toEqual(expected);
    });

    it('createGeoJSONGeometry should take a ol3 geom and return the geom in geojson format', () => {
        const coords = ol.proj.transform([-1,1], utils.WGS84, utils.WEB_MERCATOR);
        const geom = new ol.geom.Point(coords);
        const expected = {"type": 'Point', "coordinates": [-1,1]};
        const cloneSpy = new sinon.spy(ol.geom.Point.prototype, 'clone');
        const transformSpy = new sinon.spy(ol.geom.Point.prototype, 'transform');
        const coordsSpy = new sinon.spy(ol.geom.Point.prototype, 'getCoordinates');
        expect(utils.createGeoJSONGeometry(geom)).toEqual(expected);
        expect(cloneSpy.calledOnce).toBe(true);
        expect(transformSpy.calledOnce).toBe(true);
        expect(transformSpy.calledWith(utils.WEB_MERCATOR, utils.WGS84)).toBe(true);
        expect(coordsSpy.calledOnce).toBe(true);
        cloneSpy.restore();
        transformSpy.restore();
        coordsSpy.restore();
    });

    it('clearDraw should get the layer source then clear it', () => {
        const clear = new sinon.spy();
        const layer = {
            getSource: new sinon.spy(() => {return {clear: clear}})
        }
        utils.clearDraw(layer);
        expect(layer.getSource.calledOnce).toBe(true);
        expect(clear.calledOnce).toBe(true);
    });

    it('zoomToGeometry should fit view to geom if its not a point type', () => {
        const geom = {getType: new sinon.spy(() => {return 'Polygon'})};
        const fit = new sinon.spy(() => {});
        const map = {getView: new sinon.spy(() => {return {fit: fit}})};
        utils.zoomToGeometry(geom, map);
        expect(geom.getType.calledOnce).toBe(true);
        expect(map.getView.calledOnce).toBe(true);
        expect(fit.calledOnce).toBe(true);
    });

    it('zoomToGeometry should center on geom if it is a point type', () => {
        const coords = new sinon.spy();
        const geom = {
            getType: new sinon.spy(() => {return 'Point'}),
            getCoordinates: new sinon.spy()
        };
        const center = new sinon.spy();
        const map = {
            getView: new sinon.spy(() => {return {setCenter: center}})
        };
        utils.zoomToGeometry(geom, map);
        expect(geom.getType.calledOnce).toBe(true);
        expect(map.getView.calledOnce).toBe(true);
        expect(center.calledOnce).toBe(true);
        expect(geom.getCoordinates.calledOnce).toBe(true);
    });
});