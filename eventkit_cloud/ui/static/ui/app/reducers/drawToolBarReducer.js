import * as types from '../actions/actionTypes';
import initialState from './initialState';

export function drawExtensionReducer(state = initialState.drawExtensionVisible, action) {
    switch(action.type) {
        case types.TOGGLE_DRAW_EXTENSION:
            return action.drawExtensionVisible
        default:
            return state;
    }
}

export function drawCancelReducer(state = initialState.drawCancel, action) {
    switch(action.type) {
        case types.TOGGLE_DRAW_CANCEL:
            return Object.assign({}, state, {disabled: action.disabled})
        case types.CLICK_DRAW_CANCEL:
            return Object.assign({}, state, {click: !state.click})
        default:
            return state;
    }
}

export function drawRedrawReducer(state = initialState.drawRedraw, action) {
    switch(action.type) {
        case types.TOGGLE_DRAW_REDRAW:
            return Object.assign({}, state, {disabled: action.disabled})
        case types.CLICK_DRAW_REDRAW:
            return Object.assign({}, state, {click: !state.click})
        default:
            return state;
    }
}

export function drawSetReducer(state = initialState.drawSet, action) {
    switch(action.type) {
        case types.TOGGLE_DRAW_SET:
            return Object.assign({}, state, {disabled: action.disabled});
        case types.CLICK_DRAW_SET:
            return Object.assign({}, state, {click: !state.click});
        default:
            return state;
    }
}

export function drawBoxButtonReducer(state = initialState.drawBoxButton, action) {
    switch(action.type) {
        case types.TOGGLE_DRAW_BOX_BUTTON:
            return Object.assign({}, state, {disabled: action.disabled});
        case types.CLICK_DRAW_BOX_BUTTON:
            return Object.assign({}, state, {click: !state.click});
        default:
            return state;
    }
}

export function drawFreeButtonReducer(state = initialState.drawFreeButton, action) {
    switch(action.type) {
        case types.TOGGLE_DRAW_FREE_BUTTON:
            return Object.assign({}, state, {disabled: action.disabled});
        case types.CLICK_DRAW_FREE_BUTTON:
            return Object.assign({}, state, {click: !state.click});
        default:
            return state;
    }
}

export function invalidDrawWarningReducer(state = initialState.showInvalidDrawWarning, action) {
    switch(action.type) {
        case types.SHOW_INVALID_DRAW_WARNING:
            return action.showInvalidDrawWarning;
        case types.HIDE_INVALID_DRAW_WARNING:
            return action.showInvalidDrawWarning;
        default:
            return state;
    }
}
