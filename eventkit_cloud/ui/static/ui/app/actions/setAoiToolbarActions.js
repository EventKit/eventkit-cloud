import {Config} from '../config'
import * as types from './actionTypes'
import ExportApi from '../api/exportsApi';

export function toggleZoomToSelection(isDisabled) {
    return {
        type: types.TOGGLE_ZOOM_TO_SELECTION,
        disabled: isDisabled
    }
}

export function clickZoomToSelection() {
    return {
        type: types.CLICK_ZOOM_TO_SELECTION,
        click: true
    }
}

export function toggleResetMap(isDisabled) {
    return {
        type: types.TOGGLE_RESET_MAP,
        disabled: isDisabled
    }
}

export function clickResetMap() {
    return {
        type: types.CLICK_RESET_MAP,
        click: true
    }
}