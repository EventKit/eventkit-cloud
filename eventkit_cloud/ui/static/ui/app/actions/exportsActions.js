import axios from 'axios';
import cookie from 'react-cookie';
import types from './actionTypes';

export function createExportRequest(exportData) {
    return {
        type: types.CREATE_EXPORT_SUCCESS,
        exportInfo: exportData,
    };
}

export function updateAoiInfo(aoiInfo) {
    return {
        type: types.UPDATE_AOI_INFO,
        geojson: aoiInfo.geojson,
        originalGeojson: aoiInfo.originalGeojson,
        geomType: aoiInfo.geomType,
        title: aoiInfo.title,
        description: aoiInfo.description,
        selectionType: aoiInfo.selectionType,
    };
}
export function updateExportInfo(exportInfo) {
    return {
        type: types.UPDATE_EXPORT_INFO,
        exportInfo,
    };
}

export function clearExportInfo() {
    return {
        type: types.CLEAR_EXPORT_INFO,
    }
}

export function stepperNextDisabled() {
    return {
        type: types.MAKE_STEPPER_INACTIVE,
        stepperNextEnabled: false,
    };
}

export function stepperNextEnabled() {
    return {
        type: types.MAKE_STEPPER_ACTIVE,
        stepperNextEnabled: true,
    };
}

export const submitJob = data => (dispatch) => {
    dispatch({
        type: types.SUBMITTING_JOB,
    });

    const csrfmiddlewaretoken = cookie.load('csrftoken');
    return axios({
        url: '/api/jobs',
        method: 'POST',
        contentType: 'application/json; version=1.0',
        data,
        headers: { 'X-CSRFToken': csrfmiddlewaretoken },
    }).then((response) => {
        dispatch({
            type: types.JOB_SUBMITTED_SUCCESS,
            jobuid: response.data.uid,

        });
    }).catch((error) => {
        console.log(error);
        dispatch({
            type: types.JOB_SUBMITTED_ERROR, error,
        });
    });
};

export const getProviders = () => (dispatch) => {
    dispatch({
        type: types.GETTING_PROVIDERS,
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
            providers: response.data,
        });
    }).catch((error) => {
        console.log(error);
    });
};

export const getFormats = () => (dispatch) => {
    dispatch({
        type: types.GETTING_FORMATS,
    });

    return axios({
        url: '/api/formats',
        method: 'GET',
    }).then((response) => {
        dispatch({
            type: types.FORMATS_RECEIVED,
            formats: response.data,
        });
    }).catch((error) => {
        console.log(error);
    });
};

export function clearAoiInfo() {
    return {
        type: types.CLEAR_AOI_INFO,
    };
}

export function clearJobInfo() {
    return {
        type: types.CLEAR_JOB_INFO,
    };
}

// This is probably not the correct way to cancel async actions... but it works.
let closeDrawerTimeout = null;
let openDrawerTimeout = null;

export const closeDrawer = () => (dispatch) => {
    if (openDrawerTimeout !== null) {
        clearTimeout(openDrawerTimeout);
        openDrawerTimeout = null;
    }

    dispatch({
        type: types.CLOSING_DRAWER,
    });

    return new Promise((resolve) => {
        closeDrawerTimeout = setTimeout(() => {
            closeDrawerTimeout = null;
            dispatch({
                type: types.CLOSED_DRAWER,
            });
            resolve();
        }, 450);
    });
};

export const openDrawer = () => (dispatch) => {
    if (closeDrawerTimeout !== null) {
        clearTimeout(closeDrawerTimeout);
        closeDrawerTimeout = null;
    }

    dispatch({
        type: types.OPENING_DRAWER,
    });

    return new Promise((resolve) => {
        openDrawerTimeout = setTimeout(() => {
            openDrawerTimeout = null;
            dispatch({
                type: types.OPENED_DRAWER,
            });
            resolve();
        }, 450);
    });
};
