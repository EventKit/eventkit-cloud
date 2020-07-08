import * as actions from '../../actions/authActions';

describe('auth actions', () => {
    it('setToken should return the token along with the state', () => {
        const token = 'testToken';
        expect(actions.setToken(token)).toEqual({
            type: actions.types.SET_TOKEN,
            payload: { token },
        });
    });

    it('clearToken should return true', () => {
        expect(actions.clearToken()).toEqual({
            type: actions.types.CLEAR_TOKEN,
        });
    });
});
