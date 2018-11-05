import axios from 'axios';
import { makeAuthRequired } from './authActions';

export const types = {
    FETCHING_LICENSES: 'FETCHING_LICENSES',
    RECEIVED_LICENSES: 'RECEIVED_LICENSES',
    FETCH_LICENSES_ERROR: 'FETCH_LICENSES_ERROR',
};

export function getLicenses() {
    return (dispatch) => {
        dispatch(makeAuthRequired({
            type: types.FETCHING_LICENSES,
        }));

        return axios({
            url: '/api/licenses',
            method: 'GET',
        }).then((response) => {
            dispatch(makeAuthRequired({
                type: types.RECEIVED_LICENSES,
                licenses: response.data,
            }));
        }).catch((error) => {
            dispatch(makeAuthRequired({
                type: types.FETCH_LICENSES_ERROR,
                error: error.response.data,
            }));
        });
    };
}

export default getLicenses;
