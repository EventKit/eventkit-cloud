
import { types } from '../actions/datacartActions';

export const initialState = {
    aoiInfo: {
        geojson: {},
        originalGeojson: {},
        geomType: null,
        title: null,
        description: null,
        selectionType: null,
        buffer: 0,
    },
    submitJob: {
        fetching: null,
        fetched: null,
        jobuid: '',
        error: null,
    },
    exportInfo: {
        exportName: '',
        datapackDescription: '',
        projectName: '',
        providers: [],
        areaStr: '',
        formats: ['gpkg'],
    },
    updatePermission: {
        updating: null,
        updated: null,
        error: null,
    },
    exportReRun: {
        fetching: null,
        fetched: null,
        data: [],
        error: null,
    },
};

export function exportAoiInfoReducer(state = initialState.aoiInfo, action) {
    switch (action.type) {
        case types.UPDATE_AOI_INFO:
            return {
                geojson: action.geojson,
                originalGeojson: action.originalGeojson,
                geomType: action.geomType,
                title: action.title,
                description: action.description,
                selectionType: action.selectionType,
                buffer: action.buffer,
            };
        case types.CLEAR_AOI_INFO:
            return {
                geojson: {},
                originalGeojson: {},
                geomType: null,
                title: null,
                description: null,
                selectionType: null,
                buffer: 0,
            };
        default:
            return state;
    }
}

export function exportInfoReducer(state = initialState.exportInfo, action) {
    switch (action.type) {
        case types.UPDATE_EXPORT_INFO:
            return {
                ...state,
                ...action.exportInfo,
            };
        case types.CLEAR_EXPORT_INFO:
            return {
                exportName: '',
                datapackDescription: '',
                projectName: '',
                providers: [],
                areaStr: '',
                formats: ['gpkg'],
            };
        default:
            return state;
    }
}

export function submitJobReducer(state = initialState.submitJob, action) {
    switch (action.type) {
        case types.SUBMITTING_JOB:
            return {
                fetching: true, fetched: false, jobuid: '', error: null,
            };
        case types.JOB_SUBMITTED_SUCCESS:
            return {
                fetching: false, fetched: true, jobuid: action.jobuid, error: null,
            };
        case types.JOB_SUBMITTED_ERROR:
            return {
                fetching: false, fetched: false, jobuid: '', error: action.error,
            };
        case types.CLEAR_JOB_INFO:
            return {
                fetching: false, fetched: false, jobuid: '', error: null,
            };
        default:
            return state;
    }
}

export function updatePermissionReducer(state = initialState.updatePermission, action) {
    switch (action.type) {
        case types.UPDATING_PERMISSION:
            return { updating: true, updated: false, error: null };
        case types.UPDATE_PERMISSION_SUCCESS:
            return { updating: false, updated: true, error: null };
        case types.UPDATE_PERMISSION_ERROR:
            return { updating: false, updated: false, error: action.error };
        default:
            return state;
    }
}

export function rerunExportReducer(state = initialState.exportReRun, action) {
    switch (action.type) {
        case types.RERUNNING_EXPORT:
            return {
                fetching: true, fetched: false, data: '', error: null,
            };
        case types.RERUN_EXPORT_SUCCESS:
            return {
                fetching: false, fetched: true, data: action.exportReRun.data, error: null,
            };
        case types.RERUN_EXPORT_ERROR:
            return {
                fetching: false, fetched: false, data: '', error: action.error,
            };
        case types.CLEAR_RERUN_INFO:
            return {
                fetching: false, fetched: false, data: '', error: null,
            };
        default:
            return state;
    }
}
