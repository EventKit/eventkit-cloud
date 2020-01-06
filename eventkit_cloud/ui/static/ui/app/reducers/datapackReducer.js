import { combineReducers } from 'redux';
import isEqual from 'lodash/isEqual';
import { types } from '../actions/datapackActions';
import { types as uiTypes } from '../actions/uiActions';
import { types as activityTypes } from '../actions/userActivityActions';

const genericInfo = {
    ids: [],
    meta: {
        nextPage: false,
        order: '',
        range: '',
        view: '',
    },
    status: {
        cancelSource: null,
        error: null,
        fetched: null,
        fetching: null,
    },
};

export const exports = {
    allInfo: { ...genericInfo },
    data: {
        jobs: {},
        provider_tasks: {},
        runs: {},
        tasks: {},
    },
    featuredInfo: { ...genericInfo },
    orderedIds: [],
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
        ERROR: null,
        FETCHED: null,
        FETCHING: null,
        ...inputTypeMap,
    };
    const statusReducer = (state = inputState, action) => {
        switch (action.type) {
            case typeMap.FETCHING:
                return {
                    ...state,
                    cancelSource: action.cancelSource,
                    error: null,
                    fetching: true,
                };
            case typeMap.FETCHED:
                return {
                    cancelSource: null,
                    error: null,
                    fetched: true,
                    fetching: false,
                };
            case typeMap.ERROR:
                return {
                    cancelSource: null,
                    error: action.error,
                    fetched: false,
                    fetching: false,
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
            ERROR: types.FETCH_RUNS_ERROR,
            FETCHED: types.RECEIVED_RUNS,
            FETCHING: types.FETCHING_RUNS,
        },
        exports.allInfo.status,
    ),
});

export const featuredInfoReducer = combineReducers({
    ids: allFeaturedIds,
    meta: getMetaReducer(
        {
            FETCHED: types.RECEIVED_FEATURED_RUNS,
        },
        exports.featuredInfo.meta,
    ),
    status: getStatusReducer(
        {
            ERROR: types.FETCH_FEATURED_RUNS_ERROR,
            FETCHED: types.RECEIVED_FEATURED_RUNS,
            FETCHING: types.FETCHING_FEATURED_RUNS,
        },
        exports.featuredInfo.status,
    ),
});

export const viewedInfoReducer = combineReducers({
    ids: allViewedIds,
    meta: getMetaReducer({
        FETCHED: activityTypes.RECEIVED_VIEWED_JOBS,
    }, exports.viewedInfo.meta),
    status: getStatusReducer({
        ERROR: activityTypes.FETCH_VIEWED_JOBS_ERROR,
        FETCHED: activityTypes.RECEIVED_VIEWED_JOBS,
        FETCHING: activityTypes.FETCHING_VIEWED_JOBS,
    }, exports.viewedInfo.status),
});

export const ownInfoReducer = combineReducers({
    ids: allOwnIds,
});

export const dataReducer = combineReducers({
    jobs: jobsById,
    provider_tasks: providerTasksById,
    runs: runsById,
    tasks: tasksById,
});

export const runsReducer = combineReducers({
    allInfo: allInfoReducer,
    data: dataReducer,
    featuredInfo: featuredInfoReducer,
    orderedIds: orderedIdReducer,
    ownInfo: ownInfoReducer,
    viewedInfo: viewedInfoReducer,
});

export const initialState = {
    datacartDetails: {
        ids: [],
        status: {
            error: null,
            fetched: false,
            fetching: false,
        },
    },
    runDeletion: {
        deleted: false,
        deleting: false,
        error: null,
    },
    updateExpiration: {
        error: null,
        updated: false,
        updating: false,
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
                error: null,
                fetched: false,
                fetching: true,
            };
        case types.DATACART_DETAILS_RECEIVED:
            return {
                error: null,
                fetched: true,
                fetching: false,
            };
        case types.DATACART_DETAILS_ERROR:
            return {
                error: action.error,
                fetched: false,
                fetching: false,
            };
        case types.CLEAR_DATACART_DETAILS:
            return {
                error: null,
                fetched: false,
                fetching: false,
            };
        default:
            return state;
    }
}

export const getDatacartDetailsReducer = combineReducers({
    ids: datacartDetailsIdsReducer,
    status: datacartDetailsStatusReducer,
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
