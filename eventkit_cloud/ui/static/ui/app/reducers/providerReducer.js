import { types } from '../actions/providerActions';

export const initialStateProviders = {
    fetching: false,
    fetched: false,
    error: null,
    objects: [],
};

export function getProvidersReducer(state = initialStateProviders, action) {
    switch (action.type) {
        case types.GETTING_PROVIDERS:
            return {
                fetching: true,
                fetched: false,
                error: null,
                objects: [],
            };
        case types.PROVIDERS_RECEIVED:
            return {
                fetching: false,
                fetched: true,
                objects: action.providers,
                error: null,
            };
        case types.GETTING_PROVIDERS_ERROR:
            return {
                ...state,
                fetching: false,
                fetched: false,
                error: action.error,
                objects: action.providers,
            };
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

export const initialStateProviderTasks = {
    fetching: false,
    fetched: false,
    error: null,
    data: {},
};

export function providerTasksReducer(state = initialStateProviderTasks, action) {
    switch (action.type) {
        case types.GETTING_PROVIDER_TASK:
            return { ...state, fetching: true, fetched: false };
        case types.RECEIVED_PROVIDER_TASK:
            return {
                ...state,
                fetching: false,
                fetched: true,
                data: { ...state.data, [action.uid]: action.data },
            };
        case types.GETTING_PROVIDER_TASK_ERROR:
            return {
                ...state,
                fetching: false,
                fetched: false,
                error: action.error,
            };
        default:
            return state;
    }
}
