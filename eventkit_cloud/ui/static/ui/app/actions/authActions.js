export const types = {
    SET_TOKEN: 'SET_TOKEN',
    CLEAR_TOKEN: 'CLEAR_TOKEN',
};

export const setToken = token => ({
    type: types.SET_TOKEN,
    payload: { token },
});

export const clearToken = () => ({
    type: types.CLEAR_TOKEN,
});
