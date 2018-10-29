import axios from 'axios';
import { makeAuthRequired } from './authActions';

export const types = {
    GETTING_FORMATS: 'GETTING_FORMATS',
    FORMATS_RECEIVED: 'FORMATS_RECEIVED',
};

export function getFormats() {
    return (dispatch) => {
        dispatch(makeAuthRequired({
            type: types.GETTING_FORMATS,
        }));
        return axios({
            url: '/api/formats',
            method: 'GET',
        }).then((response) => {
            dispatch(makeAuthRequired({
                type: types.FORMATS_RECEIVED,
                formats: response.data,
            }));
        }).catch((error) => {
            console.log(error);
        });
    };
}
