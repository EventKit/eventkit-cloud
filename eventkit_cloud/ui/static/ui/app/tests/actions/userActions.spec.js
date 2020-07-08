import sinon from 'sinon';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import createTestStore from '../../store/configureTestStore';
import * as actions from '../../actions/userActions';

describe('userActions actions', () => {
    it('logout should call logout reducer if logout request is successful', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onGet('/logout').reply(200, {
            users: [
                { id: 1, name: 'John Smith' },
            ],
        });

        const expectedActions = [
            { type: actions.types.USER_LOGGED_OUT },
            {
                payload: {
                    args: [{ pathname: '/login', search: undefined }],
                    method: 'push',
                },
                type: '@@router/CALL_HISTORY_METHOD',
            },
            { type: 'RESET_APPLICATION_STATE' },
        ];
        const store = createTestStore({ user: { username: 'ExampleUser' } });

        return store.dispatch(actions.logout())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('logout should change href if OAUTH in response', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/logout').reply(200, { OAUTH_LOGOUT_URL: 'www.oauth.com' });

        const expectedActions = [
            { type: actions.types.USER_LOGGED_OUT },
        ];
        const store = createTestStore({ user: { username: '' } });
        const assignStub = sinon.stub(global.window.location, 'assign');
        return store.dispatch(actions.logout())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                expect(assignStub.calledOnce).toBe(true);
                expect(assignStub.calledWith('www.oauth.com'));
                assignStub.restore();
            });
    });

    it('existing credentials should log the user in', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });

        mock.onGet('/auth').reply(200, {});

        const expectedActions = [{ type: actions.types.USER_LOGGING_IN }, { payload: {}, type: 'USER_LOGGED_IN' }];

        const store = createTestStore({ user: { username: 'ExampleUser' } });
        return store.dispatch(actions.login())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('valid credentials should log the user in', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });

        mock.onPost('/auth').reply(200, {});

        const expectedActions = [{ type: actions.types.USER_LOGGING_IN }, { payload: {}, type: 'USER_LOGGED_IN' }];

        const store = createTestStore({ user: { username: 'ExampleUser' } });
        return store.dispatch(actions.login({ username: 'username', password: 'password' }))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('invalid existing credentials should not log the user in', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });

        mock.onGet('/auth').reply(401, {});
        mock.onGet('/logout').reply(200, {});

        const expectedActions = [{ type: actions.types.USER_LOGGING_IN }, { type: actions.types.USER_LOGGED_OUT }];

        const store = createTestStore({ user: { username: 'ExampleUser' } });
        return store.dispatch(actions.login())
            .catch(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('invalid credentials should not log the user in', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });

        mock.onPost('/auth/').reply(401, {});
        mock.onGet('/logout').reply(200, {});

        const expectedActions = [{ type: actions.types.USER_LOGGING_IN }, { type: actions.types.USER_LOGGED_OUT }];

        const store = createTestStore({ user: { username: 'ExampleUser' } });
        return store.dispatch(actions.login({ username: 'username', password: 'bad_password' }))
            .catch(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('login should not log the user in if there is no response data', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });

        mock.onPost('/auth').reply(200, null);

        const expectedActions = [
            { type: actions.types.USER_LOGGING_IN },
            { type: actions.types.USER_LOGGED_OUT },
        ];

        const store = createTestStore({ user: {} });
        return store.dispatch(actions.login({ username: 'username', password: 'password' }))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    describe('patchUser action', () => {
        it('should return the correct types', () => {
            expect(actions.patchUser().types).toEqual([
                actions.types.PATCHING_USER,
                actions.types.PATCHED_USER,
                actions.types.PATCHING_USER_ERROR,
            ]);
        });

        it('should pass accepted licenses in the data', () => {
            const licenses = { one: true, two: false };
            expect(actions.patchUser(licenses, 'test').data).toEqual({
                accepted_licenses: licenses,
            });
        });

        it('onSuccess should return payload', () => {
            const ret = { data: [{ one: true }, { two: false }] };
            expect(actions.patchUser().onSuccess(ret)).toEqual({
                payload: ret.data,
            });
        });

        it('onSuccess should return error string', () => {
            const ret = { data: undefined };
            expect(actions.patchUser().onSuccess(ret)).toEqual({
                payload: { ERROR: 'No user response data' },
            });
        });
    });

    it('userActive should set auto logout and auto logout warning times', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        const autoLogoutAtMS = Date.now() + (30 * 60 * 1000);
        const autoLogoutWarningAtMS = Date.now() + (5 * 60 * 1000);

        mock.onGet('/user_active').reply(200, {
            auto_logout_at: new Date(autoLogoutAtMS),
            auto_logout_warning_at: new Date(autoLogoutWarningAtMS),
        });

        const expectedActions = [{
            type: actions.types.USER_ACTIVE,
            payload: {
                autoLogoutAt: new Date(autoLogoutAtMS),
                autoLogoutWarningAt: new Date(autoLogoutWarningAtMS),
            },
        }];

        const store = createTestStore({
            user: {
                autoLogoutAt: null,
                autoLogoutWarningat: null,
            },
        });

        return store.dispatch(actions.userActive())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('userActive should handle an error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });

        mock.onGet('/user_active').reply(400, 'Oh no an error');

        const expectedActions = [];

        const store = createTestStore({});

        return store.dispatch(actions.userActive())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });
});
