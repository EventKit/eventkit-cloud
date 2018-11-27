import { combineReducers } from 'redux';
import isEqual from 'lodash/isEqual';
import { types } from '../actions/datapackActions';
import { types as uiTypes } from '../actions/uiActions';
import { types as activityTypes } from '../actions/userActivityActions';

const genericInfo = {
    ids: [],
    meta: {
        nextPage: false,
        range: '',
        order: '',
        view: '',
    },
    status: {
        fetching: null,
        fetched: null,
        error: null,
        cancelSource: null,
    },
};

export const exports = {
    data: {
        runs: {},
        jobs: {},
        provider_tasks: {},
        tasks: {},
    },
    orderedIds: [],
    allInfo: { ...genericInfo },
    featuredInfo: { ...genericInfo },
    ownInfo: { ids: [] },
    viewedInfo: { ...genericInfo },
};

const addRun = (state, run) => {
    if (isEqual(state[run.uid], run)) {
        return state;
    }
    return { ...state, [run.uid]: run };
};

const removeRun = (state, id) => {
    if (state[id]) {
        const newState = { ...state };
        newState[id] = null;
        delete newState[id];
        return newState;
    }
    return state;
};

const addJob = (state, job) => {
    if (isEqual(state[job.uid], job)) {
        return state;
    }
    return { ...state, [job.uid]: job };
};

const addProviderTasks = (state, providerTasks) => {
    const different = providerTasks.some(task => (
        state[task.uid] === undefined || !isEqual(task, state[task.uid])
    ));

    if (different) {
        const nextState = { ...state };
        providerTasks.forEach((task) => {
            nextState[task.uid] = task;
        });
        return nextState;
    }

    return state;
};

const addTasks = (state, tasks) => {
    const different = tasks.some(task => (
        state[task.uid] === undefined || !isEqual(task, state[task.uid])
    ));

    if (different) {
        const nextState = { ...state };
        tasks.forEach((task) => {
            nextState[task.uid] = task;
        });
        return nextState;
    }

    return state;
};

const addRunId = (state, id) => {
    if (state.indexOf(id) < 0) {
        return [...state, id];
    }
    return state;
};

const addOwnId = (state, run, username) => {
    if (run.user === username) {
        if (state.indexOf(run.uid) < 0) {
            return [...state, run.uid];
        }
    }
    return state;
};

const removeRunId = (state, id) => {
    if (state.indexOf(id) >= 0) {
        return state.filter(uid => uid !== id);
    }
    return state;
};

const addFeaturedIds = (state, ids) => (
    isEqual(state, ids) ? state : ids
);

const addViewedIds = (state, ids) => (
    isEqual(state, ids) ? state : ids
);

const runsById = (state = exports.data.runs, action) => {
    switch (action.type) {
        case 'ADD_RUN':
        case 'ADD_VIEWED_RUN':
        case 'ADD_FEATURED_RUN': {
            return addRun(
                state,
                Object.values(action.payload.runs || {})[0],
            );
        }
        case types.DELETED_RUN: {
            return removeRun(state, action.payload.id);
        }
        default: return state;
    }
};

const jobsById = (state = exports.data.jobs, action) => {
    switch (action.type) {
        case 'ADD_RUN':
        case 'ADD_VIEWED_RUN':
        case 'ADD_FEATURED_RUN': {
            return addJob(
                state,
                Object.values(action.payload.jobs || {})[0],
            );
        }
        default: return state;
    }
};

const providerTasksById = (state = exports.data.provider_tasks, action) => {
    switch (action.type) {
        case 'ADD_RUN':
        case 'ADD_VIEWED_RUN':
        case 'ADD_FEATURED_RUN': {
            return addProviderTasks(
                state,
                Object.values(action.payload.provider_tasks || []),
            );
        }
        default: return state;
    }
};

const tasksById = (state = exports.data.tasks, action) => {
    switch (action.type) {
        case 'ADD_RUN':
        case 'ADD_VIEWED_RUN':
        case 'ADD_FEATURED_RUN': {
            return addTasks(
                state,
                Object.values(action.payload.tasks || {}),
            );
        }
        default: return state;
    }
};

const allRunIds = (state = exports.allInfo.ids, action) => {
    switch (action.type) {
        case 'ADD_RUN':
        case 'ADD_VIEWED_RUN':
        case 'ADD_FEATURED_RUN':
            return addRunId(state, action.payload.id);
        case types.DELETED_RUN: {
            return removeRunId(state, action.payload.id);
        }
        default: return state;
    }
};

const allFeaturedIds = (state = exports.featuredInfo.ids, action) => {
    switch (action.type) {
        case types.RECEIVED_FEATURED_RUNS: return addFeaturedIds(state, action.payload.ids);
        case types.DELETED_RUN: {
            return removeRunId(state, action.payload.id);
        }
        default: return state;
    }
};

const allOwnIds = (state = exports.ownInfo.ids, action) => {
    switch (action.type) {
        case 'ADD_RUN':
        case 'ADD_VIEWED_RUN':
        case 'ADD_FEATURED_RUN': return addOwnId(state, Object.values(action.payload.runs)[0], action.payload.username);
        case types.DELETED_RUN: {
            return removeRunId(state, action.payload.id);
        }
        default: return state;
    }
};

const allViewedIds = (state = exports.viewedInfo.ids, action) => {
    switch (action.type) {
        case activityTypes.RECEIVED_VIEWED_JOBS: return addViewedIds(state, action.payload.ids);
        case types.DELETED_RUN: {
            return removeRunId(state, action.payload.id);
        }
        default: return state;
    }
};

