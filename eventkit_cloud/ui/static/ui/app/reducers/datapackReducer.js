import { combineReducers } from 'redux';
import isEqual from 'lodash/isEqual';
import { types } from '../actions/datapackActions';
import { types as uiTypes } from '../actions/uiActions';

const status = {
    fetching: false,
    fetched: false,
    error: null,
    cancelSource: null,
};

const exports = {
    data: {
        runs: {},
        jobs: {},
        provider_tasks: {},
        tasks: {},
        featuredIds: [],
        ownIds: [],
        allIds: [],
        viewedIds: [],

        runIds: [], // support old
    },
    meta: {
        nextPage: false,
        range: '',
        order: '',
        view: '',
    },
    allStatus: {
        ...status,
    },
    featuredStatus: {
        ...status,
    },
    ownStatus: {
        ...status,
    },
    viewedStatus: {
        ...status,
    },

    status: { ...status }, // support old
};

const addRun = (state, run) => {
    if (isEqual(state[run.uid], run)) {
        return state;
    }

    return { ...state, [run.uid]: run };
};

const addJob = (state, job) => {
    if (isEqual(state[job.uid], job)) {
        return state;
    }

    return { ...state, [job.uid]: job };
};

const addProviderTask = (state, providerTask) => {
    if (isEqual(state[providerTask.uid], providerTask)) {
        return state;
    }

    return { ...state, [providerTask.uid]: providerTask };
};

const addTask = (state, task) => {
    if (isEqual(state[task.uid], task)) {
        return state;
    }

    return { ...state, [task.uid]: task };
};

// const addRuns = (state, runs) => {
//     if (isEqual(state, runs)) {
//         return state;
//     }
//     return runs;
// };

// const addJobs = (state, jobs) => {
//     if (isEqual(state, jobs)) {
//         return state;
//     }
//     return jobs;
// };

// const addProviderTasks = (state, providerTasks) => {
//     if (isEqual(state, providerTasks)) {
//         return state;
//     }
//     return providerTasks;
// };

// const addTasks = (state, tasks) => {
//     if (isEqual(state, tasks)) {
//         return state;
//     }
//     return tasks;
// };

const addRunIds = (state, ids) => {
    if (isEqual(state, ids)) {
        return state;
    }
    return ids;
};

