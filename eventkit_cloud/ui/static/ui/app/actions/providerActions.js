import axios from 'axios';

export const types = {
    GETTING_PROVIDERS: 'GETTING_PROVIDERS',
    PROVIDERS_RECEIVED: 'PROVIDERS_RECEIVED',
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
