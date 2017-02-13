import {Config} from '../config';
import * as types from './actionTypes';
import ExportApi from '../api/exportsApi';

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
