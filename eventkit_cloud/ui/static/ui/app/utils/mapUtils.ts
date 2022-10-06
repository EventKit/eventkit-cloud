import {containsCoordinate, getCenter, getTopLeft, getTopRight, getWidth} from 'ol/extent';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Icon from 'ol/style/Icon';
import RegularShape from 'ol/style/RegularShape';
import Draw, { createBox } from 'ol/interaction/Draw';
import Point from 'ol/geom/Point';
import Polygon, { fromExtent } from 'ol/geom/Polygon';
import GeometryType from 'ol/geom/Geometry'

import isEqual from 'lodash/isEqual';
import Reader from 'jsts/org/locationtech/jts/io/GeoJSONReader';
import GeoJSONWriter from 'jsts/org/locationtech/jts/io/GeoJSONWriter';
import BufferOp from 'jsts/org/locationtech/jts/operation/buffer/BufferOp';
import UnionOp from 'jsts/org/locationtech/jts/operation/union/UnionOp';
import isValidOp from 'jsts/org/locationtech/jts/operation/valid/IsValidOp';
import BufferParameters from 'jsts/org/locationtech/jts/operation/buffer/BufferParameters';
import OverlayOp from 'jsts/org/locationtech/jts/operation/overlay/OverlayOp';
import { colors } from '../styles/eventkit_theme';
import MultiPolygon from "ol/geom/MultiPolygon";
import LinearRing from "ol/geom/LinearRing";
const icon = require('../../images/ic_room_black_24px.svg');

export const MODE_DRAW_BBOX = 'MODE_DRAW_BBOX';
export const MODE_NORMAL = 'MODE_NORMAL';
export const MODE_DRAW_FREE = 'MODE_DRAW_FREE';

export const WGS84 = 'EPSG:4326';

export interface TileCoordinate {
    z: number;  // Tile Zoom level
    y: number;  // Tile row
    x: number;  // Tile col
    lat: number;
    long: number;
    i?: number;  // Click pixel x
    j?: number;  // Click pixel y
}

/**
 * Convert a jsts geometry to an openlayers3 geometry
 * @param {jstsGeom} a JSTS geometry in EPSG:4326
 * @return {olGeom} an openlayers3 geometry in EPSG:4326
 */
export function jstsGeomToOlGeom(jstsGeom) {
    const writer = new GeoJSONWriter();
    const olReader = new GeoJSON();
    const olGeom = olReader.readGeometry(writer.write(jstsGeom));
    return olGeom;
}

/**
 * Convert a jsts geometry to a feature collection
 * @param {jstsGeom} a JSTS geometry in EPSG:4326
 * @return {featureCollection} a geojson feature collection in EPSG:4326
 */
export function jstsToFeatureCollection(jsts) {
    const writer = new GeoJSONWriter();
    const geom = writer.write((jsts));
    if (geom.coordinates) {
        return {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: geom,
                },
            ],
        };
    }
    return null;
}

/**
 * Converts a JSTS Polygon/MultiPolygon geometry from one reference system to another
 * @param {jstsGeometry} A JSTS geometry.
 * @param {from_srs} An EPSG code as a string, example: "EPSG:4326".
 * @param {to_srs} An EPSG code as a string, example: "EPSG:3857".
 * @return {jstsGeometry} A JSTS geometry.
 */
export function transformJSTSGeometry(jstsGeometry, fromSrs, toSrs) {
    // This all seems excessive, however jsts ol3Parser wasn't working with versions
    // "jsts": "~1.4.0" and "openlayers": "~3.19.1", worth revisting in the future.
    const writer = new GeoJSONWriter();
    const geojsonReader = new Reader();
    const ol3GeoJSON = new GeoJSON();
    const geom = (new GeoJSON())
        .readGeometry(writer.write(jstsGeometry)).transform(fromSrs, toSrs);
    return geojsonReader.read(ol3GeoJSON.writeGeometry(geom));
}


/**
 * Creates a buffer around a jsts geometry if not a Polygon or MultiPolygon.
 * @param {jstsGeometry} A JSTS geometry.
 * @param {bufferSize} The size of the buffer (in meteres)
 * @param {bufferPolys} Whether polygon/multipolygon features should be buffered
 * @return {jstsGeometry} A JSTS geometry.
 */
