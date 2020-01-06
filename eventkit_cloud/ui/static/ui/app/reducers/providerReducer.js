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
    canceled: false,
    canceling: false,
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

export const initialStateProviderTasks = {
    data: {},
    error: null,
    fetched: false,
    fetching: false,
};

export function providerTasksReducer(state = initialStateProviderTasks, action) {
    switch (action.type) {
        case types.GETTING_PROVIDER_TASK:
            return { ...state, fetching: true, fetched: false };
        case types.RECEIVED_PROVIDER_TASK:
            return {
                ...state,
                data: { ...state.data, [action.uid]: action.data },
                fetched: true,
                fetching: false,
            };
        case types.GETTING_PROVIDER_TASK_ERROR:
            return {
                ...state,
                error: action.error,
                fetched: false,
                fetching: false,
            };
        default:
            return state;
    }
}
