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
                    cancelSource: action.cancelSource,
                },
            };
        case types.RECEIVED_VIEWED_JOBS:
            return {
                ...state,
                viewedJobs: {
                    ...state.viewedJobs,
                    fetching: false,
                    fetched: true,
                    viewedJobs: action.viewedJobs,
                    nextPage: action.nextPage,
                    range: action.range,
                    error: action.error,
                    cancelSource: null,
                },
            };
        case types.FETCH_VIEWED_JOBS_ERROR:
            return {
                ...state,
                viewedJobs: {
                    ...state.viewedJobs,
                    fetching: false,
                    fetched: false,
                    error: action.error,
                    cancelSource: null,
                },
            };
        case types.USER_LOGGED_OUT:
            return initialState.userActivity;
        default:
            return state;
    }
}
