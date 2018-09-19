import axios from 'axios';

export const types = {
    GETTING_FORMATS: 'GETTING_FORMATS',
    FORMATS_RECEIVED: 'FORMATS_RECEIVED',
};

export function getFormats() {
    return (dispatch) => {
        dispatch({
            type: types.GETTING_FORMATS,
        });
        return axios({
            url: '/api/formats',
            method: 'GET',
        }).then((response) => {
            dispatch({
                type: types.FORMATS_RECEIVED,
                formats: response.data,
            });
        }).catch((error) => {
            console.log(error);
        });
    };
}
