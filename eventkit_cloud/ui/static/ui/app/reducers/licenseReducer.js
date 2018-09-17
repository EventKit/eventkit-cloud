import { types } from '../actions/licenseActions';

export const initialState = {
    fetching: false,
    fetched: false,
    licenses: [],
    error: null,
};

export function licenseReducer(state = initialState, action) {
    switch (action.type) {
        case types.FETCHING_LICENSES:
            return { ...state, fetching: true, fetched: false };
        case types.RECEIVED_LICENSES:
            return {
                ...state, fetching: false, fetched: true, licenses: action.licenses,
            };
        case types.FETCH_LICENSES_ERROR:
            return { ...state, fetching: false, error: action.error };
        default:
            return state;
    }
}
