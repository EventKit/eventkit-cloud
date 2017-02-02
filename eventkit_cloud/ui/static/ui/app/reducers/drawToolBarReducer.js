import * as types from '../actions/actionTypes';
import initialState from './initialState';

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
