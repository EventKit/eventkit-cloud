import { types } from '../actions/datacartActions';

export const initialState = {
    aoiInfo: {
        buffer: 0,
        description: null,
        geojson: {},
        geomType: null,
        originalGeojson: {},
        selectionType: null,
        title: null,
    },
    exportInfo: {
        areaStr: '',
        datapackDescription: '',
        exportName: '',
        exportOptions: {},
        formats: ['gpkg'],
        projectName: '',
        projections: [],
        providerEstimates: {},
        providers: [],
    },
    exportReRun: {
        data: [],
        error: null,
        fetched: null,
        fetching: null,
    },
    submitJob: {
        error: null,
        fetched: null,
        fetching: null,
        jobuid: '',
    },
    updatePermission: {
        error: null,
        updated: null,
        updating: null,
    },
};

export function exportAoiInfoReducer(state = initialState.aoiInfo, action) {
    switch (action.type) {
        case types.UPDATE_AOI_INFO:
            return {
                buffer: action.buffer,
                description: action.description,
                geojson: action.geojson,
                geomType: action.geomType,
                originalGeojson: action.originalGeojson,
                selectionType: action.selectionType,
                title: action.title,
            };
        case types.CLEAR_AOI_INFO:
            return {
                buffer: 0,
                description: null,
                geojson: {},
                geomType: null,
                originalGeojson: {},
                selectionType: null,
                title: null,
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
        case types.UPDATE_EXPORT_OPTIONS:
            return {
                ...state,
                exportOptions: {
                    ...state.exportOptions,
                    [action.providerSlug]: {
                        ...action.providerOptions,
                    },
                },
            };
        case types.CLEAR_EXPORT_INFO:
            return {
                areaStr: '',
                datapackDescription: '',
                exportName: '',
                exportOptions: {},
                formats: ['gpkg'],
                projectName: '',
                projections: [],
                providerEstimates: {},
                providers: [],
            };
        default:
            return state;
    }
}

export function submitJobReducer(state = initialState.submitJob, action) {
    switch (action.type) {
        case types.SUBMITTING_JOB:
            return {
                error: null,
                fetched: false,
                fetching: true,
                jobuid: '',
            };
        case types.JOB_SUBMITTED_SUCCESS:
            return {
                error: null,
                fetched: true,
                fetching: false,
                jobuid: action.jobuid,
            };
        case types.JOB_SUBMITTED_ERROR:
            return {
                error: action.error,
                fetched: false,
                fetching: false,
                jobuid: '',
            };
        case types.CLEAR_JOB_INFO:
            return {
                error: null,
                fetched: false,
                fetching: false,
                jobuid: '',
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
                data: '',
                error: null,
                fetched: false,
                fetching: true,
            };
        case types.RERUN_EXPORT_SUCCESS:
            return {
                data: action.exportReRun.data,
                error: null,
                fetched: true,
                fetching: false,
            };
        case types.RERUN_EXPORT_ERROR:
            return {
                data: '',
                error: action.error,
                fetched: false,
                fetching: false,
            };
        case types.CLEAR_RERUN_INFO:
            return {
                data: '',
                error: null,
                fetched: false,
                fetching: false,
            };
        default:
            return state;
    }
}
