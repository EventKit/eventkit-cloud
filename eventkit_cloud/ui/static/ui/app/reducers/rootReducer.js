import {combineReducers} from 'redux'
import userReducer from './userReducer'
import { routerReducer } from 'react-router-redux'
import {exportJobsReducer, exportBboxReducer, exportAoiInfoReducer, exportInfoReducer, getProvidersReducer, drawerMenuReducer, stepperReducer, startExportPackageReducer, submitJobReducer, getFormatsReducer} from './exportsReducer';
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
    drawer: drawerMenuReducer,
    runsList: DataPackPageReducer,
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
});

export default rootReducer;
