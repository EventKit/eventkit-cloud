export const fakeStore = state => ({
    default: () => undefined,
    dispatch: () => undefined,
    getState: () => ({ ...state }),
    subscribe: () => undefined,
});
