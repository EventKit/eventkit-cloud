import types from '../actions/actionTypes';
import initialState from './initialState';

export function DataPackListReducer(state = initialState.runsList, action) {
    switch(action.type) {
        case types.FETCHING_RUNS:
            return {fetching: true, fetched: false, runs: [], error: null}
        case types.RECEIVED_RUNS:
            return {fetching: false, fetched: true, runs: action.runs, error: null}
        case types.FETCH_RUNS_ERROR:
            return {fetching: false, fetched: false, runs: [], error: action.error};
        default:
            return state;
    }
}
