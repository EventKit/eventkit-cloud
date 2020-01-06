import { types } from '../actions/usersActions';

export const initialState = {
    cancelSource: null,
    error: null,
    fetched: null,
    fetching: null,
    nextPage: false,
    range: '',
    total: 0,
    users: [],
};

export function usersReducer(state = initialState, action) {
    switch (action.type) {
        case types.FETCHING_USERS:
            return {
                ...state,
                cancelSource: action.cancelSource,
                error: null,
                fetched: false,
                fetching: true,
            };
        case types.FETCHED_USERS:
            return {
                ...state,
                cancelSource: null,
                fetched: true,
                fetching: false,
                nextPage: action.nextPage,
                range: action.range,
                total: action.total,
                users: action.append ? [...state.users, ...action.users] : action.users,
            };
        case types.FETCH_USERS_ERROR:
            return {
                ...state,
                cancelSource: null,
                error: action.error,
                fetched: false,
                fetching: false,
                nextPage: false,
                range: '',
                total: 0,
            };
        case types.CLEAR_USERS:
            return {
                ...initialState,
            };
        default:
            return state;
    }
}
