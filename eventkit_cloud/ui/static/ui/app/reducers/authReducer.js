import { types } from '../actions/authActions';

export const initialState = {
    token: null,
};

export default (state = initialState, { type, payload }) => {
    switch (type) {
        case types.SET_TOKEN:
            return { ...state, ...payload };
        case types.CLEAR_TOKEN:
            return { ...state, token: null };
        default:
            return state;
    }
};
