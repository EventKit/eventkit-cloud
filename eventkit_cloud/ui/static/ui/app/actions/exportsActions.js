import axios from 'axios';
import cookie from 'react-cookie';
import types from './actionTypes';

export function updateAoiInfo(aoiInfo) {
    return {
        type: types.UPDATE_AOI_INFO,
        geojson: aoiInfo.geojson,
        originalGeojson: aoiInfo.originalGeojson,
        geomType: aoiInfo.geomType,
        title: aoiInfo.title,
        description: aoiInfo.description,
        selectionType: aoiInfo.selectionType,
        buffer: aoiInfo.buffer,
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
    };
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

export function submitJob(data) {
    return (dispatch) => {
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
            dispatch({
                type: types.JOB_SUBMITTED_ERROR, error: error.response.data,
            });
        });
    };
}

export function getProviders() {
    return (dispatch) => {
        dispatch({
            type: types.GETTING_PROVIDERS,
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
}

export function getFormats() {
    return (dispatch) => {
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
}

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
// We are using a class so that this works in the running application and is test-able
export class DrawerTimeout {
    constructor(closeDrawerTimeout, openDrawerTimeout) {
        this.closeDrawerTimeout = closeDrawerTimeout || null;
        this.openDrawerTimeout = openDrawerTimeout || null;
    }

    closeDrawer() {
        return (dispatch) => {
            if (this.openDrawerTimeout !== null) {
                clearTimeout(this.openDrawerTimeout);
                this.openDrawerTimeout = null;
            }

            dispatch({
                type: types.CLOSING_DRAWER,
            });

            return new Promise((resolve) => {
                this.closeDrawerTimeout = setTimeout(() => {
                    this.closeDrawerTimeout = null;
                    dispatch({
                        type: types.CLOSED_DRAWER,
                    });
                    resolve();
                }, 450);
            });
        };
    }

    openDrawer() {
        return (dispatch) => {
            if (this.closeDrawerTimeout !== null) {
                clearTimeout(this.closeDrawerTimeout);
                this.closeDrawerTimeout = null;
            }

            dispatch({
                type: types.OPENING_DRAWER,
            });

            return new Promise((resolve) => {
                this.openDrawerTimeout = setTimeout(() => {
                    this.openDrawerTimeout = null;
                    dispatch({
                        type: types.OPENED_DRAWER,
                    });
                    resolve();
                }, 450);
            });
        };
    }
}
