import types from './actionTypes';
import axios from 'axios';
import cookie from 'react-cookie';

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

export function deleteRuns(uid) {
    return (dispatch) => {
        dispatch({type: types.DELETING_RUN});

        axios.get('/api/runs').catch((error) => {
            console.log(error);
        });

        const csrfmiddlewaretoken = cookie.load('csrftoken');
        const form_data = new FormData();
        form_data.append('csrfmiddlewaretoken', csrfmiddlewaretoken);

        return axios({
            url: '/api/runs/' + uid,
            method: 'DELETE',
            data: form_data,
            headers: {"X-CSRFToken": csrfmiddlewaretoken}
        }).then((response) => {
            dispatch({type: types.DELETED_RUN});
        }).catch(error => {
            dispatch({type: types.DELETE_RUN_ERROR, error: error});
        });
    }
}
