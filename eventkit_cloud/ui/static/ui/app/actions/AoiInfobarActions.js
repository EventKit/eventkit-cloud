import {Config} from '../config'
import * as types from './actionTypes'
import ExportApi from '../api/exportsApi';

export function clickZoomToSelection() {
    return {
        type: types.CLICK_ZOOM_TO_SELECTION,
        click: true
    }
}

export function clickResetMap() {
    return {
        type: types.CLICK_RESET_MAP,
        click: true
    }
}