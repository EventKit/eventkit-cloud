import { types } from '../actions/datapackActions';
import { types as uiTypes } from '../actions/uiActions';

export const initialState = {
    runsList: {
        fetching: false,
        fetched: false,
        runs: [],
        error: null,
        nextPage: false,
        range: '',
        order: '',
        view: '',
        cancelSource: null,
    },
    featuredRunsList: {
        fetching: false,
        fetched: false,
        runs: [],
        error: null,
        nextPage: false,
        range: '',
        cancelSource: null,
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
        case uiTypes.SET_PAGE_ORDER:
            return { ...state, order: action.order };
        case uiTypes.SET_PAGE_VIEW:
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