export function bufferGeometry(jstsGeometry, bufferSize, bufferPolys) {
    // This buffers jsts points so that those features will have an actual area to be collected.
    // The buffer size is relative to the unit of measurement for the projection.
    // In order to get meters and circles, 3857 should be used.
    const bufferParams = new BufferParameters();
    bufferParams.setJoinStyle(2);

    const size = bufferSize || 1;
    if (bufferPolys) {
        const tempGeom = transformJSTSGeometry(jstsGeometry, 'EPSG:4326', 'EPSG:3857');
        const buff = new BufferOp(tempGeom, bufferParams);
        const geomBuff = buff.getResultGeometry(size);
        return transformJSTSGeometry(geomBuff, 'EPSG:3857', 'EPSG:4326');
    } if (!(jstsGeometry.getGeometryType() === 'Polygon' || jstsGeometry.getGeometryType() === 'MultiPolygon')) {
        const tempGeom = transformJSTSGeometry(jstsGeometry, 'EPSG:4326', 'EPSG:3857');
        return transformJSTSGeometry(BufferOp.bufferOp(tempGeom, size), 'EPSG:3857', 'EPSG:4326');
    }
    return jstsGeometry;
}

/**
 * Converts a GeoJSON to a JSTS Polygon/MultiPolygon geometry
 * @param {geojson} A geojson object.
 * @param {bufferSize} The size of the buffer (in meters)
 * @param {bufferPolys} Whether polygon/multipolygon features should be buffered
 * @return {geometry} A JSTS Polygon or MultiPolygon
 */
export function convertGeoJSONtoJSTS(geojson, bufferSize, bufferPolys) {
    const geojsonReader = new Reader();

    const jstsGeoJSON = geojsonReader.read(geojson);

    let geometry;
    if (jstsGeoJSON.features) {
        const { features } = jstsGeoJSON;
        geometry = bufferGeometry(features[0].geometry, bufferSize, bufferPolys);
        for (let i = 1; i < features.length; i += 1) {
            geometry = UnionOp.union(
                geometry,
                bufferGeometry(features[i].geometry, bufferSize, bufferPolys),
            );
        }
    } else if (jstsGeoJSON.geometries) {
        const { geometries } = jstsGeoJSON;
        geometry = bufferGeometry(geometries[0], bufferSize, bufferPolys);
        for (let i = 1; i < geometries.length; i += 1) {
            geometry = UnionOp.union(
                geometry,
                bufferGeometry(geometries[i], bufferSize, bufferPolys),
            );
        }
    } else if (jstsGeoJSON.geometry) {
        geometry = bufferGeometry(jstsGeoJSON.geometry, bufferSize, bufferPolys);
    } else {
        geometry = bufferGeometry(jstsGeoJSON, bufferSize, bufferPolys);
    }
    return geometry;
}

/**
 * Buffers a geojson feature collection and returns the collection
 * @param {featureCollection} A geojson feature collection in EPSG:4326
 * @param {bufferSize} The linear distance (meters) to buffer by
 * @param {bufferPolys} True if polygon features should be buffered too
 */
export function bufferGeojson(featureCollection, bufferSize, bufferPolys) {
    const geojsonReader = new Reader();
    const jstsGeoJSON = geojsonReader.read(featureCollection);
    const { features } = jstsGeoJSON;
    const writer = new GeoJSONWriter();
    const bufferedFeatures = [];
    features.forEach((feat) => {
        const size = bufferSize || 1;
        const geom = bufferGeometry(feat.geometry, size, bufferPolys);
        let geojsonGeom;
        if (geom.getArea() !== 0) {
            geojsonGeom = writer.write(geom);
            bufferedFeatures.push({
                type: 'Feature',
                properties: feat.properties || {},
                geometry: { ...geojsonGeom },
            });
        }
    });
    const bufferedFeatureCollection = {
        type: 'FeatureCollection',
        features: bufferedFeatures,
    };
    return bufferedFeatureCollection;
}

/**
 * Converts a feature collection into a single feature, buffering points and lines if needed
 * @param {featureCollection} A geojson feature collection in EPSG:4326
 * @return {newFeatureCollection} A feature collection with a single feature
 * containing all feature geometries in EPSG:4326
 */
export function flattenFeatureCollection(featureCollection) {
    const jsts = convertGeoJSONtoJSTS(featureCollection, 1, false);
    const newFeatureCollection = jstsToFeatureCollection(jsts);
    return newFeatureCollection;
}

