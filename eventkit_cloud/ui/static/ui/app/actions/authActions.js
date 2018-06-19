import actions from './actionTypes';


export const setToken = token => ({
    type: actions.SET_TOKEN,
    payload: { token },
});

export const clearToken = () => ({
    type: actions.CLEAR_TOKEN,
});
