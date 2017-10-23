import ol from 'openlayers';
import axios from 'axios';
import cookie from 'react-cookie';
import GeoJSONWriter from 'jsts/org/locationtech/jts/io/GeoJSONWriter';
import types from './mapToolActionTypes';
import { convertGeoJSONtoJSTS } from '../utils/mapUtils';


export function resetGeoJSONFile() {
    return {
        type: types.FILE_RESET,
    };
}

export const processGeoJSONFile = file => (dispatch) => {
    dispatch({ type: types.FILE_PROCESSING });

    const csrftoken = cookie.load('csrftoken');

    const formData = new FormData();
    formData.append('file', file);

    return axios({
        url: '/file_upload',
        method: 'POST',
        data: formData,
        headers: { 'X-CSRFToken': csrftoken },
    }).then((response) => {
        const { data } = response;
        if (data) {
            try {
                // Because the UI doesn't support multiple features
                // combine all polygons into one feature.
                const multipolygon = convertGeoJSONtoJSTS(data);

                const writer = new GeoJSONWriter();
                const geom = (new ol.format.GeoJSON()).readGeometry(writer.write(multipolygon)).transform('EPSG:4326', 'EPSG:3857');
                dispatch({ type: types.FILE_PROCESSED, geom });
            } catch (err) {
                dispatch({ type: types.FILE_ERROR, error: 'There was an error processing the geojson file.' });
            }
        } else {
            dispatch({ type: types.FILE_ERROR, error: 'No data returned from the api.' });
        }
    }).catch((error) => {
        dispatch({ type: types.FILE_ERROR, error: error.response.data });
    });
};

