
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
    return {
        types: [
            types.SUBMITTING_JOB,
            types.JOB_SUBMITTED_SUCCESS,
            types.JOB_SUBMITTED_ERROR,
        ],
        url: '/api/jobs',
        method: 'POST',
        data,
        onSuccess: response => ({ jobuid: response.data.uid }),
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
    const data = {
        permissions,
        visibility: permissions.value,
    };

    return {
        types: [
            types.UPDATING_PERMISSION,
            types.UPDATE_PERMISSION_SUCCESS,
            types.UPDATE_PERMISSION_ERROR,
        ],
        url: `/api/jobs/${uid}`,
        method: 'PATCH',
        data,
    };
}

export function rerunExport(jobuid) {
    return {
        types: [
            types.RERUNNING_EXPORT,
            types.RERUN_EXPORT_SUCCESS,
            types.RERUN_EXPORT_ERROR,
        ],
        url: `/api/jobs/${jobuid}/run`,
        method: 'POST',
        onSuccess: response => ({ exportReRun: { data: response.data } }),
    };
}

export function clearReRunInfo() {
    return {
        type: types.CLEAR_RERUN_INFO,
    };
}
