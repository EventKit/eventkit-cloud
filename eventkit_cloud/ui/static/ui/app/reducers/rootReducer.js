import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { types } from '../actions/uiActions';
import { userReducer } from './userReducer';
import { usersSlice } from '../slices/usersSlice';
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
import { getTopicsReducer } from './topicsReducer';

const reducer = combineReducers({
    // short hand property names
    auth: authReducer,
    aoiInfo: exportAoiInfoReducer,
    exportInfo: exportInfoReducer,
    geocode: geocodeReducer,
    importGeom: importGeomReducer,
    user: userReducer,
    router: connectRouter(history),
    drawer: drawerMenuReducer,
    providers: getProvidersReducer,
    stepperNextEnabled: stepperReducer,
    submitJob: submitJobReducer,
    datacartDetails: getDatacartDetailsReducer,
    runDeletion: deleteRunReducer,
    exportReRun: rerunExportReducer,
    licenses: licenseReducer,
    updateExpiration: updateExpirationReducer,
    updatePermission: updatePermissionReducer,
    formats: getFormatsReducer,
    groups: userGroupsReducer,
    users: usersSlice.reducer,
    notifications: notificationsReducer,
    exports: runsReducer,
    providerTasks: providerTasksReducer,
    projections: getProjectionsReducer,
    topics: getTopicsReducer,
});

const rootReducer = (rootState, action) => {
    let state = rootState;
    if (action.type === types.RESET_STATE) {
        state = undefined;
    }

    return reducer(state, action);
};

export default rootReducer;
