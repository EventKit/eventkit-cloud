import authReducer, { initialState } from '../../reducers/authReducer';
import { types } from '../../actions/authActions';

describe('authReducer', () => {
    it('should return initial state', () => {
        expect(authReducer(undefined, {})).toEqual({
            token: null,
        });
    });

    it('SET_TOKEN should add the token to the store', () => {
        const token = 'example_token';

        expect(authReducer(
            undefined,
            {
                type: types.SET_TOKEN,
                payload: { token },
            },
        )).toEqual({ ...initialState, token });
    });

    it('SET_TOKEN should update the token in the store', () => {
        const originalToken = 'example_token';
        const newToken = 'example_token_2';

        const state = { token: originalToken };

        expect(authReducer(
            state,
            {
                type: types.SET_TOKEN,
                payload: { token: newToken },
            },
        )).toEqual({ ...state, token: newToken });
    });

    it('REMOVE_TOKEN should remove the token from the store', () => {
        const token = 'example_token';
        const state = { ...initialState, token };

        expect(authReducer(
            state,
            {
                type: types.CLEAR_TOKEN,
            },
        )).toEqual({ ...state, token: null });
    });
});
