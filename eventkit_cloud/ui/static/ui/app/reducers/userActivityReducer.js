import initialState from './initialState';
import types from '../actions/actionTypes';

export function userActivityReducer(state = initialState.userActivity, action) {
    switch (action.type) {
        case types.FETCHING_VIEWED_JOBS:
            return {
                ...state,
                viewedJobs: {
                    ...state.viewedJobs,
                    fetching: true,
                    fetched: false,
                    error: null,
                    cancelSource: action.cancelSource
                }
            };
        case types.RECEIVED_VIEWED_JOBS:
            return {
                ...state,
                viewedJobs: {
                    ...state.viewedJobs,
                    fetching: false,
                    fetched: true,
                    jobs: action.payload,
                    nextPage: action.nextPage,
                    range: action.range,
                    error: action.error,
                    cancelSource: null
                }
            };
        case types.FETCH_VIEWED_JOBS_ERROR:
            return {
                ...state,
                viewedJobs: {
                    ...state.viewedJobs,
                    fetching: false,
                    fetched: false,
                    jobs: [],
                    error: action.error,
                    cancelSource: null
                }
            };
        default:
            return state;
    }
}