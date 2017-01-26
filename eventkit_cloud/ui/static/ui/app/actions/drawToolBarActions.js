import {Config} from '../config'
import * as types from './actionTypes'
import ExportApi from '../api/exportsApi';

export function toggleDrawExtension(visibility) {
    return {
        type: types.TOGGLE_DRAW_EXTENSION,
        drawExtensionVisible: visibility
    }
}

export function toggleDrawCancel(newState) {
    return {
        type: types.TOGGLE_DRAW_CANCEL,
        disabled: newState
    }
}

export function clickDrawCancel() {
    return {
        type: types.CLICK_DRAW_CANCEL,
        click: true
    }
}

export function clickDrawRedraw() {
    return {
        type: types.CLICK_DRAW_REDRAW,
        click: true
    }
}

export function toggleDrawRedraw(newState) {
    return {
        type: types.TOGGLE_DRAW_REDRAW,
        disabled: newState
    }
}

export function clickDrawSet() {
    return {
        type: types.CLICK_DRAW_SET,
        click: true
    }
}

export function toggleDrawSet(newState) {
    return {
        type: types.TOGGLE_DRAW_SET,
        disabled: newState
    }
}

export function toggleDrawBoxButton(newState) {
    return {
        type: types.TOGGLE_DRAW_BOX_BUTTON,
        disabled: newState
    }
}

export function clickDrawBoxButton() {
    return {
        type: types.CLICK_DRAW_BOX_BUTTON,
        click: true
    }
}

export function toggleDrawFreeButton(newState) {
    return {
        type: types.TOGGLE_DRAW_FREE_BUTTON,
        disabled: newState
    }
}

export function clickDrawFreeButton() {
    return {
        type: types.CLICK_DRAW_FREE_BUTTON,
        click: true
    }
}

export function hideInvalidDrawWarning() {
    return {
        type: types.HIDE_INVALID_DRAW_WARNING,
        showInvalidDrawWarning: false
    }
}

export function showInvalidDrawWarning() {
    return {
        type: types.SHOW_INVALID_DRAW_WARNING,
        showInvalidDrawWarning: true
    }
}
