import ol from 'openlayers';
import reader from 'jsts/org/locationtech/jts/io/GeoJSONReader';
import GeoJSONWriter from 'jsts/org/locationtech/jts/io/GeoJSONWriter';
import BufferOp from 'jsts/org/locationtech/jts/operation/buffer/BufferOp';
import UnionOp from 'jsts/org/locationtech/jts/operation/union/UnionOp';
import isValidOp from 'jsts/org/locationtech/jts/operation/valid/IsValidOp';

export const MODE_DRAW_BBOX = 'MODE_DRAW_BBOX';
export const MODE_NORMAL = 'MODE_NORMAL';
export const MODE_DRAW_FREE = 'MODE_DRAW_FREE';

export const WGS84 = 'EPSG:4326';
export const WEB_MERCATOR = 'EPSG:3857';

/**
 * Creates a buffer around a jsts geometry if not a Polygon or MultiPolygon.
 * @param {jstsGeometry} A JSTS geometry.
 * @return {jstsGeometry} A JSTS geometry.
 */
export function bufferGeometry(jstsGeometry) {
    //This buffers jsts points so that those features will have an actual area to be collected.
    // The buffer size is relative to the unit of measurement for the projection.
    // In order to get meters and circles, 3857 should be used.
    const bufferSize = 1000;
    if (!(jstsGeometry.getGeometryType() === "Polygon" || jstsGeometry.getGeometryType() === "MultiPolygon" )) {
        const temp_geom = transformJSTSGeometry(jstsGeometry, 'EPSG:4326', 'EPSG:3857')
        return transformJSTSGeometry(BufferOp.bufferOp(temp_geom, bufferSize), 'EPSG:3857', 'EPSG:4326')
    }
    return jstsGeometry;
}

/**
 * Converts a JSTS Polygon/MultiPolygon geometry from one reference system to another
 * @param {jstsGeometry} A JSTS geometry.
 * @param {from_srs} An EPSG code as a string, example: "EPSG:4326".
 * @param {to_srs} An EPSG code as a string, example: "EPSG:3857".
 * @return {jstsGeometry} A JSTS geometry.
 */
export function transformJSTSGeometry(jstsGeometry, from_srs, to_srs) {
    //This all seems excessive, however jsts ol3Parser wasn't working with versions
    // "jsts": "~1.4.0" and "openlayers": "~3.19.1", worth revisting in the future.
    const writer = new GeoJSONWriter();
    const geojsonReader = new reader();
    const ol3GeoJSON = new ol.format.GeoJSON();
    const geom = (new ol.format.GeoJSON()).readGeometry(writer.write(jstsGeometry)).transform(from_srs, to_srs);
    return geojsonReader.read(ol3GeoJSON.writeGeometry(geom));
}

/**
 * Converts a GeoJSON to a JSTS Polygon/MultiPolygon geometry
 * @param {geojson} A geojson object.
 * @return {geometry} A JSTS Polygon or MultiPolygon
 */
export function convertGeoJSONtoJSTS(geojson) {
    const geojsonReader = new reader();

    const jstsGeoJSON = geojsonReader.read(geojson);
    let geometry;
    if (jstsGeoJSON.features) {
        let features = jstsGeoJSON.features;
        geometry = bufferGeometry(features[0].geometry);
        for (let i = 1; i < features.length; i++) {
            geometry = UnionOp.union(geometry, bufferGeometry(features[i].geometry));
        }
    } else if (jstsGeoJSON.geometries) {
        let geometries = jstsGeoJSON.geometries;
        geometry = bufferGeometry(geometries[0]);
        for (let i = 1; i < geometries.length; i++) {
            geometry = UnionOp.union(geometry, bufferGeometry(geometries[i]));
        }
    } else if (jstsGeoJSON.geometry) {
        geometry = bufferGeometry(jstsGeoJSON.geometry);
    } else {
        geometry = bufferGeometry(jstsGeoJSON);
    }
    return geometry;
}

