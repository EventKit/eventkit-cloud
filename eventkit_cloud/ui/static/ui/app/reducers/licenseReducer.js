import types from '../actions/actionTypes';
import initialState from './initialState';

export function LicenseReducer(state = initialState.licenses, action) {
    switch(action.type) {
        case types.FETCHING_LICENSES:
            return {...state, fetching: true, fetched: false}
        case types.RECEIVED_LICENSES:
            return {...state, fetching: false, fetched: true, licenses: action.licenses}
        case types.FETCH_LICENSES_ERROR:
            return {...state, error: action.error}
        default:
            return state;
    }
}
