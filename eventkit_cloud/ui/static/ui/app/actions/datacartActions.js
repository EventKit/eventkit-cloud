import axios from 'axios';
import cookie from 'react-cookie';

export const types = {
    UPDATE_AOI_INFO: 'UPDATE_AOI_INFO',
    CLEAR_AOI_INFO: 'CLEAR_AOI_INFO',
    UPDATE_EXPORT_INFO: 'UPDATE_EXPORT_INFO',
    CLEAR_EXPORT_INFO: 'CLEAR_EXPORT_INFO',
    SUBMITTING_JOB: 'SUBMITTING_JOB',
    JOB_SUBMITTED_SUCCESS: 'JOB_SUBMITTED_SUCCESS',
    JOB_SUBMITTED_ERROR: 'JOB_SUBMITTED_ERROR',
    CLEAR_JOB_INFO: 'CLEAR_JOB_INFO',
    UPDATING_PERMISSION: 'UPDATING_PERMISSION',
    UPDATE_PERMISSION_ERROR: 'UPDATE_PERMISSION_ERROR',
    UPDATE_PERMISSION_SUCCESS: 'UPDATE_PERMISSION_SUCCESS',
    RERUNNING_EXPORT: 'RERUNNING_EXPORT',
    RERUN_EXPORT_ERROR: 'RERUN_EXPORT_ERROR',
    RERUN_EXPORT_SUCCESS: 'RERUN_EXPORT_SUCCESS',
    CLEAR_RERUN_INFO: 'CLEAR_RERUN_INFO',
};

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

export function updateDataCartPermissions(uid, permissions) {
    return (dispatch) => {
        dispatch({ type: types.UPDATING_PERMISSION });
        const csrftoken = cookie.load('csrftoken');
        const data = {};
        data.permissions = {
            groups: permissions.groups,
            users: permissions.members,
        };
        data.visibility = permissions.value;

        return axios({
            url: `/api/jobs/${uid}`,
            method: 'PATCH',
            data,
            headers: { 'X-CSRFToken': csrftoken },
        }).then(() => (
            dispatch({ type: types.UPDATE_PERMISSION_SUCCESS })
        )).catch(error => (
            dispatch({ type: types.UPDATE_PERMISSION_ERROR, error: error.response.data })
        ));
    };
}

export const rerunExport = jobuid => (dispatch) => {
    dispatch({
        type: types.RERUNNING_EXPORT,
    });

    const csrfmiddlewaretoken = cookie.load('csrftoken');
    return axios({
        url: `/api/jobs/${jobuid}/run`,
        method: 'POST',
        contentType: 'application/json; version=1.0',
        headers: { 'X-CSRFToken': csrfmiddlewaretoken },
    }).then((response) => {
        dispatch({
            type: types.RERUN_EXPORT_SUCCESS,
            exportReRun: {
                data: response.data,
            },
        });
    }).catch((error) => {
        dispatch({
            type: types.RERUN_EXPORT_ERROR, error: error.response.data,
        });
    });
};

export function clearReRunInfo() {
    return {
        type: types.CLEAR_RERUN_INFO,
    };
}
