import { combineReducers } from 'redux';
import { types } from '../actions/userActions';

export const user = {
    data: null,
    meta: {
        autoLogoutAt: null,
        autoLogoutWarningAt: null,
    },
    status: {
        patched: false,
        patching: false,
        error: null,
        isLoading: false,
    },
};

export const userStatusReducer = (state = user.status, action) => {
    switch (action.type) {
        case types.USER_LOGGING_IN:
            return {
                ...state,
                isLoading: true,
            };
        case types.USER_LOGGED_IN:
            return {
                ...state,
                isLoading: false,
            };
        case types.USER_LOGGED_OUT:
            return {
                ...state,
                ...action.status,
                isLoading: false,

            };
        case types.PATCHING_USER:
            return {
                ...state,
                patching: true,
                patched: false,
            };
        case types.PATCHED_USER:
            return {
                ...state,
                patching: false,
                patched: true,
            };
        case types.PATCHING_USER_ERROR:
            return {
                ...state,
                patching: false,
                error: action.error,
            };
        default:
            return state;
    }
};

export const userMetaReducer = (state = user.meta, action) => {
    switch (action.type) {
        case types.USER_ACTIVE:
            return { ...state, ...action.payload };
        default: return state;
    }
};

export const userDataReducer = (state = user.data, action) => {
    switch (action.type) {
        case types.USER_LOGGED_IN:
            return action.payload;
        case types.USER_LOGGED_OUT:
            return null;
        case types.PATCHED_USER:
            return action.payload;
        default: return state;
    }
};

export const userReducer = combineReducers({
    data: userDataReducer,
    status: userStatusReducer,
    meta: userMetaReducer,
});
