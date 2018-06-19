import types from '../actions/mapToolActionTypes';
import initialState from './initialState';

export function importGeomReducer(state = initialState.importGeom, action) {
    switch (action.type) {
        case types.FILE_PROCESSING:
            return {
                ...state, processing: true, processed: false, featureCollection: {}, error: null, filename: action.filename,
            };
        case types.FILE_PROCESSED:
            return {
                ...state, processing: false, processed: true, featureCollection: action.featureCollection,
            };
        case types.FILE_ERROR:
            return {
                processing: false, processed: false, featureCollection: {}, error: action.error, filename: '',
            };
        case types.FILE_RESET:
            return {
                processing: false, processed: false, featureCollection: {}, error: null, filename: '',
            };
        default:
            return state;
    }
}
