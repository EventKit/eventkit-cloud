import {combineReducers} from 'redux'
import { reducer as reduxFormReducer } from 'redux-form'
import {exportJobsReducer, exportModeReducer, exportBboxReducer, exportGeojsonReducer, exportSetAOIReducer} from './exportsReducer'
import {drawExtensionReducer, drawCancelReducer, drawRedrawReducer, drawSetReducer, drawBoxButtonReducer, drawFreeButtonReducer, invalidDrawWarningReducer} from './drawToolBarReducer'
import {zoomToSelectionReducer, resetMapReducer} from './setAoiToolbarReducer.js'
import {getGeonamesReducer, searchBboxReducer} from './searchToolbarReducer.js'
import userReducer from './userReducer'
import { routerReducer } from 'react-router-redux'

const rootReducer = combineReducers({
    // short hand property names
    drawExtensionVisible: drawExtensionReducer,
    drawCancel: drawCancelReducer,
    drawRedraw: drawRedrawReducer,
    drawSet: drawSetReducer,
    drawBoxButton: drawBoxButtonReducer,
    drawFreeButton: drawFreeButtonReducer,
    mode: exportModeReducer,
    jobs: exportJobsReducer,
    bbox: exportBboxReducer,
    geojson: exportGeojsonReducer,
    searchBbox: searchBboxReducer,
    zoomToSelection: zoomToSelectionReducer,
    resetMap: resetMapReducer,
    geonames: getGeonamesReducer,
    showInvalidDrawWarning: invalidDrawWarningReducer,
    isAOISet: exportSetAOIReducer,
    form: reduxFormReducer,
    user: userReducer,
    routing: routerReducer,
})

export default rootReducer;
