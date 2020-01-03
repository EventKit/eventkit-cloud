export const types = {
    CLEAR_TOKEN: 'CLEAR_TOKEN',
    SET_TOKEN: 'SET_TOKEN',
};

export const setToken = token => ({
    payload: { token },
    type: types.SET_TOKEN,
});

export const clearToken = () => ({
    type: types.CLEAR_TOKEN,
});
