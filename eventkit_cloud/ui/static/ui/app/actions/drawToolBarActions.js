import {Config} from '../config'
import * as types from './actionTypes'
import ExportApi from '../api/exportsApi';

export function toggleDrawExtension(currentToggleVisibility) {
    return {
        type: types.TOGGLE_DRAW_EXTENSION,
        drawExtensionVisible: !currentToggleVisibility
    }
}

export function toggleDrawCancel(currentToggleState) {
    return {
        type: types.TOGGLE_DRAW_CANCEL,
        disabled: !currentToggleState
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

export function toggleDrawRedraw(currentToggleState) {
    return {
        type: types.TOGGLE_DRAW_REDRAW,
        disabled: !currentToggleState
    }
}

export function clickDrawSet() {
    return {
        type: types.CLICK_DRAW_SET,
        click: true
    }
}

export function toggleDrawSet(currentToggleState) {
    return {
        type: types.TOGGLE_DRAW_SET,
        disabled: !currentToggleState
    }
}

export function toggleDrawBoxButton(currentToggleState) {
    return {
        type: types.TOGGLE_DRAW_BOX_BUTTON,
        disabled: !currentToggleState
    }
}

export function clickDrawBoxButton() {
    return {
        type: types.CLICK_DRAW_BOX_BUTTON,
        click: true
    }
}

export function toggleDrawFreeButton(currentToggleState) {
    return {
        type: types.TOGGLE_DRAW_FREE_BUTTON,
        disabled: !currentToggleState
    }
}

export function clickDrawFreeButton() {
    return {
        type: types.CLICK_DRAW_FREE_BUTTON,
        click: true
    }
}

