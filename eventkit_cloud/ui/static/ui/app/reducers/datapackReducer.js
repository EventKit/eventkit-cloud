import { combineReducers } from 'redux';
import isEqual from 'lodash/isEqual';
import { types } from '../actions/datapackActions';
import { types as uiTypes } from '../actions/uiActions';


const datapacks = {
    data: {
        runs: {},
        jobs: {},
        provider_tasks: {},
        tasks: {},
        runIds: [],
        featuredIds: [],
    },
    meta: {
        nextPage: false,
        range: '',
        order: '',
        view: '',
    },
    status: {
        fetching: false,
        fetched: false,
        error: null,
        cancelSource: null,
    },
};

const addRuns = (state, runs) => {
    if (isEqual(state, runs)) {
        return state;
    }
    console.log('not equal');
    return runs;
};

const addJobs = (state, jobs) => {
    if (isEqual(state, jobs)) {
        return state;
    }
    console.log('not equal');
    return jobs;
};

const addProviderTasks = (state, providerTasks) => {
    if (isEqual(state, providerTasks)) {
        return state;
    }
    console.log('not equal');
    return providerTasks;
};

const addTasks = (state, tasks) => {
    if (isEqual(state, tasks)) {
        return state;
    }
    console.log('not equal');
    return tasks;
};

const addRunIds = (state, ids) => {
    if (isEqual(state, ids)) {
        return state;
    }
    console.log('not equal');
    return ids;
};

const addFeaturedIds = (state, jobs) => {
    const ids = Object.keys(jobs);
    const featuredIds = ids.filter(id => jobs[id].featured);
    if (isEqual(state, featuredIds)) {
        return state;
    }
    console.log('not equal');
    return featuredIds;
};

const runsById = (state = datapacks.data.runs, action) => {
    switch (action.type) {
        case types.RECEIVED_RUNS: return addRuns(state, action.payload.runs);
        default: return state;
    }
};

const jobsById = (state = datapacks.data.jobs, action) => {
    switch (action.type) {
        case types.RECEIVED_RUNS: return addJobs(state, action.payload.jobs);
        default: return state;
    }
};

const providerTasksById = (state = datapacks.data.provider_tasks, action) => {
    switch (action.type) {
        case types.RECEIVED_RUNS: return addProviderTasks(state, action.payload.provider_tasks);
        default: return state;
    }
};

const tasksById = (state = datapacks.data.tasks, action) => {
    switch (action.type) {
        case types.RECEIVED_RUNS: return addTasks(state, action.payload.tasks);
        default: return state;
    }
};

const allRunIds = (state = datapacks.data.runIds, action) => {
    switch (action.type) {
        case types.RECEIVED_RUNS: return addRunIds(state, action.payload.runIds);
        default: return state;
    }
};

const allFeaturedIds = (state = datapacks.data.featuredIds, action) => {
    switch (action.type) {
        case types.RECEIVED_RUNS: return addFeaturedIds(state, action.payload.jobs);
        default: return state;
    }
};

export const statusReducer = (state = datapacks.status, action) => {
    switch (action.type) {
        case types.FETCHING_RUNS:
            return {
                fetching: true,
                fetched: false,
                error: null,
                cancelSource: action.cancelSource,
            };
        case types.RECEIVED_RUNS:
            return {
                fetching: false,
                fetched: true,
                error: null,
                cancelSource: null,
            };
        case types.FETCH_RUNS_ERROR:
            return {
                fetching: false,
                fetched: false,
                error: action.error,
                cancelSource: null,
            };
        default: return state;
    }
};

export const metaReducer = (state = datapacks.meta, action) => {
    switch (action.type) {
        case types.RECEIVED_RUNS:
            return {
                ...state,
                nextPage: action.nextPage,
                range: action.range,
            };
        case uiTypes.SET_PAGE_ORDER:
            return {
                ...state,
                order: action.order,
            };
        case uiTypes.SET_PAGE_VIEW:
            return {
                ...state,
                view: action.view,
            };
        default: return state;
    }
};

export const dataReducer = combineReducers({
    runs: runsById,
    jobs: jobsById,
    provider_tasks: providerTasksById,
    tasks: tasksById,
    runIds: allRunIds,
    featuredIds: allFeaturedIds,
});

export const runsReducer = combineReducers({
    data: dataReducer,
    meta: metaReducer,
    status: statusReducer,
});

