import { types } from '../actions/usersActions';

export const initialState = {
    users: [],
    fetching: false,
    fetched: false,
    error: null,
    total: 0,
    new: 0,
    ungrouped: 0,
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
