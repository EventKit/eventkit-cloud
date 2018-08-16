import types from '../actions/actionTypes';
import initialState from './initialState';

export function dataPackReducer(state = initialState.runsList, action) {
    switch (action.type) {
        case types.FETCHING_RUNS:
            return {
                ...state, fetching: true, fetched: false, error: null, cancelSource: action.cancelSource,
            };
        case types.RECEIVED_RUNS:
            return {
                ...state,
                fetching: false,
                fetched: true,
                runs: action.runs,
                error: null,
                nextPage: action.nextPage,
                range: action.range,
                cancelSource: null,
            };
        case types.FETCH_RUNS_ERROR:
            return {
                ...state, fetching: false, fetched: false, runs: [], error: action.error, cancelSource: null,
            };
        case types.SET_PAGE_ORDER:
            return { ...state, order: action.order };
        case types.SET_PAGE_VIEW:
            return { ...state, view: action.view };
        default:
            return state;
    }
}

export function featuredRunsReducer(state = initialState.featuredRunsList, action) {
    switch (action.type) {
        case types.FETCHING_FEATURED_RUNS:
            return {
                ...state, fetching: true, fetched: false, error: null, cancelSource: action.cancelSource,
            };
        case types.RECEIVED_FEATURED_RUNS:
            return {
                ...state,
                fetching: false,
                fetched: true,
                runs: action.runs,
                error: null,
                nextPage: action.nextPage,
                range: action.range,
                cancelSource: null,
            };
        case types.FETCH_FEATURED_RUNS_ERROR:
            return {
                ...state, fetching: false, fetched: false, runs: [], error: action.error, cancelSource: null,
            };
        default:
            return state;
    }
}

export function DeleteRunsReducer(state = initialState.runsDeletion, action) {
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