const addRunId = (state, id) => {
    if (state.indexOf(id) > -1) {
        return state;
    }
    return [...state, id];
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

const runsById = (state = exports.data.runs, action) => {
    switch (action.type) {
        // case types.RECEIVED_RUNS: return addRuns(state, action.payload.runs);
        case 'ADD_RUN': {
            return addRun(
                state,
                Object.values(action.payload.runs)[0],
            );
        }
        default: return state;
    }
};

const jobsById = (state = exports.data.jobs, action) => {
    switch (action.type) {
        // case types.RECEIVED_RUNS: return addJobs(state, action.payload.jobs);
        case 'ADD_RUN': {
            return addJob(
                state,
                Object.values(action.payload.jobs)[0],
            );
        }
        default: return state;
    }
};

const providerTasksById = (state = exports.data.provider_tasks, action) => {
    switch (action.type) {
        // case types.RECEIVED_RUNS: return addProviderTasks(state, action.payload.provider_tasks);
        case 'ADD_RUN': {
            return addProviderTask(
                state,
                Object.values(action.payload.provider_tasks)[0],
            );
        }
        default: return state;
    }
};

const tasksById = (state = exports.data.tasks, action) => {
    switch (action.type) {
        // case types.RECEIVED_RUNS: return addTasks(state, action.payload.tasks);
        case 'ADD_RUN': {
            return addTask(
                state,
                Object.values(action.payload.tasks)[0],
            );
        }
        default: return state;
    }
};

const allRunIds = (state = exports.data.runIds, action) => {
    switch (action.type) {
        case types.RECEIVED_RUNS: return addRunIds(state, action.payload.runIds);
        default: return state;
    }
};

const allRunIdsss = (state = exports.data.allIds, action) => {
    switch (action.type) {
        case 'ADD_RUN': return addRunId(state, action.payload.id);
        default: return state;
    }
};

const allFeaturedIds = (state = exports.data.featuredIds, action) => {
    switch (action.type) {
        case types.RECEIVED_RUNS: return addFeaturedIds(state, action.payload.jobs);
        default: return state;
    }
};

export const statusReducer = (state = exports.status, action) => {
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

export const metaReducer = (state = exports.meta, action) => {
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
    allIds: allRunIdsss,
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

const featuredDatapacks = {
    data: {
        runs: {},
        jobs: {},
        provider_tasks: {},
        tasks: {},
        featuredIds: [],
        ownIds: [],
        allIds: [],
        viewedIds: [],

        runIds: [], // support old
    },
    meta: {
        nextPage: false,
        range: '',
        order: '',
        view: '',
    },
    allStatus: {
        ...status,
    },
    featuredStatus: {
        ...status,
    },
    ownStatus: {
        ...status,
    },
    viewedStatus: {
        ...status,
    },

    status: { ...status }, // support old
};

const featuredRunsById = (state = featuredDatapacks.data.runs, action) => {
    switch (action.type) {
        case 'ADD_FEATURED_RUN': return addRun(state, Object.values(action.payload.runs)[0]);
        default: return state;
    }
};

const featuredJobsById = (state = featuredDatapacks.data.jobs, action) => {
    switch (action.type) {
        case 'ADD_FEATURED_RUN': return addJob(state, Object.values(action.payload.jobs)[0]);
        default: return state;
    }
};

const featuredProviderTasksById = (state = featuredDatapacks.data.provider_tasks, action) => {
    switch (action.type) {
        case 'ADD_FEATURED_RUN': return addProviderTask(state, Object.values(action.payload.provider_tasks)[0]);
        default: return state;
    }
};

const featuredTasksById = (state = featuredDatapacks.data.tasks, action) => {
    switch (action.type) {
        case 'ADD_FEATURED_RUN': return addTask(state, Object.values(action.payload.tasks)[0]);
        default: return state;
    }
};

const allFeaturedRunIds = (state = featuredDatapacks.data.runIds, action) => {
    switch (action.type) {
        case types.RECEIVED_FEATURED_RUNS: return addRunIds(state, action.payload.runIds);
        default: return state;
    }
};

const allFeaturedRunIdsss = (state = exports.data.allIds, action) => {
    switch (action.type) {
        case 'ADD_FEATURED_RUN': return addRunId(state, action.payload.id);
        default: return state;
    }
};

export const featuredStatusReducer = (state = featuredDatapacks.status, action) => {
    switch (action.type) {
        case types.FETCHING_FEATURED_RUNS:
            return {
                fetching: true,
                fetched: false,
                error: null,
                cancelSource: action.cancelSource,
            };
        case types.RECEIVED_FEATURED_RUNS:
            return {
                fetching: false,
                fetched: true,
                error: null,
                cancelSource: null,
            };
        case types.FETCH_FEATURED_RUNS_ERROR:
            return {
                fetching: false,
                fetched: false,
                error: action.error,
                cancelSource: null,
            };
        default: return state;
    }
};

export const featuredMetaReducer = (state = featuredDatapacks.meta, action) => {
    switch (action.type) {
        case types.RECEIVED_FEATURED_RUNS:
            return {
                ...state,
                nextPage: action.nextPage,
                range: action.range,
            };
        default: return state;
    }
};

export const featuredDataReducer = combineReducers({
    runs: featuredRunsById,
    jobs: featuredJobsById,
    provider_tasks: featuredProviderTasksById,
    tasks: featuredTasksById,
    runIds: allFeaturedRunIds,
    allIds: allFeaturedRunIdsss,
});

export const featuredReducer = combineReducers({
    data: featuredDataReducer,
    meta: featuredMetaReducer,
    status: featuredStatusReducer,
});
