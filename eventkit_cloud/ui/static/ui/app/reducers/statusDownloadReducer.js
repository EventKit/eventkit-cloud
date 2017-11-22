import types from '../actions/actionTypes';
import initialState from './initialState';

export function getDatacartDetailsReducer(state = initialState.datacartDetails, action) {
    switch(action.type) {
        case types.GETTING_DATACART_DETAILS:
            return {fetching: true, fetched: false, data: [], error: null};
        case types.DATACART_DETAILS_RECEIVED:
            return {fetching: false, fetched: true, data: action.datacartDetails.data, error: null};
        case types.DATACART_DETAILS_ERROR:
            return {fetching: false, fetched: false, data: [], error: action.error};
        default:
            return state;
    }
}

export function deleteRunReducer(state = initialState.runDeletion, action) {
    switch(action.type) {
        case types.DELETING_RUN:
            return {deleting: true, deleted: false, error: null}
        case types.DELETED_RUN:
            return {deleting: false, deleted: true, error: null}
        case types.DELETE_RUN_ERROR:
            return {deleting: false, deleted: false, error: action.error}
        default:
            return state;
    }
}

export function rerunExportReducer(state = initialState.exportReRun, action) {
    switch(action.type) {
        case types.RERUNNING_EXPORT:
            return {fetching: true, fetched: false, data: '', error: null};
        case types.RERUN_EXPORT_SUCCESS:
            return {fetching: false, fetched: true, data: action.exportReRun.data, error: null};
        case types.RERUN_EXPORT_ERROR:
            return {fetching: false, fetched: false, data: '', error: action.error};
        case types.CLEAR_RERUN_INFO:
            return {fetching: false, fetched: false, data: '', error: null};
        default:
            return state;
    }
}
export function cancelProviderTask(state = initialState.cancelProviderTask, action) {
    switch(action.type) {
        case types.CANCELING_PROVIDER_TASK:
            return {canceling: true, canceled: false, error: null}
        case types.CANCELED_PROVIDER_TASK:
            return {canceling: false, canceled: true, error: null}
        case types.CANCEL_PROVIDER_TASK_ERROR:
            return {canceling: false, canceled: false, error: action.error}
        default:
            return state;
    }
}

export function updateExpirationReducer(state = initialState.updateExpiration, action) {
    switch(action.type) {
        case types.UPDATING_EXPIRATION:
            return {updating: true, updated: false, error: null};
        case types.UPDATE_EXPIRATION_SUCCESS:
            return {updating: false, updated: true, error: null};
        case types.UPDATE_EXPIRATION_ERROR:
            return {updating: false, updated: false, error: action.error};
        default:
            return state;
    }
}
export function updatePermissionReducer(state = initialState.updatePermission, action) {
    switch(action.type) {
        case types.UPDATING_PERMISSION:
            return {updating: true, updated: false, error: null};
        case types.UPDATE_PERMISSION_SUCCESS:
            return {updating: false, updated: true, error: null};
        case types.UPDATE_PERMISSION_ERROR:
            return {updating: false, updated: false, error: action.error};
        default:
            return state;
    }
}