
export const types = {
    CLEAR_AOI_INFO: 'CLEAR_AOI_INFO',
    CLEAR_EXPORT_INFO: 'CLEAR_EXPORT_INFO',
    CLEAR_JOB_INFO: 'CLEAR_JOB_INFO',
    CLEAR_RERUN_INFO: 'CLEAR_RERUN_INFO',
    JOB_SUBMITTED_ERROR: 'JOB_SUBMITTED_ERROR',
    JOB_SUBMITTED_SUCCESS: 'JOB_SUBMITTED_SUCCESS',
    RERUNNING_EXPORT: 'RERUNNING_EXPORT',
    RERUN_EXPORT_ERROR: 'RERUN_EXPORT_ERROR',
    RERUN_EXPORT_SUCCESS: 'RERUN_EXPORT_SUCCESS',
    SUBMITTING_JOB: 'SUBMITTING_JOB',
    UPDATE_AOI_INFO: 'UPDATE_AOI_INFO',
    UPDATE_EXPORT_INFO: 'UPDATE_EXPORT_INFO',
    UPDATE_EXPORT_OPTIONS: 'UPDATE_EXPORT_OPTIONS',
    UPDATE_PERMISSION_ERROR: 'UPDATE_PERMISSION_ERROR',
    UPDATE_PERMISSION_SUCCESS: 'UPDATE_PERMISSION_SUCCESS',
    UPDATING_PERMISSION: 'UPDATING_PERMISSION',
};

export function updateAoiInfo(aoiInfo) {
    return {
        buffer: aoiInfo.buffer,
        description: aoiInfo.description,
        geojson: aoiInfo.geojson,
        geomType: aoiInfo.geomType,
        originalGeojson: aoiInfo.originalGeojson,
        selectionType: aoiInfo.selectionType,
        title: aoiInfo.title,
        type: types.UPDATE_AOI_INFO,
    };
}

export function updateExportInfo(exportInfo) {
    return {
        exportInfo,
        type: types.UPDATE_EXPORT_INFO,
    };
}

export function updateExportOptions({ providerSlug, providerOptions }) {
    return {
        providerOptions,
        providerSlug,
        type: types.UPDATE_EXPORT_OPTIONS,
    };
}

export function clearExportInfo() {
    return {
        type: types.CLEAR_EXPORT_INFO,
    };
}

export function submitJob(data) {
    return {
        data,
        method: 'POST',
        onSuccess: response => ({ jobuid: response.data.uid }),
        types: [
            types.JOB_SUBMITTED_ERROR,
            types.JOB_SUBMITTED_SUCCESS,
            types.SUBMITTING_JOB,
        ],
        url: '/api/jobs',
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
        data,
        method: 'PATCH',
        types: [
            types.UPDATE_PERMISSION_ERROR,
            types.UPDATE_PERMISSION_SUCCESS,
            types.UPDATING_PERMISSION,
        ],
        url: `/api/jobs/${uid}`,
    };
}

export function rerunExport(jobuid) {
    return {
        method: 'POST',
        onSuccess: response => ({ exportReRun: { data: response.data } }),
        types: [
            types.RERUN_EXPORT_ERROR,
            types.RERUN_EXPORT_SUCCESS,
            types.RERUNNING_EXPORT,
        ],
        url: `/api/jobs/${jobuid}/run`,
    };
}

export function clearReRunInfo() {
    return {
        type: types.CLEAR_RERUN_INFO,
    };
}
