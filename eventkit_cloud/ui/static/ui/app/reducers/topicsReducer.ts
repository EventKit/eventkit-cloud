import { types } from '../actions/topicActions';

export const initialState = [];

export function getTopicsReducer(state = initialState, action) {
    switch (action.type) {
        case types.GETTING_TOPICS:
            return [];
        case types.TOPICS_RECEIVED:
            return action.topics;
        default:
            return state;
    }
}
