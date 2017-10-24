import axios from 'axios';
import cookie from 'react-cookie';
import types from './mapToolActionTypes';
import { convertGeoJSONtoJSTS, jstsGeomToOlGeom } from '../utils/mapUtils';


export function resetGeoJSONFile() {
    return {
        type: types.FILE_RESET,
    };
}

export const processGeoJSONFile = file => (dispatch) => {
    dispatch({ type: types.FILE_PROCESSING });

    const csrftoken = cookie.load('csrftoken');

    const formData = new FormData();
    formData.set('file', file);

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
                const multipolygon = convertGeoJSONtoJSTS(data, 1, false);
                const geom = jstsGeomToOlGeom(multipolygon);
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

