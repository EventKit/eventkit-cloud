import axios from 'axios';
import { getCookie } from '../utils/generic';

export const types = {
    FILE_ERROR: 'FILE_ERROR',
    FILE_PROCESSED: 'FILE_PROCESSED',
    FILE_PROCESSING: 'FILE_PROCESSING',
    FILE_RESET: 'FILE_RESET',
};


export function resetGeoJSONFile() {
    return {
        type: types.FILE_RESET,
    };
}

export const processGeoJSONFile = file => (dispatch) => {
    dispatch({ type: types.FILE_PROCESSING, filename: file.name });

    const csrftoken = getCookie('csrftoken');

    const formData = new FormData();
    formData.append('file', file);

    return axios({
        data: formData,
        headers: { 'X-CSRFToken': csrftoken },
        method: 'POST',
        url: '/file_upload',
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
