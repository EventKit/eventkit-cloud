import Normalizer from '../utils/normalizers';
import { getHeaderPageInfo } from '../utils/generic';

export const types = {
    CLEAR_DATACART_DETAILS: 'CLEAR_DATACART_DETAILS',
    DATACART_DETAILS_ERROR: 'DATACART_DETAILS_ERROR',
    DATACART_DETAILS_RECEIVED: 'DATACART_DETAILS_RECEIVED',
    DELETED_RUN: 'DELETED_RUN',
    DELETE_RUN_ERROR: 'DELETE_RUN_ERROR',
    DELETING_RUN: 'DELETING_RUN',
    FETCHING_FEATURED_RUNS: 'FETCHING_FEATURED_RUNS',
    FETCHING_RUNS: 'FETCHING_RUNS',
    FETCH_FEATURED_RUNS_ERROR: 'FETCH_FEATURED_RUNS_ERROR',
    FETCH_RUNS_ERROR: 'FETCH_RUNS_ERROR',
    GETTING_DATACART_DETAILS: 'GETTING_DATACART_DETAILS',
    RECEIVED_FEATURED_RUNS: 'RECEIVED_FEATURED_RUNS',
    RECEIVED_RUNS: 'RECEIVED_RUNS',
    UPDATE_EXPIRATION_ERROR: 'UPDATE_EXPIRATION_ERROR',
    UPDATE_EXPIRATION_SUCCESS: 'UPDATE_EXPIRATION_SUCCESS',
    UPDATING_EXPIRATION: 'UPDATING_EXPIRATION',
};

export function getDatacartDetails(jobuid) {
    return {
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
                    payload: {
                        id: result,
                        username: state.user.data.user.username,
                        ...entities,
                    },
                    type: 'ADD_RUN',
                };
            });
            return actions;
        },
        method: 'GET',
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
        params: { job_uid: jobuid },
        types: [
            types.GETTING_DATACART_DETAILS,
            types.DATACART_DETAILS_RECEIVED,
            types.DATACART_DETAILS_ERROR,
        ],
        url: '/api/runs',
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
    const formats = (args.formats) ? Object.keys(args.formats) : [];
    const projections = (args.projections) ? Object.keys(args.projections) : [];
    const params = { slim: 'true' };
    params.page_size = args.page_size;
    if (args.ordering) {
        params.ordering = args.ordering.includes('featured')
            ? `${args.ordering},-started_at`
            : args.ordering;
    } else {
        params.ordering = '-job__featured';
    }
    if (args.ownerFilter !== 'all') { params.user = args.ownerFilter };
    if (status.length) { params.status = status.join(',') };
    if (args.minDate) { params.min_date = args.minDate };
    if (args.maxDate) { params.max_date = args.maxDate };
    if (args.search) { params.search_term = args.search.slice(0, 1000) };
    if (providers.length) { params.providers = providers.join(',') };
    if (formats.length) { params.formats = formats.join(',') };
    if (projections.length) { params.projections = projections.join(',') };

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
        auto: args.isAuto,
        batchSuccess: (response, state) => {
            const normalizer = new Normalizer();
            const actions = response.data.map((run) => {
                const { result, entities } = normalizer.normalizeRun(run);
                return {
                    payload: {
                        id: result,
                        username: state.user.data.user.username,
                        ...entities,
                    },
                    type: 'ADD_RUN',
                };
            });
            return actions;
        },
        cancellable: true,
        data,
        getCancelSource: state => state.exports.allInfo.status.cancelSource,
        method: 'POST',
        onSuccess: (response) => {
            const { nextPage, range } = getHeaderPageInfo(response);
            const orderedIds = response.data.map(run => run.uid);
            return {
                payload: {
                    nextPage,
                    orderedIds,
                    range,
                },
            };
        },
        params,
        types: [
            types.FETCHING_RUNS,
            types.RECEIVED_RUNS,
            types.FETCH_RUNS_ERROR,
        ],
        url: '/api/runs/filter',
    };
}

export function getFeaturedRuns(args) {
    const params = { slim: 'true' };
    params.page_size = args.pageSize;
    params.featured = true;
    return {
        auto: args.isAuto,
        batchSuccess: (response, state) => {
            const norm = new Normalizer();
            const actions = response.data.map((run) => {
                const { result, entities } = norm.normalizeRun(run);
                return {
                    payload: {
                        id: result,
                        username: state.user.data.user.username,
                        ...entities,
                    },
                    type: 'ADD_FEATURED_RUN',
                };
            });
            return actions;
        },
        cancellable: args.isAuto,
        getCancelSource: state => state.exports.featuredInfo.status.cancelSource,
        method: 'POST',
        onSuccess: (response) => {
            const { nextPage, range } = getHeaderPageInfo(response);

            return {
                payload: {
                    ids: response.data.map(run => run.uid),
                    nextPage,
                    range,
                },
            };
        },
        params,
        types: [
            types.FETCH_FEATURED_RUNS_ERROR,
            types.FETCHING_FEATURED_RUNS,
            types.RECEIVED_FEATURED_RUNS,
        ],
        url: '/api/runs/filter',
    };
}

export function deleteRun(uid) {
    return {
        method: 'DELETE',
        onSuccess: () => ({ payload: { id: uid } }),
        types: [
            types.DELETE_RUN_ERROR,
            types.DELETED_RUN,
            types.DELETING_RUN,
        ],
        url: `/api/runs/${uid}`,
    };
}

export function updateExpiration(uid, expiration) {
    return {
        data: { expiration },
        method: 'PATCH',
        types: [
            types.UPDATE_EXPIRATION_ERROR,
            types.UPDATE_EXPIRATION_SUCCESS,
            types.UPDATING_EXPIRATION,
        ],
        url: `/api/runs/${uid}`,
    };
}
