import types from '../actions/actionTypes';
import initialState from './initialState';

export function DataPackListReducer(state = initialState.runsList, action) {
    switch(action.type) {
        case types.FETCHING_RUNS:
            return {...state, fetching: true, fetched: false, error: null}
        case types.RECEIVED_RUNS:
            return {...state, fetching: false, fetched: true, runs: action.runs, error: null, nextPage: action.nextPage, range: action.range}
        case types.FETCH_RUNS_ERROR:
            return {...state, fetching: false, fetched: false, runs: [], error: action.error};
        default:
            return state;
    }
}

export function DeleteRunsReducer(state = initialState.runsDeletion, action) {
    switch(action.type) {
        case types.DELETING_RUN:
            return {deleting: true, deleted: false, error: null}
        case types.DELETED_RUN:
            return {deleting: false, deleted: true, error: null}
        case types.DELETE_RUN_ERROR: 
            return {deleting: false, deleted: false, error: action.error}
        default:
            return state;
    }
}
