import { types } from '../actions/geocodeActions';

export const initialState = {
    cancelSource: null,
    data: [],
    error: null,
    fetched: null,
    fetching: null,
};

export function geocodeReducer(state = initialState, action) {
    switch (action.type) {
        case types.FETCHING_GEOCODE:
            return {
                cancelSource: action.cancelSource,
                data: [],
                error: null,
                fetched: false,
                fetching: true,
            };
        case types.RECEIVED_GEOCODE:
            return {
                cancelSource: null,
                data: action.data,
                error: null,
                fetched: true,
                fetching: false,
            };
        case types.FETCH_GEOCODE_ERROR:
            return {
                cancelSource: null,
                data: [],
                error: action.error,
                fetched: false,
                fetching: false,
            };
        default:
            return state;
    }
}
