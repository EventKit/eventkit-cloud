import { combineReducers } from 'redux';
import { types } from '../actions/userActions';

const user = {
    // data: {
    //     accepted_licenses: {},
    //     groups: [],
    //     user: {
    //         commonname: undefined,
    //         date_joined: '',
    //         email: '',
    //         first_name: '',
    //         identification: undefined,
    //         last_login: '',
    //         last_name: '',
    //         username: '',
    //     },

    // },
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

export const initialState = {
    data: null,
    isLoading: false,
    patching: false,
    patched: false,
    error: null,
    autoLogoutAt: null,
    autoLogoutWarningAt: null,
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

export const userrrReducer = combineReducers({
    data: userDataReducer,
    status: userStatusReducer,
    meta: userMetaReducer,
});

export function userReducer(state = initialState, { type, payload, error }) {
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
            return {
                ...state, patching: false, patched: true, data: payload,
            };
        case types.PATCHING_USER_ERROR:
            return { ...state, patching: false, error };
        case types.USER_ACTIVE:
            return { ...state, ...payload };
        default:
            return state;
    }
}
