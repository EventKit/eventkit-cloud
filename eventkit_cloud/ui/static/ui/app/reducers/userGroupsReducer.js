import types from '../actions/actionTypes';
import initialState from './initialState';

export function userGroupsReducer(state = initialState.groups, action) {
    switch (action.type) {
    case types.FETCHING_GROUPS:
        return {
            ...state,
            fetching: true,
            fetched: false,
            error: null,
            cancelSource: action.cancelSource,
        };
    case types.FETCHED_GROUPS:
        return {
            ...state,
            fetching: false,
            fetched: true,
            groups: action.groups,
            error: null,
            cancelSource: null,
        };
    case types.FETCH_GROUPS_ERROR:
        return {
            ...state,
            fetching: false,
            fetched: false,
            groups: [],
            error: action.error,
            cancelSource: null,
        };

    case types.DELETING_GROUP:
        return {
            ...state,
            error: null,
            deleting: true,
            deleted: false,
        };
    case types.DELETED_GROUP:
        return { ...state, deleting: false, deleted: true };
    case types.DELETE_GROUP_ERROR:
        return {
            ...state,
            deleted: false,
            deleting: false,
            error: action.error,
        };

    case types.CREATING_GROUP:
        return {
            ...state,
            error: null,
            creating: true,
            created: false,
        };
    case types.CREATED_GROUP:
        return { ...state, creating: false, created: true };
    case types.CREATE_GROUP_ERROR:
        return {
            ...state,
            creating: false,
            created: false,
            error: action.error,
        };

    case types.UPDATING_GROUP:
        return {
            ...state,
            updating: true,
            updated: false,
            error: null,
        };
    case types.UPDATED_GROUP:
        return { ...state, updated: true, updating: false };
    case types.UPDATING_GROUP_ERROR:
        return {
            ...state,
            updating: false,
            updated: false,
            error: action.error,
        };

    default:
        return state;
    }
}
