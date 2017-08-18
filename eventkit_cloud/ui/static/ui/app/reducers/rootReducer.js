import {combineReducers} from 'redux'
import { reducer as reduxFormReducer } from 'redux-form'
import userReducer from './userReducer'
import { routerReducer } from 'react-router-redux'
import {exportJobsReducer, exportBboxReducer, exportAoiInfoReducer, exportInfoReducer, getProvidersReducer, drawerMenuReducer, stepperReducer, startExportPackageReducer, submitJobReducer} from './exportsReducer';
import {zoomToSelectionReducer, resetMapReducer} from './AoiInfobarReducer.js';
import {getGeocodeReducer} from './searchToolbarReducer.js';
import {DataPackListReducer, DeleteRunsReducer} from './DataPackListReducer';
import {importGeomReducer} from './mapToolReducer';
import {licenseReducer} from './licenseReducer';
import authReducer from './authReducer'
import {getDatacartDetailsReducer, setDatacartDetailsReducer, deleteRunReducer, rerunExportReducer, updateExpirationReducer, updatePermissionReducer} from './statusDownloadReducer'


const rootReducer = combineReducers({
    // short hand property names
    auth: authReducer,
    aoiInfo: exportAoiInfoReducer,
    exportInfo: exportInfoReducer,
    zoomToSelection: zoomToSelectionReducer,
    resetMap: resetMapReducer,
    geocode: getGeocodeReducer,
    importGeom: importGeomReducer,
    form: reduxFormReducer,
    user: userReducer,
    routing: routerReducer,
    drawerOpen: drawerMenuReducer,
    runsList: DataPackListReducer,
    providers: getProvidersReducer,
    stepperNextEnabled: stepperReducer,
    submitJob: submitJobReducer,
    setExportPackageFlag: startExportPackageReducer,
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
