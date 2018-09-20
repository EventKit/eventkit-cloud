import axios from 'axios';
import cookie from 'react-cookie';

export const types = {
    GETTING_PROVIDERS: 'GETTING_PROVIDERS',
    PROVIDERS_RECEIVED: 'PROVIDERS_RECEIVED',
    CANCELING_PROVIDER_TASK: 'CANCELING_PROVIDER_TASK',
    CANCELED_PROVIDER_TASK: 'CANCELED_PROVIDER_TASK',
    CANCEL_PROVIDER_TASK_ERROR: 'CANCEL_PROVIDER_TASK_ERROR',
};

export function getProviders() {
    return (dispatch) => {
        dispatch({
            type: types.GETTING_PROVIDERS,
        });
        return axios({
            url: '/api/providers',
            method: 'GET',
        }).then((response) => {
            dispatch({
                type: types.PROVIDERS_RECEIVED,
                providers: response.data,
            });
        }).catch((error) => {
            console.log(error);
        });
    };
}

export function cancelProviderTask(uid) {
    return (dispatch) => {
        dispatch({ type: types.CANCELING_PROVIDER_TASK });

        const csrftoken = cookie.load('csrftoken');

        const formData = new FormData();
        formData.append('csrfmiddlewaretoken', csrftoken);

        return axios({
            url: `/api/provider_tasks/${uid}`,
            method: 'PATCH',
            data: formData,
            headers: { 'X-CSRFToken': csrftoken },
        }).then(() => {
            dispatch({ type: types.CANCELED_PROVIDER_TASK });
        }).catch((error) => {
            dispatch({ type: types.CANCEL_PROVIDER_TASK_ERROR, error: error.response.data });
        });
    };
}

