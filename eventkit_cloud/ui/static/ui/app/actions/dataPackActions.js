import axios from 'axios';
import cookie from 'react-cookie';
import types from './actionTypes';

export function getRuns(args = {}) {
    return (dispatch, getState) => {
        const { runsList } = getState();
        // if there is already a request in process we need to cancel it
        // before executing the current request
        if (runsList.fetching && runsList.cancelSource) {
            // if this is not a direct request from the user, dont cancel ongoing requests
            if (args.isAuto) {
                return null;
            }
            // if this is a direct user action, it is safe to cancel ongoing requests
            runsList.cancelSource.cancel('Request is no longer valid, cancelling');
        }

        const { CancelToken } = axios;
        const source = CancelToken.source();

        dispatch({ type: types.FETCHING_RUNS, cancelSource: source });

        const status = [];
        if (args.status) {
            Object.keys(args.status).forEach((key) => {
                if (args.status[key]) {
                    status.push(key.toUpperCase());
                }
            });
        }

        const providers = (args.providers) ? Object.keys(args.providers) : [];

        const params = {};
        params.page_size = args.page_size;
        if (args.ordering) {
            params.ordering = args.ordering.includes('featured') ?
                `${args.ordering},-started_at`
                :
                args.ordering;
        } else {
            params.ordering = '-job__featured';
        }
        if (args.ownerFilter !== 'all') params.user = args.ownerFilter;
        if (status.length) params.status = status.join(',');
        if (args.minDate) {
            params.min_date = args.minDate.toISOString().substring(0, 10);
        }
        if (args.maxDate) {
            const maxDate = new Date(args.maxDate.getTime());
            maxDate.setDate(maxDate.getDate() + 1);
            params.max_date = maxDate.toISOString().substring(0, 10);
        }
        if (args.search) params.search_term = args.search.slice(0, 1000);
        if (providers.length) params.providers = providers.join(',');

        const url = '/api/runs/filter';
        const csrfmiddlewaretoken = cookie.load('csrftoken');
        const data = {};
        if (args.geojson) {
            data.geojson = JSON.stringify(args.geojson);
        }
        if (args.permissions && args.permissions.value) {
            params.visibility = args.permissions.value;

            if (params.visibility === 'SHARED') {
                const groups = Object.keys(args.permissions.groups);
                const users = Object.keys(args.permissions.members);
                data.permissions = {
                    groups,
                    users,
                };
            }
        }

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
                [, range] = response.headers['content-range'].split('-');
            }

            const runs = response.data.map((run) => {
                const newRun = { ...run };
                newRun.job.permissions = {
                    value: newRun.job.visibility,
                    groups: newRun.job.permissions.groups,
                    members: newRun.job.permissions.users,
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

export function getFeaturedRuns(args) {
    return (dispatch, getState) => {
        const { featuredRunsList } = getState();
        if (featuredRunsList.fetching && featuredRunsList.cancelSource) {
            // if this is not a direct request from the user, dont cancel ongoing requests
            if (args.isAuto) {
                return null;
            }
            // if there is already a request in process we need to cancel it
            // before executing the current request
            featuredRunsList.cancelSource.cancel('Request is no longer valid, cancelling');
        }

        const { CancelToken } = axios;
        const source = CancelToken.source();

        dispatch({ type: types.FETCHING_FEATURED_RUNS, cancelSource: source });

        const params = {};
        params.page_size = args.pageSize;
        params.featured = true;

        const url = '/api/runs/filter';
        const csrfmiddlewaretoken = cookie.load('csrftoken');

        return axios({
            url,
            method: 'POST',
            data: {},
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
                [, range] = response.headers['content-range'].split('-');
            }

            const runs = [...response.data];

            dispatch({
                type: types.RECEIVED_FEATURED_RUNS,
                runs,
                nextPage,
                range,
            });
        }).catch((error) => {
            if (axios.isCancel(error)) {
                console.log(error.message);
            } else {
                dispatch({ type: types.FETCH_FEATURED_RUNS_ERROR, error: error.response.data });
            }
        });
    };
}

export function deleteRuns(uid) {
    return (dispatch) => {
        dispatch({ type: types.DELETING_RUN });

        const csrftoken = cookie.load('csrftoken');

        const formData = new FormData();
        formData.append('csrfmiddlewaretoken', csrftoken);

        return axios({
            url: `/api/runs/${uid}`,
            method: 'DELETE',
            data: formData,
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
