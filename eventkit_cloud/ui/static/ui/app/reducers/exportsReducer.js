
import types from '../actions/actionTypes';
import initialState from './initialState';

export function exportJobsReducer(state = initialState.jobs, action) {
    switch(action.type) {
        case types.LOAD_JOBS_SUCCESS:
            return action.jobs;
        default:
            return state;
    }
}

export function exportModeReducer(state = initialState.mode, action) {
    switch(action.type) {
        case types.SET_MODE:
            return action.mode;
        default:
            return state;
    }
}

export function exportBboxReducer(state = initialState.bbox, action) {
    switch(action.type) {
        case types.UPDATE_BBOX:
            return action.bbox;
        default:
            return state;
    }
}

export function exportAoiInfoReducer(state = initialState.aoiInfo, action) {
    switch(action.type) {
        case types.UPDATE_AOI_INFO:
            return {
                geojson: action.geojson,
                geomType: action.geomType,
                title: action.title,
                description: action.description,
            };
        case types.CLEAR_AOI_INFO:
            return {
                geojson: {},
                geomType: null,
                title: null,
                description: null,
            };
        default:
            return state;
    }
}
