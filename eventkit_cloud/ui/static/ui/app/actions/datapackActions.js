import axios from 'axios';
import cookie from 'react-cookie';
import Normalizer from '../utils/normalizers';

export const types = {
    FETCHING_RUNS: 'FETCHING_RUNS',
    RECEIVED_RUNS: 'RECEIVED_RUNS',
    FETCH_RUNS_ERROR: 'FETCH_RUNS_ERROR',
    FETCHING_FEATURED_RUNS: 'FETCHING_FEATURED_RUNS',
    RECEIVED_FEATURED_RUNS: 'RECEIVED_FEATURED_RUNS',
    FETCH_FEATURED_RUNS_ERROR: 'FETCH_FEATURED_RUNS_ERROR',
    DELETING_RUN: 'DELETING_RUN',
    DELETED_RUN: 'DELETED_RUN',
    DELETE_RUN_ERROR: 'DELETE_RUN_ERROR',
    UPDATING_EXPIRATION: 'UPDATING_EXPIRATION',
    UPDATE_EXPIRATION_ERROR: 'UPDATE_EXPIRATION_ERROR',
    UPDATE_EXPIRATION_SUCCESS: 'UPDATE_EXPIRATION_SUCCESS',
    GETTING_DATACART_DETAILS: 'GETTING_DATACART_DETAILS',
    CLEAR_DATACART_DETAILS: 'CLEAR_DATACART_DETAILS',
    DATACART_DETAILS_RECEIVED: 'DATACART_DETAILS_RECEIVED',
    DATACART_DETAILS_ERROR: 'DATACART_DETAILS_ERROR',
};

export const getDatacartDetails = jobuid => (dispatch) => {
    dispatch({
        type: types.GETTING_DATACART_DETAILS,
    });
    return axios({
        url: `/api/runs?job_uid=${jobuid}`,
        method: 'GET',
    }).then((response) => {
        // get the list of runs (DataPacks) that are associated with the job UID.
        // We take only the first one for now since multiples are currently disabled.
        // However we leave it in an array for future proofing.
        const data = [];
        if (response.data.length) {
            data.push({ ...response.data[0] });
            if (!data[0].deleted) {
                data[0].job.permissions = {
                    value: data[0].job.visibility,
                    groups: data[0].job.permissions.groups,
                    members: data[0].job.permissions.users,
                };
            }
        }

        dispatch({
            type: types.DATACART_DETAILS_RECEIVED,
            datacartDetails: {
                data,
            },
        });
    }).catch((error) => {
        dispatch({
            type: types.DATACART_DETAILS_ERROR, error: error.response.data,
        });
    });
};

export function clearDataCartDetails() {
    return { type: types.CLEAR_DATACART_DETAILS };
}

export function getRuns(args = {}) {
    return (dispatch, getState) => {
        const { exports } = getState();
        // if there is already a request in process we need to cancel it
        // before executing the current request
        if (exports.status.fetching && exports.status.cancelSource) {
            // if this is not a direct request from the user, dont cancel ongoing requests
            if (args.isAuto) {
                return null;
            }
            // if this is a direct user action, it is safe to cancel ongoing requests
            exports.status.cancelSource.cancel('Request is no longer valid, cancelling');
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
        if (args.minDate) params.min_date = args.minDate;
        if (args.maxDate) params.max_date = args.maxDate;
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

            const norm = new Normalizer();
            const { entities, result } = norm.normalizeRuns(runs);

            dispatch({
                type: types.RECEIVED_RUNS,
                runs,
                nextPage,
                range,
                payload: {
                    ...entities,
                    runIds: result,
                },
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
        if (featuredRunsList.status.fetching && featuredRunsList.status.cancelSource) {
            // if this is not a direct request from the user, dont cancel ongoing requests
            if (args.isAuto) {
                return null;
            }
            // if there is already a request in process we need to cancel it
            // before executing the current request
            featuredRunsList.status.cancelSource.cancel('Request is no longer valid, cancelling');
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

            const norm = new Normalizer();
            const { entities, result } = norm.normalizeRuns(runs);

            dispatch({
                type: types.RECEIVED_FEATURED_RUNS,
                runs,
                nextPage,
                range,
                payload: {
                    ...entities,
                    runIds: result,
                },
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

export function deleteRun(uid) {
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

export function updateExpiration(uid, expiration) {
    return (dispatch) => {
        dispatch({ type: types.UPDATING_EXPIRATION });
        const csrftoken = cookie.load('csrftoken');
        return axios({
            url: `/api/runs/${uid}`,
            method: 'PATCH',
            data: { expiration },
            headers: { 'X-CSRFToken': csrftoken },
        }).then(() => {
            dispatch({ type: types.UPDATE_EXPIRATION_SUCCESS });
        }).catch((error) => {
            dispatch({ type: types.UPDATE_EXPIRATION_ERROR, error: error.response.data });
        });
    };
}
