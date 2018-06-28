import types from '../actions/actionTypes';
import initialState from './initialState';

export function getGeocodeReducer(state = initialState.geocode, action) {
    switch (action.type) {
        case types.FETCHING_GEOCODE:
            return {
                fetching: true,
                fetched: false,
                data: [],
                error: null,
            };
        case types.RECEIVED_GEOCODE:
            return {
                fetching: false,
                fetched: true,
                data: action.data,
                error: null,
            };
        case types.FETCH_GEOCODE_ERROR:
            return {
                fetching: false,
                fetched: false,
                data: [],
                error: action.error,
            };
        default:
            return state;
    }
}

