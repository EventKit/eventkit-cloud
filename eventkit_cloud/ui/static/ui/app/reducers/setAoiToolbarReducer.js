import * as types from '../actions/actionTypes';
import initialState from './initialState';

export function zoomToSelectionReducer(state = initialState.zoomToSelection, action) {
    switch(action.type) {
        case types.TOGGLE_ZOOM_TO_SELECTION:
            return Object.assign({}, state, {disabled: action.disabled})
        case types.CLICK_ZOOM_TO_SELECTION:
            return Object.assign({}, state, {click: !state.click})
        default:
            return state;
    }
}