export function covers(a, b) {
    const c =OverlayOp.intersection(a, b);
    return !OverlayOp.intersection(a, b).isEmpty();
}

export function generateDrawLayer() {
    return new VectorLayer({
        source: new VectorSource({
            wrapX: true,
        }),
        style: new Style({
            stroke: new Stroke({
                color: colors.warning,
                width: 3,
            }),
            image: new Icon({
                src: icon,
            }),
        }),
    });
}

export function generateDrawBoxInteraction(drawLayer) {
    const geomFunction = createBox();
    const draw = new Draw({
        source: drawLayer.getSource(),
        type: 'Circle',
        wrapX: true,
        geometryFunction: geomFunction,
        freehand: true,
        style: new Style({
            image: new RegularShape({
                stroke: new Stroke({
                    color: colors.black,
                    width: 1,
                }),
                points: 4,
                radius: 15,
                radius2: 0,
                angle: 0,
            }),
            stroke: new Stroke({
                color: colors.warning,
                width: 2,
                lineDash: [5, 5],
            }),
        }),
    });
    draw.setActive(false);
    return draw;
}

export function generateDrawFreeInteraction(drawLayer) {
    const draw = new Draw({
        source: drawLayer.getSource(),
        type: 'Polygon',
        wrapX: true,
        freehand: false,
        style: new Style({
            image: new RegularShape({
                stroke: new Stroke({
                    color: colors.black,
                    width: 1,
                }),
                points: 4,
                radius: 15,
                radius2: 0,
                angle: 0,
            }),
            stroke: new Stroke({
                color: colors.warning,
                width: 2,
                lineDash: [5, 5],
            }),
        }),
    });
    draw.setActive(false);
    return draw;
}

export function truncate(number) {
    return Math.round(number * 100000) / 100000;
}

export function unwrapPoint([x, y]) {
    return [
        x > 0 ? Math.min(180, x) : Math.max(-180, x),
        y,
    ];
}

export function featureToBbox(feature, projection) {
    let featProjection = projection;
    if (!featProjection) {
        featProjection = WGS84;
    }
    const reader = new GeoJSON();
    const geometry = reader.readGeometry(feature.geometry, { featureProjection: featProjection });
    return geometry.getExtent();
}

// This may not be needed anymore
export function deserialize(serialized) {
    if (serialized && serialized.length === 4) {
        return serialized;
    }
    return null;
}

export function serialize(bbox) {
    const p1 = unwrapPoint(bbox.slice(0, 2));
    const p2 = unwrapPoint(bbox.slice(2, 4));
    return p1.concat(p2).map(truncate);
}


/**
 * Check if all features in collection are valid
 * @param {featureCollection} A geojson feature collection
 * @return True if all features are valid, false if at least one feature is invalid
 */
export function isGeoJSONValid(featureCollection) {
    // creates a jsts GeoJSONReader
    const parser = new Reader();
    for (let i = 0; i < featureCollection.features.length; i += 1) {
        // reads in geojson geometry and returns a jsts geometry
        const geom = parser.read(featureCollection.features[i].geometry);
        if (!isValidOp.isValid(geom)) {
            return false;
        }
    }
    return true;
}

export function createGeoJSONGeometry(ol3Geometry) {
    const geom = ol3Geometry.clone();
    const coords = geom.getCoordinates();
    const geojsonGeom = {
        type: geom.getType(),
        coordinates: coords,
    };
    return geojsonGeom;
}

export function createGeoJSON(ol3Geometry) {
    const bbox = serialize(ol3Geometry.getExtent());
    const geojson = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                bbox,
                geometry: createGeoJSONGeometry(ol3Geometry),
            },
        ],
    };
    return geojson;
}

export function clearDraw(drawLayer) {
    drawLayer.getSource().clear();
}

export function zoomToFeature(feature, map) {
    const geom = feature.getGeometry();
    if (geom.getType() !== 'Point') {
        map.getView().fit(geom);
    } else if (feature.getProperties().bbox) {
        map.getView().fit(feature.getProperties().bbox);
    } else {
        map.getView().setCenter(geom.getCoordinates());
    }
}

export function featureToPoint(feature) {
    if (!feature) { return null; }
    const center = getCenter(feature.getGeometry().getExtent());
    return new Point(center);
}

