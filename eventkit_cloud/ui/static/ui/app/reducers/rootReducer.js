import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { userReducer, usersReducer } from './userReducer';
import {
    exportAoiInfoReducer,
    exportInfoReducer,
    getProvidersReducer,
    drawerMenuReducer,
    stepperReducer,
    submitJobReducer,
    getFormatsReducer,
} from './exportsReducer';
import { getGeocodeReducer } from './searchToolbarReducer';
import { dataPackReducer, featuredRunsReducer, DeleteRunsReducer } from './dataPackReducer';
import { importGeomReducer } from './mapToolReducer';
import { licenseReducer } from './licenseReducer';
import authReducer from './authReducer';
import {
    getDatacartDetailsReducer,
    deleteRunReducer,
    rerunExportReducer,
    updateExpirationReducer,
    updatePermissionReducer,
} from './statusDownloadReducer';
import { userGroupsReducer } from './userGroupsReducer';
import { notificationsReducer } from './notificationsReducer';
import { userActivityReducer } from './userActivityReducer';


const rootReducer = combineReducers({
    // short hand property names
    auth: authReducer,
    aoiInfo: exportAoiInfoReducer,
    exportInfo: exportInfoReducer,
    geocode: getGeocodeReducer,
    importGeom: importGeomReducer,
    user: userReducer,
    routing: routerReducer,
    drawer: drawerMenuReducer,
    runsList: dataPackReducer,
    featuredRunsList: featuredRunsReducer,
    providers: getProvidersReducer,
    stepperNextEnabled: stepperReducer,
    submitJob: submitJobReducer,
    runsDeletion: DeleteRunsReducer,
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
