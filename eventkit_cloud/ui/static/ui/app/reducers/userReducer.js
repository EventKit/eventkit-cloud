import types from '../actions/actionTypes';

export const userState = {
    data: null,
    isLoading: false,
    patching: false,
    patched: false,
    error: null,
    autoLogoutAt: null,
    autoLogoutWarningAt: null,
};

export function userReducer(state = userState, { type, payload, error }) {
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
        return { ...state, ...payload };
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
    new: 0,
    ungrouped: 0,
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
            total: action.total,
            new: action.new,
            ungrouped: action.ungrouped,
        };
    case types.FETCH_USERS_ERROR:
        return {
            ...state,
            fetching: false,
            fetched: false,
            error: action.error,
            total: 0,
            new: 0,
            ungrouped: 0,
        };
    default:
        return state;
    }
}
