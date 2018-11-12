import { types } from '../actions/usersActions';

export const initialState = {
    users: [],
    fetching: null,
    fetched: null,
    error: null,
    total: 0,
    range: '',
    nextPage: false,
};

export function usersReducer(state = initialState, action) {
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
                range: action.range,
                nextPage: action.nextPage,
            };
        case types.FETCH_USERS_ERROR:
            return {
                ...state,
                fetching: false,
                fetched: false,
                error: action.error,
                total: 0,
                range: '',
                nextPage: false,
            };
        default:
            return state;
    }
}
