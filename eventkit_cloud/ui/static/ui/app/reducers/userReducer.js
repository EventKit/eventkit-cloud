import { combineReducers } from 'redux';
import { types } from '../actions/userActions';

export const user = {
    data: null,
    meta: {
        autoLogoutAt: null,
        autoLogoutWarningAt: null,
    },
    status: {
        error: null,
        isLoading: false,
        patched: false,
        patching: false,
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
                patched: false,
                patching: true,
            };
        case types.PATCHED_USER:
            return {
                ...state,
                patched: true,
                patching: false,
            };
        case types.PATCHING_USER_ERROR:
            return {
                ...state,
                error: action.error,
                patching: false,
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
    meta: userMetaReducer,
    status: userStatusReducer,
});
