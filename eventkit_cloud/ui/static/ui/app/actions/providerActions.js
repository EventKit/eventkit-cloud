export const types = {
    CANCELED_PROVIDER_TASK: 'CANCELED_PROVIDER_TASK',
    CANCELING_PROVIDER_TASK: 'CANCELING_PROVIDER_TASK',
    CANCEL_PROVIDER_TASK_ERROR: 'CANCEL_PROVIDER_TASK_ERROR',
    GETTING_PROVIDERS: 'GETTING_PROVIDERS',
    GETTING_PROVIDERS_ERROR: 'GETTING_PROVIDERS_ERROR',
    GETTING_PROVIDER_TASK: 'GETTING_PROVIDER_TASK',
    GETTING_PROVIDER_TASK_ERROR: 'GETTING_PROVIDER_TASK_ERROR',
    PROVIDERS_RECEIVED: 'PROVIDERS_RECEIVED',
    RECEIVED_PROVIDER_TASK: 'RECEIVED_PROVIDER_TASK',
};

export function getProviders() {
    return {
        method: 'GET',
        onSuccess: response => ({ providers: response.data }),
        types: [
            types.GETTING_PROVIDERS,
            types.GETTING_PROVIDERS_ERROR,
            types.PROVIDERS_RECEIVED,
        ],
        url: '/api/providers',
    };
}

export function getProviderTask(uid) {
    return {
        method: 'GET',
        onSuccess: response => ({ data: response.data[0] }),
        params: { slim: 'true' },
        payload: { uid },
        shouldCallApi: state => state.providerTasks.data[uid] === undefined,
        types: [
            types.GETTING_PROVIDER_TASK,
            types.GETTING_PROVIDER_TASK_ERROR,
            types.RECEIVED_PROVIDER_TASK,
        ],
        url: `/api/provider_tasks/${uid}`,
    };
}

export function cancelProviderTask(uid) {
    return {
        method: 'PATCH',
        types: [
            types.CANCELED_PROVIDER_TASK,
            types.CANCELING_PROVIDER_TASK,
            types.CANCEL_PROVIDER_TASK_ERROR,
        ],
        url: `/api/provider_tasks/${uid}`,
    };
}
