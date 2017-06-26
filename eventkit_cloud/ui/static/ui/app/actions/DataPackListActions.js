import types from './actionTypes';
import axios from 'axios';
import cookie from 'react-cookie';

export function getRuns(params) {
    return (dispatch) => {
        dispatch({type: types.FETCHING_RUNS});
        const url = params ? `/api/runs?${params}` : '/api/runs'
        return axios ({
            url: url,
            method: 'GET',
        }).then((response) => {
            dispatch({type: types.RECEIVED_RUNS, runs: response.data});
        }).catch(error => {
            dispatch({type: types.FETCH_RUNS_ERROR, error: error});
        });

    }
}

export function deleteRuns(uid) {
    return (dispatch, getState) => {

        dispatch({type: types.DELETING_RUN});

        const csrftoken = cookie.load('csrftoken');

        const form_data = new FormData();
        form_data.append('csrfmiddlewaretoken', csrftoken);

        return axios({
            url: '/api/runs/' + uid,
            method: 'DELETE',
            data: form_data,
            headers: {"X-CSRFToken": csrftoken}
        }).then((response) => {
            dispatch({type: types.DELETED_RUN});
        }).catch(error => {
            dispatch({type: types.DELETE_RUN_ERROR, error: error});
        });
    }
}
