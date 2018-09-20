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

export const initialStateCancel = {
    canceling: false,
    canceled: false,
    error: null,
};

export function cancelProviderTask(state = initialStateCancel, action) {
    switch (action.type) {
        case types.CANCELING_PROVIDER_TASK:
            return { canceling: true, canceled: false, error: null };
        case types.CANCELED_PROVIDER_TASK:
            return { canceling: false, canceled: true, error: null };
        case types.CANCEL_PROVIDER_TASK_ERROR:
            return { canceling: false, canceled: false, error: action.error };
        default:
            return state;
    }
}
