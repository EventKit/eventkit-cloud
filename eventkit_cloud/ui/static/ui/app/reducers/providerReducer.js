import { types } from '../actions/providerActions';

export const initialStateProviders = {
    fetching: false,
    objects: [],
};

export function getProvidersReducer(state = initialStateProviders, action) {
    switch (action.type) {
        case types.GETTING_PROVIDERS:
            return {
                fetching: true,
                objects: [],
                cancelToken: action.cancelSource,
            };
        case types.PROVIDERS_RECEIVED:
            return {
                fetching: false,
                objects: action.providers,
                cancelToken: undefined,
            };
        case types.GETTING_PROVIDERS_ERROR:
            return {
                ...state,
                fetching: !!state.cancelToken,
            };
        case types.PATCHED_PROVIDER_FAVORITE:
            return {
                ...state,
                objects: state.objects.map((provider) => {
                    if (provider.slug === action.slug) {
                        return {
                            ...provider,
                            favorite: action.favorite,
                        };
                    }
                    return provider;
                }),
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
