
import {combineReducers} from 'redux';
import { reducer as reduxFormReducer } from 'redux-form'
import {exportJobsReducer, exportModeReducer, exportBboxReducer} from './exportsReducer';
import {drawExtensionReducer, drawCancelReducer, drawRedrawReducer, drawSetReducer, drawBoxButtonReducer} from './drawToolBarReducer';
import {zoomToSelectionReducer} from './setAoiToolbarReducer.js';

const rootReducer = combineReducers({
    // short hand property names
    drawExtensionVisible: drawExtensionReducer,
    drawCancel: drawCancelReducer,
    drawRedraw: drawRedrawReducer,
    drawSet: drawSetReducer,
    drawBoxButton: drawBoxButtonReducer,
    mode: exportModeReducer,
    jobs: exportJobsReducer,
    bbox: exportBboxReducer,
    zoomToSelction: zoomToSelectionReducer,
    form: reduxFormReducer,
    
})

export default rootReducer;
