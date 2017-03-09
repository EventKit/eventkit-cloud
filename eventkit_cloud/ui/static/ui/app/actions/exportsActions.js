import {Config} from '../config';
import types from './actionTypes';
import ExportApi from '../api/exportsApi';
import axios from 'axios'


export function createExportRequest(exportData) {
    return {
        type: types.CREATE_EXPORT_SUCCESS,
        exportInfo: exportData
    }
}

export function exportInfoDone() {
    return {
        type: types.EXPORT_INFO_DONE,
        setExportPackageFlag: true
    }
}
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

export function updateAoiInfo(geojson, geomType, title, description,) {
    return {
        type: types.UPDATE_AOI_INFO,
        geojson: geojson,
        geomType,
        title,
        description,
    }
}
export function updateExportInfo(exportName, datapackDescription, projectName, makePublic, providers, area_str, layers) {
    return {
        type: types.UPDATE_EXPORT_INFO,
        exportName : exportName,
        datapackDescription,
        projectName,
        makePublic,
        providers,
        area_str,
        layers,
    }
}

export function stepperNextDisabled() {
    return {
        type: types.MAKE_STEPPER_INACTIVE,
        stepperNextEnabled: false
    }
}

export function stepperNextEnabled() {
    return {
        type: types.MAKE_STEPPER_ACTIVE,
        stepperNextEnabled: true
    }
}

export const getProviders = () => dispatch => {
    dispatch({
        type: types.GETTING_PROVIDERS
    });

    axios.get('/api/providers').catch((error) => {
        console.log(error);
    });

    return axios({
        url: '/api/providers',
        method: 'GET',
    }).then((response) => {
        dispatch({
            type: types.PROVIDERS_RECEIVED,
            providers: response.data
        });
    }).catch((error) => {
        console.log(error);
    });
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