export function zoomToExtent(opt_option) {
    let options = opt_option ? opt_option : {};
    options.className = options.className != undefined ? options.className : ''

    let button = document.createElement('button');
    let icon = document.createElement('i');
    icon.className = 'fa fa-globe';
    button.appendChild(icon);
    let this_ = this;

    this.zoomer = () => {
        const map = this_.getMap();
        const view = map.getView();
        const size = map.getSize();
        const extent = !options.extent ? view.getProjection().getExtent() : options.extent;        
        view.fit(extent, size);
    }

    button.addEventListener('click', this_.zoomer, false);
    button.addEventListener('touchstart', this_.zoomer, false);
    let element = document.createElement('div');
    element.className = options.className + ' ol-unselectable ol-control';
    element.appendChild(button);

    ol.control.Control.call(this, {
        element: element,
        target: options.target
    });
}

export function generateDrawLayer() {
    return new ol.layer.Vector({
        source: new ol.source.Vector({
            wrapX: false
        }),
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#ce4427',
                width: 3,
            }),
            image: new ol.style.Icon({
                src: require("../../images/ic_room_black_24px.svg"),
            })

        })
    })
}

export function generateDrawBoxInteraction(drawLayer) {
    const draw = new ol.interaction.Draw({
        source: drawLayer.getSource(),
        type: 'Circle',
        geometryFunction: ol.interaction.Draw.createBox(),
        freehand: true,
        style: new ol.style.Style({
            image: new ol.style.RegularShape({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                points: 4,
                radius: 15,
                radius2: 0,
                angle: 0
            }),
            stroke: new ol.style.Stroke({
                color: '#ce4427',
                width: 2,
                lineDash: [5, 5]
            })
        })
    })
    draw.setActive(false)
    return draw
}

export function generateDrawFreeInteraction(drawLayer) {
    const draw = new ol.interaction.Draw({
        source: drawLayer.getSource(),
        type: 'Polygon',
        freehand: true,
        style: new ol.style.Style({
            image: new ol.style.RegularShape({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                points: 4,
                radius: 15,
                radius2: 0,
                angle: 0
            }),
            stroke: new ol.style.Stroke({
                color: '#ce4427',
                width: 2,
                lineDash: [5, 5]
            })
        })
    })
    draw.setActive(false)
    return draw
}



export function truncate(number) {
    return Math.round(number * 100000) / 100000
}

export function unwrapPoint([x, y]) {
    return [
        x > 0 ? Math.min(180, x) : Math.max(-180, x),
        y
    ]
}

export function featureToBbox(feature) {
    const reader = new ol.format.GeoJSON()
    const geometry = reader.readGeometry(feature.geometry, {featureProjection: WEB_MERCATOR})
    return geometry.getExtent()
}

export function deserialize(serialized) {
    if (serialized && serialized.length === 4) {
        return ol.proj.transformExtent(serialized, WGS84, WEB_MERCATOR)
    }
    return null
}

export function serialize(extent) {
    const bbox = ol.proj.transformExtent(extent, WEB_MERCATOR, WGS84)
    const p1 = unwrapPoint(bbox.slice(0, 2))
    const p2 = unwrapPoint(bbox.slice(2, 4))
    return p1.concat(p2).map(truncate)
}

export function isGeoJSONValid(geojson) {
    // creates a jsts GeoJSONReader
    const parser = new reader();
    // reads in geojson geometry and returns a jsts geometry
    const geom = parser.read(geojson.features[0].geometry);
    // return whether the geom is valid
    return isValidOp.isValid(geom);
}

export function createGeoJSON(ol3Geometry) {
    const bbox = serialize(ol3Geometry.getExtent());
    const geojson = {"type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "bbox": bbox,
                            "geometry": createGeoJSONGeometry(ol3Geometry)
                        }
                    ]}
    return geojson;
}

export function createGeoJSONGeometry(ol3Geometry) {
    const geom = ol3Geometry.clone();
    geom.transform(WEB_MERCATOR, WGS84);
    const coords = geom.getCoordinates();
    const geojson_geom = {
        "type": geom.getType(),
        "coordinates": coords
    }
    return geojson_geom;
}

export function clearDraw(drawLayer) {
    drawLayer.getSource().clear();
}

export function zoomToGeometry(geom, map) {
    if(geom.getType() != 'Point') {
        map.getView().fit(
            geom
        );
    } else {
        map.getView().setCenter(geom.getCoordinates())
    }
}

export function featureToPoint(feature) {
    if (!feature) {return null}
    const center = ol.extent.getCenter(feature.getGeometry().getExtent());
    return new ol.geom.Point(center);
}
