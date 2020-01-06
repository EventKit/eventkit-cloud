import { types } from '../actions/groupActions';

export const initialState = {
    cancelSource: null,
    created: null,
    creating: null,
    deleted: null,
    deleting: null,
    error: null,
    fetched: null,
    fetching: null,
    groups: [],
    nextPage: false,
    range: '',
    total: 0,
    updated: null,
    updating: null,
};

export function userGroupsReducer(state = initialState, action) {
    switch (action.type) {
        case types.FETCHING_GROUPS:
            return {
                ...state,
                cancelSource: action.cancelSource,
                error: null,
                fetched: false,
                fetching: true,
            };
        case types.FETCHED_GROUPS:
            return {
                ...state,
                cancelSource: null,
                error: null,
                fetched: true,
                fetching: false,
                groups: action.append ? [...state.groups, ...action.groups] : action.groups,
                nextPage: action.nextPage,
                range: action.range,
                total: action.total,
            };
        case types.FETCH_GROUPS_ERROR:
            return {
                ...state,
                cancelSource: null,
                error: action.error,
                fetched: false,
                fetching: false,
                groups: [],
                nextPage: false,
                range: '',
                total: 0,
            };

        case types.DELETING_GROUP:
            return {
                ...state,
                deleted: false,
                deleting: true,
                error: null,
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
                created: false,
                creating: true,
                error: null,
            };
        case types.CREATED_GROUP:
            return { ...state, creating: false, created: true };
        case types.CREATE_GROUP_ERROR:
            return {
                ...state,
                created: false,
                creating: false,
                error: action.error,
            };

        case types.UPDATING_GROUP:
            return {
                ...state,
                error: null,
                updated: false,
                updating: true,
            };
        case types.UPDATED_GROUP:
            return { ...state, updated: true, updating: false };
        case types.UPDATING_GROUP_ERROR:
            return {
                ...state,
                error: action.error,
                updated: false,
                updating: false,
            };

        default:
            return state;
    }
}
