import types from '../actions/mapToolActionTypes';
import initialState from './initialState';

export function importGeomReducer(state = initialState.importGeom, action) {
    switch(action.type) {
        case types.FILE_PROCESSING:
            return {processing: true, processed: false, featureCollection: {}, error: null};
        case types.FILE_PROCESSED:
            return {processing: false, processed: true, featureCollection: action.featureCollection, error: null};
        case types.FILE_ERROR:
            return {processing: false, processed: false, featureCollection: {}, error: action.error};
        case types.FILE_RESET:
            return {processing: false, processed: false, featureCollection: {}, error: null};
        default:
            return state;
    }
}
