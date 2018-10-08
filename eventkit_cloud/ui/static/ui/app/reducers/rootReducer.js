import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { userReducer, userrrReducer } from './userReducer';
import { usersReducer } from './usersReducer';
import {
    exportAoiInfoReducer,
    exportInfoReducer,
    submitJobReducer,
    updatePermissionReducer,
    rerunExportReducer,
} from './datacartReducer';
import { drawerMenuReducer, stepperReducer } from './uiReducer';
import { getProvidersReducer } from './providerReducer';
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

const rootReducer = combineReducers({
    // short hand property names
    auth: authReducer,
    aoiInfo: exportAoiInfoReducer,
    exportInfo: exportInfoReducer,
    geocode: geocodeReducer,
    importGeom: importGeomReducer,
    user: userReducer,
    routing: routerReducer,
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
    users: usersReducer,
    notifications: notificationsReducer,
    exports: runsReducer,
    userrr: userrrReducer,
});

export default rootReducer;
