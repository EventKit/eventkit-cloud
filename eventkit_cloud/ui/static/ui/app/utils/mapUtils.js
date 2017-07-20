import ol from 'openlayers';
import reader from 'jsts/org/locationtech/jts/io/GeoJSONReader';
import GeoJSONWriter from 'jsts/org/locationtech/jts/io/GeoJSONWriter';
import BufferOp from 'jsts/org/locationtech/jts/operation/buffer/BufferOp';
import UnionOp from 'jsts/org/locationtech/jts/operation/union/UnionOp';

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
        const extent = !options.extent ? view.getProjection.getExtent() : options.extent;
        const map = this_.getMap();
        const view = map.getView();
        const size = map.getSize();
        view.fit(options.extent, size);
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
