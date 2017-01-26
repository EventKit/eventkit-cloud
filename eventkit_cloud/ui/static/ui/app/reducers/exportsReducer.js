
import * as types from '../actions/actionTypes';
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

export function exportGeojsonReducer(state = initialState.geojson, action) {
    switch(action.type) {
        case types.UPDATE_GEOJSON:
            return action.geojson;
        default:
            return state;
    }
}

export function exportSetAOIReducer(state = initialState.isAOISet, action) {
    switch(action.type) {
        case types.SET_AOI:
            return true;
        case types.UNSET_AOI:
            return false;
        default:
            return state;
    }
}
