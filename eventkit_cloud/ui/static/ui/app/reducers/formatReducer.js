import { types } from '../actions/formatActions';

export const initialState = [];

export function getFormatsReducer(state = initialState, action) {
    switch (action.type) {
        case types.GETTING_FORMATS:
            return [];
        case types.FORMATS_RECEIVED:
            return action.formats;
        default:
            return state;
    }
}
