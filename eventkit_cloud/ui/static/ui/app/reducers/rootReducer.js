import {combineReducers} from 'redux'
import { reducer as reduxFormReducer } from 'redux-form'
import userReducer from './userReducer'
import { routerReducer } from 'react-router-redux'
import {exportJobsReducer, exportModeReducer, exportBboxReducer, exportAoiInfoReducer, exportInfoReducer, getProvidersReducer, drawerMenuReducer, stepperReducer, startExportPackageReducer, submitJobReducer} from './exportsReducer';
import {invalidDrawWarningReducer} from './drawToolBarReducer';
import {zoomToSelectionReducer, resetMapReducer} from './AoiInfobarReducer.js';
import {getGeocodeReducer} from './searchToolbarReducer.js';
import {DataPackListReducer, DeleteRunsReducer} from './DataPackListReducer';
import {toolbarIconsReducer, showImportModalReducer, importGeomReducer} from './mapToolReducer';
import {licenseReducer} from './licenseReducer';
import authReducer from './authReducer'
import {getDatacartDetailsReducer, setDatacartDetailsReducer, deleteRunReducer, rerunExportReducer} from './statusDownloadReducer'


const rootReducer = combineReducers({
    // short hand property names
    auth: authReducer,
    mode: exportModeReducer,
    aoiInfo: exportAoiInfoReducer,
    exportInfo: exportInfoReducer,
    zoomToSelection: zoomToSelectionReducer,
    resetMap: resetMapReducer,
    geocode: getGeocodeReducer,
    showInvalidDrawWarning: invalidDrawWarningReducer,
    toolbarIcons: toolbarIconsReducer,
    showImportModal: showImportModalReducer,
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
});

export default rootReducer;
