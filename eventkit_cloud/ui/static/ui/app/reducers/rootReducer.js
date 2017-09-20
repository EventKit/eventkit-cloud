import {combineReducers} from 'redux'
import userReducer from './userReducer'
import { routerReducer } from 'react-router-redux'
import {exportJobsReducer, exportBboxReducer, exportAoiInfoReducer, exportInfoReducer, getProvidersReducer, drawerMenuReducer, stepperReducer, startExportPackageReducer, submitJobReducer} from './exportsReducer';
import {getGeocodeReducer} from './searchToolbarReducer.js';
import {DataPackPageReducer, DeleteRunsReducer} from './DataPackPageReducer';
import {importGeomReducer} from './mapToolReducer';
import {licenseReducer} from './licenseReducer';
import authReducer from './authReducer'
import {getDatacartDetailsReducer, setDatacartDetailsReducer, deleteRunReducer, rerunExportReducer, updateExpirationReducer, updatePermissionReducer} from './statusDownloadReducer'


const rootReducer = combineReducers({
    // short hand property names
    auth: authReducer,
    aoiInfo: exportAoiInfoReducer,
    exportInfo: exportInfoReducer,
    geocode: getGeocodeReducer,
    importGeom: importGeomReducer,
    user: userReducer,
    routing: routerReducer,
    drawerOpen: drawerMenuReducer,
    runsList: DataPackPageReducer,
    providers: getProvidersReducer,
    stepperNextEnabled: stepperReducer,
    submitJob: submitJobReducer,
    runsDeletion: DeleteRunsReducer,
    datacartDetails: getDatacartDetailsReducer,
    datacartDetailsReceived: setDatacartDetailsReducer,
    runDeletion: deleteRunReducer,
    exportReRun: rerunExportReducer,
    licenses: licenseReducer,
    updateExpiration: updateExpirationReducer,
    updatePermission: updatePermissionReducer,
});

export default rootReducer;
