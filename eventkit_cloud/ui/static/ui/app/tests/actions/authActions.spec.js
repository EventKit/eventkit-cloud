import * as actions from '../../actions/authActions';
import types from '../../actions/actionTypes';

describe('auth actions', () => {
    it('setToken should return the token along with the state', () => {
        const token = 'testToken';
        expect(actions.setToken(token)).toEqual({
            type: types.SET_TOKEN,
            payload: { token },
        });
    });

    it('clearToken should return true', () => {
        expect(actions.clearToken()).toEqual({
            type: types.CLEAR_TOKEN,
        });
    });
});
