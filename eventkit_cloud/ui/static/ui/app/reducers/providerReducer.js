import { types } from '../actions/providerActions';

export const initialState = [];

export function getProvidersReducer(state = initialState, action) {
    switch (action.type) {
        case types.GETTING_PROVIDERS:
            return [];
        case types.PROVIDERS_RECEIVED:
            return action.providers;
        default:
            return state;
    }
}
