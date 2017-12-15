
import types from '../actions/actionTypes';
import initialState from './initialState';

export function drawerMenuReducer(state = initialState.drawer, action) {
    switch (action.type) {
    case types.OPENING_DRAWER:
        return 'opening';
    case types.OPENED_DRAWER:
        return 'open';
    case types.CLOSING_DRAWER:
        return 'closing';
    case types.CLOSED_DRAWER:
        return 'closed';
    default:
        return state;
    }
}

export function stepperReducer(state = initialState.stepperNextEnabled, action) {
    switch (action.type) {
    case types.MAKE_STEPPER_ACTIVE:
        return true;
    case types.MAKE_STEPPER_INACTIVE:
        return false;
    default:
        return state;
    }
}

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
        };
    case types.CLEAR_AOI_INFO:
        return {
            geojson: {},
            originalGeojson: {},
            geomType: null,
            title: null,
            description: null,
            selectionType: null,
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
            makePublic: false,
            providers: [],
            areaStr: '',
            layers: '',
        }
    default:
        return state;
    }
}

export function getProvidersReducer(state = initialState.providers, action ) {
    switch (action.type) {
    case types.GETTING_PROVIDERS:
        return [];
    case types.PROVIDERS_RECEIVED:
        return action.providers;
    default:
        return state;
    }
}

export function getFormatsReducer(state = initialState.formats, action ) {
    switch (action.type) {
    case types.GETTING_FORMATS:
        return [];
    case types.FORMATS_RECEIVED:
        return action.formats;
    default:
        return state;
    }
}

export function submitJobReducer(state = initialState.submitJob, action) {
    switch (action.type) {
    case types.SUBMITTING_JOB:
        return { fetching: true, fetched: false, jobuid: '', error: null };
    case types.JOB_SUBMITTED_SUCCESS:
        return { fetching: false, fetched: true, jobuid: action.jobuid, error: null };
    case types.JOB_SUBMITTED_ERROR:
        return { fetching: false, fetched: false, jobuid: '', error: action.error };
    case types.CLEAR_JOB_INFO:
        return { fetching: false, fetched: false, jobuid: '', error: null };
    default:
        return state;
    }
}
