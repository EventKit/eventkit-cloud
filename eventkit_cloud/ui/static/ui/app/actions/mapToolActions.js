import types from './mapToolActionTypes'
import ol from 'openlayers';
import GeoJSONWriter from 'jsts/org/locationtech/jts/io/GeoJSONWriter';
import { convertGeoJSONtoJSTS } from '../utils/mapUtils'

export function resetGeoJSONFile() {
    return {
        type: types.FILE_RESET
    }
}

export const processGeoJSONFile = file => dispatch => {
    dispatch({type: types.FILE_PROCESSING});
    const fileName = file.name;
    const ext = fileName.split('.').pop();
    if (ext != 'geojson') {
        const error_msg = 'File must be .geojson NOT .' + ext;
        dispatch({type: types.FILE_ERROR, error: error_msg});
        return Promise.reject(new Error(error_msg)).then(function (error) {
        }, function (error) {
            console.log(error);
        });
    }
    const reader = new FileReader();
    reader.onload = () => {
        const dataURL = reader.result;
        let geojson = null;
        try {
            geojson = JSON.parse(dataURL);
        }
        catch (e) {
            dispatch({type: types.FILE_ERROR, error: 'Could not parse GeoJSON'});
            return Promise.reject(new Error(e)).then(function (error) {
            }, function (error) {
                console.log(error);
            });
        }
        try {
            //Because the UI doesn't support multiple features combine all polygons into one feature.
            var multipolygon = convertGeoJSONtoJSTS(geojson);

            const writer = new GeoJSONWriter();
            const geom = (new ol.format.GeoJSON()).readGeometry(writer.write(multipolygon)).transform('EPSG:4326', 'EPSG:3857');
            if (geom.getType() == 'Polygon' || geom.getType() == 'MultiPolygon') {
                dispatch({type: types.FILE_PROCESSED, geom: geom});
            }
        }
        catch (err) {
            dispatch({type: types.FILE_ERROR, error: 'There was an error processing the geojson file.'});
            return Promise.reject(new Error(err)).then(function (error) {
            }, function (error) {
                console.log(error);
            });
        }

    }
    reader.onerror = () => {
        dispatch({type: types.FILE_ERROR, error: 'An error was encountered while reading your file'});
    }
    reader.readAsText(file);
    return Promise.resolve();
}