export function wrapX(tileGrid, tileCoord) {
    const z = tileCoord[0];
    const center = tileGrid.getTileCoordCenter(tileCoord);
    const projectionExtent = tileGrid.getExtent();
    if (!containsCoordinate(projectionExtent, center)) {
        const worldWidth = getWidth(projectionExtent);
        const worldsAway = Math.ceil((projectionExtent[0] - center[0]) / worldWidth);
        center[0] += worldWidth * worldsAway;
        return tileGrid.getTileCoordForCoordAndZ(center, z);
    }
    return tileCoord;
}

// Simplifies the geometry on a feature using open layers. Squared tolerance should be in degrees.
export function simplifyFeature(feature, toleranceAsSquaredDistance=0.001){
    const geom = feature.getGeometry().simplify(toleranceAsSquaredDistance);
    feature.setGeometry(geom);
    return feature;
}

// if any coordinates are wrapped adjust them to be within the projection extent
export function unwrapCoordinates(coords, projection) {
    // based on:
    // https://github.com/openlayers/openlayers/blob/2bff72122757b8eeb3f3dda6191d1301ff296948/src/ol/renderer/maprenderer.js#L155
    const projectionExtent = projection.getExtent();
    const worldWidth = getWidth(projectionExtent);
    return coords.map(coord => (
        coord.map((xy) => {
            const x = xy[0];
            if (x < projectionExtent[0] || x > projectionExtent[2]) {
                const worldsAway = Math.ceil((projectionExtent[0] - x) / worldWidth);
                return [x + (worldWidth * worldsAway), xy[1]];
            }
            return xy;
        })
    ));
}

export function unwrapExtent(inExtent, projection) {
    const projectionExtent = projection.getExtent();
    const worldWidth = getWidth(projectionExtent);
    let minX = inExtent[0];
    if (minX < projectionExtent[0] || minX > projectionExtent[2]) {
        const worldsAway = Math.ceil((projectionExtent[0] - minX) / worldWidth);
        minX += worldWidth * worldsAway;
    }
    let maxX = inExtent[2];
    if (maxX < projectionExtent[0] || maxX > projectionExtent[2]) {
        const worldsAway = Math.ceil((projectionExtent[0] - maxX) / worldWidth);
        maxX += worldWidth * worldsAway;
    }
    return [minX, inExtent[1], maxX, inExtent[3]];
}

// check if the view center is outside of the 'valid' extent
export function isViewOutsideValidExtent(view) {
    const projectionExtent = view.getProjection().getExtent();
    const center = view.getCenter();
    return center[0] < projectionExtent[0] || center[0] > projectionExtent[2];
}

// calculate what the 'valid' view center should be and set it
export function goToValidExtent(view) {
    const projectionExtent = view.getProjection().getExtent();
    const worldWidth = getWidth(projectionExtent);
    const center = view.getCenter();
    const worldsAway = Math.ceil((projectionExtent[0] - center[0]) / worldWidth);
    view.setCenter([center[0] + (worldWidth * worldsAway), center[1]]);
    return view.getCenter();
}

// check if a polygon has the shape of a rectangle
export function isBox(feature) {
    let featCoords = feature.getGeometry().getCoordinates();
    // if there are more than 5 coordinate pairs it can not be a box
    if (featCoords[0].length !== 5) {
        return false;
    }
    // if the extent geometry is the same as the feature geometry we know it is a box
    const featureExtent = feature.getGeometry().getExtent();
    const extentGeom = fromExtent(featureExtent);
    let extentCoords = extentGeom.getCoordinates();

    // since the 5th coord is the same as the first remove it,
    // duplicate messes with the comparison if coordinates are in a different order
    // there is probably a better way to compare arrays with different order of sub arrays,
    // but this is what ive got for now
    const featCompCoords = [
        String(featCoords[0][0]),
        String(featCoords[0][1]),
        String(featCoords[0][2]),
        String(featCoords[0][3]),
    ].sort();
    const extentCompCoords = [
        String(extentCoords[0][0]),
        String(extentCoords[0][1]),
        String(extentCoords[0][2]),
        String(extentCoords[0][3]),
    ].sort();

    return isEqual(featCompCoords, extentCompCoords);
}

