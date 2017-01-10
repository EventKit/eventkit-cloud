import {Config} from '../config'
import * as types from './actionTypes'
import ExportApi from '../api/exportsApi';

export function toggleZoomToSelection(currentState) {
    return {
        type: types.TOGGLE_ZOOM_TO_SELECTION,
        disabled: !currentState
    }
}

export function clickZoomToSelection() {
    return {
        type: types.CLICK_ZOOM_TO_SELECTION,
        click: true
    }
}
