import { types } from '../actions/fileActions';

export const initialState = {
    error: null,
    featureCollection: {},
    filename: '',
    processed: false,
    processing: false,
};

export function importGeomReducer(state = initialState, action) {
    switch (action.type) {
        case types.FILE_PROCESSING:
            return {
                ...state,
                error: null,
                featureCollection: {},
                filename: action.filename,
                processed: false,
                processing: true,
            };
        case types.FILE_PROCESSED:
            return {
                ...state,
                featureCollection: action.featureCollection,
                processed: true,
                processing: false,
            };
        case types.FILE_ERROR:
            return {
                error: action.error,
                featureCollection: {},
                filename: '',
                processed: false,
                processing: false,
            };
        case types.FILE_RESET:
            return {
                error: null,
                featureCollection: {},
                filename: '',
                processed: false,
                processing: false,
            };
        default:
            return state;
    }
}
