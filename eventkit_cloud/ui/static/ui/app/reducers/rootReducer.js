import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
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
import { getProvidersReducer } from './providerReducer';
import { getFormatsReducer } from './formatReducer';
import { geocodeReducer } from './geocodeReducer';
import {
    dataPackReducer,
    featuredRunsReducer,
    deleteRunReducer,
    updateExpirationReducer,
    getDatacartDetailsReducer,
} from './datapackReducer';
import { importGeomReducer } from './fileReducer';
import { licenseReducer } from './licenseReducer';
import authReducer from './authReducer';
import { userGroupsReducer } from './groupReducer';
import { notificationsReducer } from './notificationsReducer';
import { userActivityReducer } from './userActivityReducer';


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
    runsList: dataPackReducer,
    featuredRunsList: featuredRunsReducer,
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
    userActivity: userActivityReducer,
    notifications: notificationsReducer,
});

export default rootReducer;