export const initialState = {
    runsList: {
        data: {
            runs: [],
            nextPage: false,
            range: '',
            order: '',
            view: '',
        },
        status: {
            fetching: false,
            fetched: false,
            error: null,
            cancelSource: null,
        },
    },
    featuredRunsList: {
        data: {
            runs: [],
            nextPage: false,
            range: '',
        },
        status: {
            fetching: false,
            fetched: false,
            error: null,
            cancelSource: null,
        },
    },
    runDeletion: {
        deleting: false,
        deleted: false,
        error: null,
    },
    updateExpiration: {
        updating: false,
        updated: false,
        error: null,
    },
    datacartDetails: {
        fetching: false,
        fetched: false,
        data: [],
        error: null,
    },
};

export function getDatacartDetailsReducer(state = initialState.datacartDetails, action) {
    switch (action.type) {
        case types.GETTING_DATACART_DETAILS:
            return {
                ...state,
                fetching: true,
                fetched: false,
                error: null,
            };
        case types.DATACART_DETAILS_RECEIVED:
            return {
                fetching: false,
                fetched: true,
                data: action.datacartDetails.data,
                error: null,
            };
        case types.DATACART_DETAILS_ERROR:
            return {
                fetching: false,
                fetched: false,
                data: [],
                error: action.error,
            };
        case types.CLEAR_DATACART_DETAILS:
            return {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            };
        default:
            return state;
    }
}

export function dataPackReducer(state = initialState.runsList, action) {
    switch (action.type) {
        case types.FETCHING_RUNS:
            return {
                ...state,
                status: {
                    fetching: true,
                    fetched: false,
                    error: null,
                    cancelSource: action.cancelSource,
                },
            };
        case types.RECEIVED_RUNS:
            return {
                ...state,
                status: {
                    fetching: false,
                    fetched: true,
                    error: null,
                    cancelSource: null,
                },
                data: {
                    ...state.data,
                    runs: action.runs,
                    nextPage: action.nextPage,
                    range: action.range,
                },
            };
        case types.FETCH_RUNS_ERROR:
            return {
                ...state,
                status: {
                    fetching: false,
                    fetched: false,
                    error: action.error,
                    cancelSource: null,
                },
                data: {
                    ...state.data,
                    runs: [],
                },
            };
        case uiTypes.SET_PAGE_ORDER:
            return {
                ...state,
                data: {
                    ...state.data,
                    order: action.order,
                },
            };
        case uiTypes.SET_PAGE_VIEW:
            return {
                ...state,
                data: {
                    ...state.data,
                    view: action.view,
                },
            };
        default:
            return state;
    }
}

export function featuredRunsReducer(state = initialState.featuredRunsList, action) {
    switch (action.type) {
        case types.FETCHING_FEATURED_RUNS:
            return {
                ...state,
                status: {
                    fetching: true,
                    fetched: false,
                    error: null,
                    cancelSource: action.cancelSource,
                },
            };
        case types.RECEIVED_FEATURED_RUNS:
            return {
                ...state,
                status: {
                    fetching: false,
                    fetched: true,
                    error: null,
                    cancelSource: null,
                },
                data: {
                    ...state.data,
                    runs: action.runs,
                    nextPage: action.nextPage,
                    range: action.range,
                },
            };
        case types.FETCH_FEATURED_RUNS_ERROR:
            return {
                ...state,
                status: {
                    fetching: false,
                    fetched: false,
                    error: action.error,
                    cancelSource: null,
                },
                data: {
                    ...state.data,
                    runs: [],
                },
            };
        default:
            return state;
    }
}

export function deleteRunReducer(state = initialState.runDeletion, action) {
    switch (action.type) {
        case types.DELETING_RUN:
            return { deleting: true, deleted: false, error: null };
        case types.DELETED_RUN:
            return { deleting: false, deleted: true, error: null };
        case types.DELETE_RUN_ERROR:
            return { deleting: false, deleted: false, error: action.error };
        default:
            return state;
    }
}

export function updateExpirationReducer(state = initialState.updateExpiration, action) {
    switch (action.type) {
        case types.UPDATING_EXPIRATION:
            return { updating: true, updated: false, error: null };
        case types.UPDATE_EXPIRATION_SUCCESS:
            return { updating: false, updated: true, error: null };
        case types.UPDATE_EXPIRATION_ERROR:
            return { updating: false, updated: false, error: action.error };
        default:
            return state;
    }
}