const orderedIdReducer = (state = exports.orderedIds, action) => {
    switch (action.type) {
        case types.RECEIVED_RUNS: {
            return isEqual(state, action.payload.orderedIds) ? state : action.payload.orderedIds;
        }
        case types.DELETED_RUN: {
            return removeRunId(state, action.payload.id);
        }
        default: return state;
    }
};

const getStatusReducer = (inputTypeMap, inputState = {}) => {
    const typeMap = {
        FETCHING: null,
        FETCHED: null,
        ERROR: null,
        ...inputTypeMap,
    };
    const statusReducer = (state = inputState, action) => {
        switch (action.type) {
            case typeMap.FETCHING:
                return {
                    ...state,
                    fetching: true,
                    error: null,
                    cancelSource: action.cancelSource,
                };
            case typeMap.FETCHED:
                return {
                    fetching: false,
                    fetched: true,
                    error: null,
                    cancelSource: null,
                };
            case typeMap.ERROR:
                return {
                    fetching: false,
                    fetched: false,
                    error: action.error,
                    cancelSource: null,
                };
            default: return state;
        }
    };
    return statusReducer;
};

const getMetaReducer = (inputTypeMap, inputState = {}) => {
    const typeMap = {
        FETCHED: null,
        SET_PAGE_ORDER: null,
        SET_PAGE_VIEW: null,
        ...inputTypeMap,
    };
    const metaReducer = (state = inputState, action) => {
        switch (action.type) {
            case typeMap.FETCHED: {
                if (state.nextPage !== action.payload.nextPage || state.range !== action.payload.range) {
                    return {
                        ...state,
                        nextPage: action.payload.nextPage,
                        range: action.payload.range,
                    };
                }
                return state;
            }
            case typeMap.SET_PAGE_ORDER: {
                if (state.order !== action.order) {
                    return {
                        ...state,
                        order: action.order,
                    };
                }
                return state;
            }
            case typeMap.SET_PAGE_VIEW: {
                if (state.view !== action.view) {
                    return {
                        ...state,
                        view: action.view,
                    };
                }
                return state;
            }
            default: return state;
        }
    };
    return metaReducer;
};

export const allInfoReducer = combineReducers({
    ids: allRunIds,
    meta: getMetaReducer(
        {
            FETCHED: types.RECEIVED_RUNS,
            SET_PAGE_ORDER: uiTypes.SET_PAGE_ORDER,
            SET_PAGE_VIEW: uiTypes.SET_PAGE_VIEW,
        },
        exports.allInfo.meta,
    ),
    status: getStatusReducer(
        {
            FETCHING: types.FETCHING_RUNS,
            FETCHED: types.RECEIVED_RUNS,
            ERROR: types.FETCH_RUNS_ERROR,
        },
        exports.allInfo.status,
    ),
});

export const featuredInfoReducer = combineReducers({
    ids: allFeaturedIds,
    status: getStatusReducer(
        {
            FETCHING: types.FETCHING_FEATURED_RUNS,
            FETCHED: types.RECEIVED_FEATURED_RUNS,
            ERROR: types.FETCH_FEATURED_RUNS_ERROR,
        },
        exports.featuredInfo.status,
    ),
    meta: getMetaReducer(
        {
            FETCHED: types.RECEIVED_FEATURED_RUNS,
        },
        exports.featuredInfo.meta,
    ),
});

export const viewedInfoReducer = combineReducers({
    ids: allViewedIds,
    status: getStatusReducer({
        FETCHING: activityTypes.FETCHING_VIEWED_JOBS,
        FETCHED: activityTypes.RECEIVED_VIEWED_JOBS,
        ERROR: activityTypes.FETCH_VIEWED_JOBS_ERROR,
    }, exports.viewedInfo.status),
    meta: getMetaReducer({
        FETCHED: activityTypes.RECEIVED_VIEWED_JOBS,
    }, exports.viewedInfo.meta),
});

export const ownInfoReducer = combineReducers({
    ids: allOwnIds,
});

export const dataReducer = combineReducers({
    runs: runsById,
    jobs: jobsById,
    provider_tasks: providerTasksById,
    tasks: tasksById,
});

export const runsReducer = combineReducers({
    data: dataReducer,
    orderedIds: orderedIdReducer,
    allInfo: allInfoReducer,
    featuredInfo: featuredInfoReducer,
    ownInfo: ownInfoReducer,
    viewedInfo: viewedInfoReducer,
});

export const initialState = {
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
        status: {
            fetching: false,
            fetched: false,
            error: null,
        },
        ids: [],
    },
};

export function datacartDetailsIdsReducer(state = initialState.datacartDetails.ids, action) {
    switch (action.type) {
        case types.DATACART_DETAILS_RECEIVED:
            return isEqual(state, action.ids) ? state : action.ids;
        case types.DATACART_DETAILS_ERROR:
        case types.CLEAR_DATACART_DETAILS:
            return [];
        default:
            return state;
    }
}

export function datacartDetailsStatusReducer(state = initialState.datacartDetails.status, action) {
    switch (action.type) {
        case types.GETTING_DATACART_DETAILS:
            return {
                fetching: true,
                fetched: false,
                error: null,
            };
        case types.DATACART_DETAILS_RECEIVED:
            return {
                fetching: false,
                fetched: true,
                error: null,
            };
        case types.DATACART_DETAILS_ERROR:
            return {
                fetching: false,
                fetched: false,
                error: action.error,
            };
        case types.CLEAR_DATACART_DETAILS:
            return {
                fetching: false,
                fetched: false,
                error: null,
            };
        default:
            return state;
    }
}

export const getDatacartDetailsReducer = combineReducers({
    status: datacartDetailsStatusReducer,
    ids: datacartDetailsIdsReducer,
});

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
