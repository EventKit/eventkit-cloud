import {Config} from '../config';
import types from './actionTypes';
import ExportApi from '../api/exportsApi';

export function loadJobsSuccess(jobs) {
    return {
        type: types.LOAD_JOBS_SUCCESS,
        jobs};
}

export function updateBbox(bbox) {
    return {
        type: types.UPDATE_BBOX,
        bbox: bbox || null
    }
}

export function updateAoiInfo(geojson, geomType, title, description) {
    return {
        type: types.UPDATE_AOI_INFO,
        geojson: geojson,
        geomType,
        title,
        description,
    }
}

export function clearAoiInfo() {
    return {
        type: types.CLEAR_AOI_INFO,
    }
}

export function updateMode(mode) {
    return {
        type: types.SET_MODE,
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
    }
}

export function closeDrawer() {
    return {
        type: types.CLOSE_DRAWER
    }
}

export function openDrawer() {
    return {
        type: types.OPEN_DRAWER
    }
}



