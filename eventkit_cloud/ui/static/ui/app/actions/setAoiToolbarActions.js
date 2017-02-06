import {Config} from '../config'
import actions from './actionTypes'
import ExportApi from '../api/exportsApi';

export function toggleZoomToSelection(isDisabled) {
    return {
        type: actions.TOGGLE_ZOOM_TO_SELECTION,
        disabled: isDisabled
    }
}

export function clickZoomToSelection() {
    return {
        type: actions.CLICK_ZOOM_TO_SELECTION,
        click: true
    }
}

export function toggleResetMap(isDisabled) {
    return {
        type: actions.TOGGLE_RESET_MAP,
        disabled: isDisabled
    }
}

export function clickResetMap() {
    return {
        type: actions.CLICK_RESET_MAP,
        click: true
    }
}