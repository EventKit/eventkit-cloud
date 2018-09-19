import { types } from '../actions/userActivityActions';

export const initialState = {
    viewedJobs: {
        fetching: false,
        fetched: false,
        viewedJobs: [],
        error: null,
    },
};

export function userActivityReducer(state = initialState, action) {
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
            return initialState;
        default:
            return state;
    }
}
