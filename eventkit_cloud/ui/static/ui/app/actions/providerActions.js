import {toast} from 'react-toastify';
export const types = {
    GETTING_PROVIDERS: 'GETTING_PROVIDERS',
    PROVIDERS_RECEIVED: 'PROVIDERS_RECEIVED',
    GETTING_PROVIDERS_ERROR: 'GETTING_PROVIDERS_ERROR',
    CANCELING_PROVIDER_TASK: 'CANCELING_PROVIDER_TASK',
    CANCELED_PROVIDER_TASK: 'CANCELED_PROVIDER_TASK',
    CANCEL_PROVIDER_TASK_ERROR: 'CANCEL_PROVIDER_TASK_ERROR',
    GETTING_PROVIDER_TASK: 'GETTING_PROVIDER_TASK',
    RECEIVED_PROVIDER_TASK: 'RECEIVED_PROVIDER_TASK',
    GETTING_PROVIDER_TASK_ERROR: 'GETTING_PROVIDER_TASK_ERROR',
    PATCHING_PROVIDER_FAVORITE: 'PATCHING_PROVIDER_FAVORITE',
    PATCHED_PROVIDER_FAVORITE: 'PATCHED_PROVIDER_FAVORITE',
    PATCH_PROVIDER_FAVORITE_ERROR: 'PATCH_PROVIDER_FAVORITE_ERROR',
};

export function getProviders(selectedArea, selectedTopics) {
    if (selectedArea || selectedTopics) {
        const params = {
            ...(selectedArea && { geojson: selectedArea }),
            ...(selectedTopics && { topics: selectedTopics }),
        };
        return {
            types: [
                types.GETTING_PROVIDERS,
                types.PROVIDERS_RECEIVED,
                types.GETTING_PROVIDERS_ERROR,
            ],
            url: '/api/providers/filter',
            method: 'POST',
            data: params,
            onSuccess: (response) => ({ providers: response.data }),
            onError: () => { toast.error(`Data Provider(s) failed to load`)}
        };
    }

    return {
        types: [
            types.GETTING_PROVIDERS,
            types.PROVIDERS_RECEIVED,
            types.GETTING_PROVIDERS_ERROR,
        ],
        url: '/api/providers',
        method: 'GET',
        onSuccess: (response) => ({ providers: response.data }),
        onError: () => { toast.error(`Data Provider(s) failed to load`)}
    };
}

export function getProviderTask(uid) {
    return {
        types: [
            types.GETTING_PROVIDER_TASK,
            types.RECEIVED_PROVIDER_TASK,
            types.GETTING_PROVIDER_TASK_ERROR,
        ],
        url: `/api/provider_tasks/${uid}`,
        method: 'GET',
        payload: { uid },
        params: { slim: 'true' },
        shouldCallApi: (state) => state.providerTasks.data[uid] === undefined,
        onSuccess: (response) => ({ data: response.data }),
    };
}

export function cancelProviderTask(uid) {
    return {
        types: [
            types.CANCELING_PROVIDER_TASK,
            types.CANCELED_PROVIDER_TASK,
            types.CANCEL_PROVIDER_TASK_ERROR,
        ],
        url: `/api/provider_tasks/${uid}`,
        method: 'PATCH',
    };
}

export function updateProviderFavorite(slug, favorite) {
    return {
        types: [
            types.PATCHING_PROVIDER_FAVORITE,
            types.PATCHED_PROVIDER_FAVORITE,
            types.PATCH_PROVIDER_FAVORITE_ERROR,
        ],
        url: `/api/providers/${slug}`,
        data: { favorite },
        method: 'PATCH',
        onSuccess: () => ({ slug, favorite }),
        onError: () => (toast.error(`Failed to set provider as favorite`)),
    };
}
