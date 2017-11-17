import axios from 'axios';
import cookie from 'react-cookie';
import types from './mapToolActionTypes';

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
            const featureCollection = data;
            dispatch({ type: types.FILE_PROCESSED, featureCollection });
        } else {
            dispatch({ type: types.FILE_ERROR, error: 'No data returned from the api.' });
        }
    }).catch((error) => {
        dispatch({ type: types.FILE_ERROR, error: error.response.data });
    });
};

