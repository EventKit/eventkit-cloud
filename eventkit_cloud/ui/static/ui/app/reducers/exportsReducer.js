
import types from '../actions/actionTypes';
import initialState from './initialState';

export function drawerMenuReducer(state = initialState.drawerOpen, action) {
    switch(action.type) {
        case types.OPEN_DRAWER:
            return true;
        case types.CLOSE_DRAWER:
            return false;
        default:
            return state;
    }
}

export function stepperReducer(state = initialState.stepperNextEnabled, action) {
    switch(action.type) {
        case types.MAKE_STEPPER_ACTIVE:
            return true;
        case types.MAKE_STEPPER_INACTIVE:
            return false;
        default:
            return state;
    }
}

export function startExportPackageReducer(state = initialState.setExportPackageFlag, action) {
    switch(action.type) {
        case types.EXPORT_INFO_DONE:
            return true;
        default:
            return state;
    }
}

export function exportJobsReducer(state = initialState.jobs, action) {
    switch(action.type) {
        case types.LOAD_JOBS_SUCCESS:
            return action.jobs;
        default:
            return state;
    }
}

export function exportModeReducer(state = initialState.mode, action) {
    switch(action.type) {
        case types.SET_MODE:
            return action.mode;
        default:
            return state;
    }
}

export function exportBboxReducer(state = initialState.bbox, action) {
    switch(action.type) {
        case types.UPDATE_BBOX:
            return action.bbox;
        default:
            return state;
    }
}

export function exportAoiInfoReducer(state = initialState.aoiInfo, action) {
    switch(action.type) {
        case types.UPDATE_AOI_INFO:
            return {
                geojson: action.geojson,
                geomType: action.geomType,
                title: action.title,
                description: action.description,
            };
        case types.CLEAR_AOI_INFO:
            return {
                geojson: {},
                geomType: null,
                title: null,
                description: null,
            };
        default:
            return state;
    }
}

export function exportInfoReducer(state = initialState.exportInfo, action) {
    switch(action.type) {
        case types.UPDATE_EXPORT_INFO:
            return {
                exportName: action.exportName,
                datapackDescription: action.datapackDescription,
                projectName: action.projectName,
                makePublic: action.makePublic,
                providers: action.providers,
                area_str: action.area_str,
                layers: action.layers,
            };
        default:
            return state;
    }
}

export function getProvidersReducer(state = initialState.providers, action ) {
    console.log(state, action);
    switch (action.type) {
        case types.GETTING_PROVIDERS:
            return  []
        case types.PROVIDERS_RECEIVED:
            return action.providers
        default:
            return state
    }
}
