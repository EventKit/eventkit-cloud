import axios from 'axios';
import actions from './actionTypes';

export function getLicenses() {
    return (dispatch) => {
        dispatch({
            type: actions.FETCHING_LICENSES,
        });

        return axios({
            url: '/api/licenses',
            method: 'GET',
        }).then((response) => {
            dispatch({
                type: actions.RECEIVED_LICENSES,
                licenses: response.data,
            });
        }).catch((error) => {
            dispatch({
                type: actions.FETCH_LICENSES_ERROR,
                error: error.response.data,
            });
        });
    };
}

export default getLicenses;