// check if the pixel in question lies over a feature vertex, if it does, return the vertex coords
export function isVertex(pixel, feature, tolarance, map) {
    // check target pixel with pixel for each corner of the box,
    // if within tolerance or equal, we have a vertex
    const t = tolarance || 3;
    const geomType = feature.getGeometry().getType();
    let coords = feature.getGeometry().getCoordinates();
    if (geomType === 'Point') {
        coords = [coords];
    } else if (geomType === 'Polygon') {
        [coords] = coords;
    }
    let vertex = null;
    coords.some((coord) => {
        const px = map.getPixelFromCoordinate(coord);
        const xDif = Math.abs(Math.round(pixel[0]) - Math.round(px[0]));
        const yDif = Math.abs(Math.round(pixel[1]) - Math.round(px[1]));
        if (xDif <= t && yDif <= t) {
            vertex = coord;
            return true;
        }
        return false;
    });
    return vertex || false;
}

/**
 * Check if a feature collection has any geometries with no area
 * @param {featureCollection} A geojson feature collection
 * @return true if all geometries have area, otherwise false
 */
export function allHaveArea(featureCollection) {
    if (!featureCollection || !featureCollection.features) {
        return false;
    }

    const reader = new GeoJSON();
    const features = reader.readFeatures(featureCollection, {
        dataProjection: WGS84,
        featureProjection: WGS84,
    });

    if (!features.length) {
        return false;
    }

    for (let i = 0; i < features.length; i += 1) {
        try {
            const geom = features[i].getGeometry();
            let area = 0;
            if (geom instanceof Polygon || geom instanceof MultiPolygon || geom instanceof LinearRing) {
                area = geom.getArea();
            }
            if (!area) {
                return false;
            }
        } catch (e) {
            return false;
        }
    }
    return true;
}

export function getDominantGeometry(featureCollection) {
    const { features } = featureCollection;
    if (!features.length) {
        return null;
    }
    let polyCount = 0;
    let lineCount = 0;
    let pointCount = 0;
    features.forEach((feature) => {
        if (feature.geometry.type.toUpperCase().includes('POLYGON')) {
            polyCount += 1;
        } else if (feature.geometry.type.toUpperCase().includes('LINE')) {
            lineCount += 1;
        } else if (feature.geometry.type.toUpperCase().includes('POINT')) {
            pointCount += 1;
        }
    });
    if ((polyCount && lineCount) || (lineCount && pointCount) || (polyCount && pointCount)) {
        return 'Collection';
    }
    if (polyCount) {
        return 'Polygon';
    }
    if (lineCount) {
        return 'Line';
    }
    if (pointCount) {
        return 'Point';
    }
    return null;
}


export function getResolutions(levels, startingResolution) {
    // Default to EPSG:4326 resolution supporting 2 tiles at level 0.
    const startResolution = startingResolution || 0.703125;
    const resolutions = new Array(levels);
    for (let i = 0; i < resolutions.length; i += 1) {
        resolutions[i] = startResolution / (2 ** i);
    }
    return resolutions;
}


export function getTileCoordinateFromClick(event, layer, map) {
    const grid = layer.getSource().getTileGrid();
    const zoom = Math.floor(map.getView().getZoom());

    // Coord is returned as z, x, y
    // Y is returned as a negative because of openlayers origin, needs to be flipped and offset
    const tileCoord = wrapX(grid, grid.getTileCoordForCoordAndZ(event.coordinate, zoom));
    const tileExtent = grid.getTileCoordExtent(tileCoord);
    tileCoord[2] = tileCoord[2] * -1 - 1;

    const upperLeftPixel = map.getPixelFromCoordinate(getTopLeft(tileExtent));
    const upperRightPixel = map.getPixelFromCoordinate(getTopRight(tileExtent));

    // Calculate the actual number of pixels each tile is taking up.
    const pixelWidth = upperRightPixel[0] - upperLeftPixel[0];
    const tileSize = grid.getTileSize(zoom);
    const ratio = tileSize / pixelWidth;

    const tilePixel = [Math.floor((event.pixel[0] - upperLeftPixel[0]) * ratio),
        Math.floor((event.pixel[1] - upperLeftPixel[1]) * ratio)];

    return {
        lat: event.coordinate[1],
        long: event.coordinate[0],
        z: tileCoord[0],
        y: tileCoord[2],
        x: tileCoord[1],
        i: tilePixel[0],
        j: tilePixel[1],
    };
}
