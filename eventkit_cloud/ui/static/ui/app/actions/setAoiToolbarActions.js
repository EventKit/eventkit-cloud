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

export function toggleResetMap(currentState) {
    return {
        type: types.TOGGLE_RESET_MAP,
        disabled: !currentState
    }
}

export function clickResetMap() {
    return {
        type: types.CLICK_RESET_MAP,
        click: true
    }
}