import { types } from '../actions/licenseActions';

export const initialState = {
    error: null,
    fetched: null,
    fetching: null,
    licenses: [],
};

export function licenseReducer(state = initialState, action) {
    switch (action.type) {
        case types.FETCHING_LICENSES:
            return { ...state, fetching: true, fetched: false };
        case types.RECEIVED_LICENSES:
            return {
                ...state,
                fetched: true,
                fetching: false,
                licenses: action.licenses,
            };
        case types.FETCH_LICENSES_ERROR:
            return { ...state, fetching: false, error: action.error };
        default:
            return state;
    }
}
