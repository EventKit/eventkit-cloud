import types from './actionTypes';
import axios from 'axios';
import cookie from 'react-cookie';

export function getRuns(params, geojson) {
    let thunk = dispatch => {
        dispatch({type: types.FETCHING_RUNS});
        const url = params ? `/api/runs/filter?${params}` : '/api/runs/filter'
        const csrfmiddlewaretoken = cookie.load('csrftoken');
        const data = geojson ? {geojson: JSON.stringify(geojson)} : {}
        return axios ({
            url: url,
            method: 'POST',
            data: data,
            headers: {"X-CSRFToken": csrfmiddlewaretoken}
        }).then((response) => {
            let nextPage = false;
            let links = [];

            if (response.headers.link) {
                links = response.headers.link.split(',');
            }
            for(const i in links) {
                if (links[i].includes('rel="next"')) {
                    nextPage = true;
                }
                
            }

            let range = '';
            if(response.headers['content-range']) {
                range = response.headers['content-range'].split('-')[1]; 
            }
            dispatch({type: types.RECEIVED_RUNS, runs: response.data, nextPage: nextPage, range: range});
        }).catch((error) => {
            dispatch({type: types.FETCH_RUNS_ERROR, error: error});
        });
        
    }
    thunk.meta = {
        debounce: {
            time: 1000,
            key: 'FETCH_RUNS'
        }
    }
    return thunk;
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

export function setPageOrder(order) {
    return {
        type: types.SET_PAGE_ORDER,
        order: order
    }
}

export function setPageView(view) {
    return {
        type: types.SET_PAGE_VIEW,
        view: view
    }
}
