import {Config} from '../config';
import actions from './actionTypes';
import ExportApi from '../api/exportsApi';

export function loadJobsSuccess(jobs) {
    return {
        type: actions.LOAD_JOBS_SUCCESS,
        jobs};
}

export function updateBbox(bbox) {
    return {
        type: actions.UPDATE_BBOX,
        bbox: bbox || null
    }
}

export function updateGeojson(geojson) {
    return {
        type: actions.UPDATE_GEOJSON,
        geojson: geojson
    }
}

export function updateMode(mode) {
    return {
        type: actions.SET_MODE,
        mode: mode
    }
}

export function loadExports() {
    // make async call to api, handle promise, dispatch action when promise is resolved
    return function(dispatch) {
        return ExportApi.getAllJobs().then(jobs => {
            dispatch(loadJobsSuccess(jobs));
        }).catch(error => {
            throw(error);
        });
    };
}

export function setAOI() {
    return {
        type: actions.SET_AOI,
        isAOISet: true
    }
}

export function unsetAOI() {
    return {
        type: actions.UNSET_AOI,
        isAOISet: false,
    }
}


