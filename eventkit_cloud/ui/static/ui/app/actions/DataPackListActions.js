import types from './actionTypes';
import axios from 'axios'

export function getRuns() {
    return (dispatch) => {
        dispatch({type: types.FETCHING_RUNS});
        return axios ({
            url: '/api/runs',
            method: 'GET',
        }).then((response) => {
            dispatch({type: types.RECEIVED_RUNS, runs: response.data});
        }).catch(error => {
            dispatch({type: types.FETCH_RUNS_ERROR, error: error});
        });

    }
}
