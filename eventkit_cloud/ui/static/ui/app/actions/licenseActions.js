import axios from 'axios';

export const types = {
    FETCHING_LICENSES: 'FETCHING_LICENSES',
    RECEIVED_LICENSES: 'RECEIVED_LICENSES',
    FETCH_LICENSES_ERROR: 'FETCH_LICENSES_ERROR',
};

export function getLicenses() {
    return (dispatch) => {
        dispatch({
            type: types.FETCHING_LICENSES,
        });

        return axios({
            url: '/api/licenses',
            method: 'GET',
        }).then((response) => {
            dispatch({
                type: types.RECEIVED_LICENSES,
                licenses: response.data,
            });
        }).catch((error) => {
            dispatch({
                type: types.FETCH_LICENSES_ERROR,
                error: error.response.data,
            });
        });
    };
}

export default getLicenses;
