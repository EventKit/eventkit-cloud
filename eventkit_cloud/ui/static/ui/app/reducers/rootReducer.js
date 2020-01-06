import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { types } from '../actions/uiActions';
import { userReducer } from './userReducer';
import { usersReducer } from './usersReducer';
import {
    exportAoiInfoReducer,
    exportInfoReducer,
    submitJobReducer,
    updatePermissionReducer,
    rerunExportReducer,
} from './datacartReducer';
import { drawerMenuReducer, stepperReducer } from './uiReducer';
import { getProvidersReducer, providerTasksReducer } from './providerReducer';
import { getFormatsReducer } from './formatReducer';
import { geocodeReducer } from './geocodeReducer';
import {
    deleteRunReducer,
    updateExpirationReducer,
    getDatacartDetailsReducer,
    runsReducer,
} from './datapackReducer';
import { importGeomReducer } from './fileReducer';
import { licenseReducer } from './licenseReducer';
import authReducer from './authReducer';
import { userGroupsReducer } from './groupReducer';
import { notificationsReducer } from './notificationsReducer';
import { getProjectionsReducer } from './projectionReducer';
import history from '../utils/history';

const reducer = combineReducers({
    aoiInfo: exportAoiInfoReducer,
    // short hand property names
    auth: authReducer,
    datacartDetails: getDatacartDetailsReducer,
    drawer: drawerMenuReducer,
    exportInfo: exportInfoReducer,
    exportReRun: rerunExportReducer,
    exports: runsReducer,
    formats: getFormatsReducer,
    geocode: geocodeReducer,
    groups: userGroupsReducer,
    importGeom: importGeomReducer,
    licenses: licenseReducer,
    notifications: notificationsReducer,
    projections: getProjectionsReducer,
    providerTasks: providerTasksReducer,
    providers: getProvidersReducer,
    router: connectRouter(history),
    runDeletion: deleteRunReducer,
    stepperNextEnabled: stepperReducer,
    submitJob: submitJobReducer,
    updateExpiration: updateExpirationReducer,
    updatePermission: updatePermissionReducer,
    user: userReducer,
    users: usersReducer,
});

const rootReducer = (rootState, action) => {
    let state = rootState;
    if (action.type === types.RESET_STATE) {
        state = undefined;
    }

    return reducer(state, action);
};

export default rootReducer;
