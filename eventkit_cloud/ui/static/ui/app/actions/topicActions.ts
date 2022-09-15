import {toast} from 'react-toastify';
export const types = {
    GETTING_TOPICS: 'GETTING_TOPICS',
    TOPICS_RECEIVED: 'TOPICS_RECEIVED',
    GETTING_TOPICS_ERROR: 'GETTING_TOPICS_ERROR',
};

export function getTopics() {
    return {
        types: [
            types.GETTING_TOPICS,
            types.TOPICS_RECEIVED,
            types.GETTING_TOPICS_ERROR,
        ],
        url: '/api/topics',
        method: 'GET',
        onSuccess: response => ({ topics: response.data }),
        onError: () => {toast.error('Topic(s) failed to load')}
    };
}
