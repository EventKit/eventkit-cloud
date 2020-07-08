import { types } from '../actions/projectionActions';

export const initialState = [];

export function getProjectionsReducer(state = initialState, action) {
    switch (action.type) {
        case types.GETTING_PROJECTIONS:
            return [];
        case types.PROJECTIONS_RECEIVED:
            return action.projections;
        default:
            return state;
    }
}
