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
};

export function getProviders(selectedArea) {
    if (selectedArea) {
        return {
            types: [
                types.GETTING_PROVIDERS,
                types.PROVIDERS_RECEIVED,
                types.GETTING_PROVIDERS_ERROR,
            ],
            url: '/api/providers/filter',
            method: 'POST',
            data: { geojson: selectedArea },
            onSuccess: (response) => ({ providers: response.data }),
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
