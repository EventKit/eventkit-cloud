import {Config} from '../config';
import types from './actionTypes';
import axios from 'axios'
import cookie from 'react-cookie'

export const getDatacartDetails = (jobuid) => dispatch => {
    dispatch({
        type: types.GETTING_DATACART_DETAILS
    });

    return axios({
        url: '/api/runs?job_uid='+jobuid,
        method: 'GET',
    }).then((response) => {
        dispatch({
            type: types.DATACART_DETAILS_RECEIVED,
            datacartDetails: {
                data: response.data
            }
        });

    }).catch((error) => {console.log(error)
        dispatch({
            type: types.DATACART_DETAILS_ERROR, error: error
        });
    });
};

export function setDatacartDetailsReceived() {
    return {
        type: types.DATACART_DETAILS_RECEIVED_FLAG,
        datacartDetailsReceived: true
    }
};
