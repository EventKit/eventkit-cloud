import types from '../actions/actionTypes';

export const userState = {
  data: null,
  isLoading: false,
  patching: false,
  patched: false,
  error: null,
  autoLogoutAt: null,
  autoLogoutWarningAt: null,
  viewedJobs: {
    fetching: false,
    fetched: false,
    jobs: [],
    error: null,
  },
}

export function userReducer(state = userState, { type, payload, error, cancelSource, nextPage, range }) {
  switch (type) {
    case types.USER_LOGGING_IN:
        return { ...state, isLoading: true };
    case types.USER_LOGGED_IN:
        if (payload) {
            return { ...state, data: payload, isLoading: false };
        }
        return { ...state, data: null, isLoading: false };
    case types.USER_LOGGED_OUT:
        return { ...state, data: null, isLoading: false };
    case types.PATCHING_USER:
        return { ...state, patching: true, patched: false };
    case types.PATCHED_USER:
        return { ...state, patching: false, patched: true, data: payload };
    case types.PATCHING_USER_ERROR:
        return { ...state, patching: false, error };
    case types.USER_ACTIVE:
        return { ...state, ...payload }
    case types.FETCHING_VIEWED_JOBS:
        return { ...state, viewedJobs: { ...state.viewedJobs, fetching: true, fetched: false, error: null, cancelSource: cancelSource } };
    case types.RECEIVED_VIEWED_JOBS:
        return { ...state, viewedJobs: { ...state.viewedJobs, fetching: false, fetched: true, jobs: payload, nextPage, range, error, cancelSource: null } };
    case types.FETCH_VIEWED_JOBS_ERROR:
        return { ...state, viewedJobs: { ...state.viewedJobs, fetching: false, fetched: false, jobs: [], error, cancelSource: null } };
    default:
        return state;
    }
}

export const usersState = {
    users: [],
    fetching: false,
    fetched: false,
    error: null,
    total: 0,
};

export function usersReducer(state = usersState, action) {
    switch (action.type) {
    case types.FETCHING_USERS:
        return {
            ...state,
            error: null,
            fetching: true,
            fetched: false,
        };
    case types.FETCHED_USERS:
        return {
            ...state,
            fetching: false,
            fetched: true,
            users: action.users,
            total: state.total || action.users.length,
        };
    case types.FETCH_USERS_ERROR:
        return {
            ...state,
            fetching: false,
            fetched: false,
            error: action.error,
            total: 0,
        };
    default:
        return state;
    }
}
