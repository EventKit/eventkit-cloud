import Normalizer from '../utils/normalizers';
import { getHeaderPageInfo } from '../utils/generic';

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

export function getDatacartDetails(jobuid) {
    return {
        types: [
            types.GETTING_DATACART_DETAILS,
            types.DATACART_DETAILS_RECEIVED,
            types.DATACART_DETAILS_ERROR,
        ],
        url: '/api/runs',
        method: 'GET',
        params: { job_uid: jobuid },
        onSuccess: (response) => {
            // get the list of runs (DataPacks) that are associated with the job UID.
            // We take only the first one for now since multiples are currently disabled.
            // However we leave it in an array for future proofing.
            const runs = [];
            if (response.data.length) {
                runs.push({ ...response.data[0] });
            }
            return {
                ids: runs.map(run => run.uid),
            };
        },
        batchSuccess: (response, state) => {
            // get the list of runs (DataPacks) that are associated with the job UID.
            // We take only the first one for now since multiples are currently disabled.
            // However we leave it in an array for future proofing.
            const runs = [];
            if (response.data.length) {
                runs.push({ ...response.data[0] });
            }

            const normalizer = new Normalizer();
            const actions = runs.map((run) => {
                const { result, entities } = normalizer.normalizeRun(run);
                return {
                    type: 'ADD_RUN',
                    payload: {
                        id: result,
                        username: state.user.data.user.username,
                        ...entities,
                    },
                };
            });
            return actions;
        },
    };
}

export function clearDataCartDetails() {
    return { type: types.CLEAR_DATACART_DETAILS };
}

export function getRuns(args = {}) {
    const status = [];
    if (args.status) {
        Object.keys(args.status).forEach((key) => {
            if (args.status[key]) {
                status.push(key.toUpperCase());
            }
        });
    }
    const providers = (args.providers) ? Object.keys(args.providers) : [];
    const params = { slim: 'true' };
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

    const data = {};
    if (args.geojson) {
        data.geojson = JSON.stringify(args.geojson);
    }
    if (args.permissions && args.permissions.value) {
        params.visibility = args.permissions.value;

        if (params.visibility === 'SHARED') {
            const groups = Object.keys(args.permissions.groups);
            const members = Object.keys(args.permissions.members);
            data.permissions = {
                groups,
                members,
            };
        }
    }

    return {
        types: [
            types.FETCHING_RUNS,
            types.RECEIVED_RUNS,
            types.FETCH_RUNS_ERROR,
        ],
        auto: args.isAuto,
        cancellable: true,
        getCancelSource: state => state.exports.allInfo.status.cancelSource,
        url: '/api/runs/filter',
        method: 'POST',
        data,
        params,
        onSuccess: (response) => {
            const { nextPage, range } = getHeaderPageInfo(response);
            const orderedIds = response.data.map(run => run.uid);
            return {
                payload: {
                    range,
                    nextPage,
                    orderedIds,
                },
            };
        },
        batchSuccess: (response, state) => {
            const normalizer = new Normalizer();
            const actions = response.data.map((run) => {
                const { result, entities } = normalizer.normalizeRun(run);
                return {
                    type: 'ADD_RUN',
                    payload: {
                        id: result,
                        username: state.user.data.user.username,
                        ...entities,
                    },
                };
            });
            return actions;
        },
    };
}

export function getFeaturedRuns(args) {
    const params = { slim: 'true' };
    params.page_size = args.pageSize;
    params.featured = true;
    return {
        types: [
            types.FETCHING_FEATURED_RUNS,
            types.RECEIVED_FEATURED_RUNS,
            types.FETCH_FEATURED_RUNS_ERROR,
        ],
        getCancelSource: state => state.exports.featuredInfo.status.cancelSource,
        auto: args.isAuto,
        cancellable: args.isAuto,
        url: '/api/runs/filter',
        method: 'POST',
        params,
        onSuccess: (response) => {
            const { nextPage, range } = getHeaderPageInfo(response);

            return {
                payload: {
                    ids: response.data.map(run => run.uid),
                    range,
                    nextPage,
                },
            };
        },
        batchSuccess: (response, state) => {
            const norm = new Normalizer();
            const actions = response.data.map((run) => {
                const { result, entities } = norm.normalizeRun(run);
                return {
                    type: 'ADD_FEATURED_RUN',
                    payload: {
                        id: result,
                        username: state.user.data.user.username,
                        ...entities,
                    },
                };
            });
            return actions;
        },
    };
}

export function deleteRun(uid) {
    return {
        types: [
            types.DELETING_RUN,
            types.DELETED_RUN,
            types.DELETE_RUN_ERROR,
        ],
        url: `/api/runs/${uid}`,
        method: 'DELETE',
        onSuccess: () => ({ payload: { id: uid } }),
    };
}

export function updateExpiration(uid, expiration) {
    return {
        types: [
            types.UPDATING_EXPIRATION,
            types.UPDATE_EXPIRATION_SUCCESS,
            types.UPDATE_EXPIRATION_ERROR,
        ],
        url: `/api/runs/${uid}`,
        method: 'PATCH',
        data: { expiration },
    };
}
