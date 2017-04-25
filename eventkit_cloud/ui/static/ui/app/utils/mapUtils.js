import ol from 'openlayers';
import * as jsts from 'jsts';

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
        var temp_geom = transformJSTSGeometry(jstsGeometry, 'EPSG:4326', 'EPSG:3857')
        return transformJSTSGeometry(temp_geom.buffer(bufferSize), 'EPSG:3857', 'EPSG:4326')
    }
    return jstsGeometry;
}

/**
 * Converts a GeoJSON to a JSTS Polygon/MultiPolygon geometry
 * @param {jstsGeometry} A JSTS geometry.
 * @param {from_srs} An EPSG code as a string, example: "EPSG:4326".
 * @param {to_srs} An EPSG code as a string, example: "EPSG:3857".
 * @return {jstsGeometry} A JSTS geometry.
 */
export function transformJSTSGeometry(jstsGeometry, from_srs, to_srs) {
    //This all seems excessive, however jsts ol3Parser wasn't working with versions
    // "jsts": "~1.4.0" and "openlayers": "~3.19.1", worth revisting in the future.
    const writer = new jsts.io.GeoJSONWriter();
    const geojsonReader = new jsts.io.GeoJSONReader();
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
    const geojsonReader = new jsts.io.GeoJSONReader();

    var jstsGeoJSON = geojsonReader.read(geojson);
    if (jstsGeoJSON.features) {
        var features = jstsGeoJSON.features;
        var geometry = bufferGeometry(features[0].geometry);
        for (var i = 1; i < features.length; i++) {
            geometry = geometry.union(bufferGeometry(features[i].geometry));
        }
    } else if (jstsGeoJSON.geometries) {
        var geometries = jstsGeoJSON.geometries;
        var geometry = bufferGeometry(geometries[0]);
        for (var i = 1; i < geometries.length; i++) {
            geometry = geometry.union(bufferGeometry(geometries[i]));
        }
    } else {
        var geometry = bufferGeometry(jstsGeoJSON);
    }
    return geometry;
}