import types from '../actions/actionTypes';
import initialState from './initialState';

export function getDatacartDetailsReducer(state = initialState.datacartDetails, action) {
    switch(action.type) {
        case types.GETTING_DATACART_DETAILS:
            return {fetching: true, fetched: false, data: [], error: null};
        case types.DATACART_DETAILS_RECEIVED:
            return {fetching: false, fetched: true, data: action.datacartDetails.data};
        case types.DATACART_DETAILS_ERROR:
            return {fetching: false, fetched: false, data: [], error: action.error};
        default:
            return state;
    }
}

export function setDatacartDetailsReducer(state = initialState.datacartDetailsReceived, action){
    switch(action.type) {
        case types.DATACART_DETAILS_RECEIVED_FLAG:
            return true;
        default:
            return state;
    }
}
