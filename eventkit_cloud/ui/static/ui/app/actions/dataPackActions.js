import axios from 'axios';
import cookie from 'react-cookie';
import types from './actionTypes';

export function getRuns(params, geojson) {
    return (dispatch, getState) => {
        const { runsList } = getState();
        if (runsList.fetching && runsList.cancelSource) {
            // if there is already a request in process we need to cancel it
            // before executing the current request
            runsList.cancelSource.cancel('Request is no longer valid, cancelling');
        }

        const { CancelToken } = axios;
        const source = CancelToken.source();

        dispatch({ type: types.FETCHING_RUNS, cancelSource: source });

        const url = '/api/runs/filter';
        const csrfmiddlewaretoken = cookie.load('csrftoken');
        const data = geojson ? { geojson: JSON.stringify(geojson) } : { };

        return axios({
            url,
            method: 'POST',
            data,
            params,
            headers: { 'X-CSRFToken': csrfmiddlewaretoken },
            cancelToken: source.token,
        }).then((response) => {
            let nextPage = false;
            let links = [];

            if (response.headers.link) {
                links = response.headers.link.split(',');
            }

            links.forEach((link) => {
                if (link.includes('rel="next"')) {
                    nextPage = true;
                }
            });

            let range = '';
            if (response.headers['content-range']) {
                range = response.headers['content-range'].split('-')[1]; 
            }

            // TODO dont mock when api is ready
            const runs = response.data.map((run) => {
                const newRun = { ...run };
                newRun.job.permissions = {
                    value: 'PRIVATE',
                    groups: {},
                    members: {},
                };
                return newRun;
            });

            dispatch({
                type: types.RECEIVED_RUNS,
                runs,
                nextPage,
                range,
            });
        }).catch((error) => {
            if (axios.isCancel(error)) {
                console.log(error.message);
            } else {
                dispatch({ type: types.FETCH_RUNS_ERROR, error: error.response.data });
            }
        });
    };
}

export function deleteRuns(uid) {
    return (dispatch) => {
        dispatch({ type: types.DELETING_RUN });

        const csrftoken = cookie.load('csrftoken');

        const form_data = new FormData();
        form_data.append('csrfmiddlewaretoken', csrftoken);

        return axios({
            url: `/api/runs/${uid}`,
            method: 'DELETE',
            data: form_data,
            headers: { 'X-CSRFToken': csrftoken },
        }).then(() => {
            dispatch({ type: types.DELETED_RUN });
        }).catch((error) => {
            dispatch({ type: types.DELETE_RUN_ERROR, error: error.response.data });
        });
    };
}

export function setPageOrder(order) {
    return {
        type: types.SET_PAGE_ORDER,
        order,
    };
}

export function setPageView(view) {
    return {
        type: types.SET_PAGE_VIEW,
        view,
    };
}
