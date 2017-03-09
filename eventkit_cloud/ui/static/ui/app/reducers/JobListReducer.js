import types from '../actions/actionTypes';
import initialState from './initialState';

export function jobListReducer(state = initialState.jobsList, action) {
    switch(action.type) {
        case types.FETCHING_JOBS:
            return {fetching: true, fetched: false, jobs: [], error: null}
        case types.RECEIVED_JOBS:
            return {fetching: false, fetched: true, jobs: action.jobs, error: null}
        case types.FETCH_JOBS_ERROR:
            return {fetching: false, fetched: false, jobs: [], error: action.error};
        default:
            return state;
    }
}
