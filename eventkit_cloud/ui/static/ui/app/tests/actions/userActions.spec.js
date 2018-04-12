import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import sinon from 'sinon';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as userActions from '../../actions/userActions';
import types from '../../actions/actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('userActions actions', () => {
    it('logout should call logout reducer if logout request is successful', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onGet('/logout').reply(200, {
            users: [
                { id: 1, name: 'John Smith' },
            ],
        });

        const expectedActions = [{ type: types.USER_LOGGED_OUT },
            { payload: { args: [{ pathname: '/login', search: undefined }], method: 'push' }, type: '@@router/CALL_HISTORY_METHOD' }];
        const store = mockStore({ user: { username: 'ExampleUser' } });

        return store.dispatch(userActions.logout())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('logout should change href if OAUTH in response', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/logout').reply(200, { OAUTH_LOGOUT_URL: 'www.oauth.com' });

        const expectedActions = [
            { type: types.USER_LOGGED_OUT },
        ];
        const store = mockStore({ user: { username: '' } });
        const assignStub = sinon.stub(global.window.location, 'assign');
        return store.dispatch(userActions.logout())
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

        const expectedActions = [{ type: types.USER_LOGGING_IN }, { payload: {}, type: 'USER_LOGGED_IN' }];

        const store = mockStore({ user: { username: 'ExampleUser' } });
        return store.dispatch(userActions.login())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('valid credentials should log the user in', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });

        mock.onPost('/auth').reply(200, {});

        const expectedActions = [{ type: types.USER_LOGGING_IN }, { payload: {}, type: 'USER_LOGGED_IN' }];

        const store = mockStore({ user: { username: 'ExampleUser' } });
        return store.dispatch(userActions.login({ username: 'username', password: 'password' }))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('invalid existing credentials should not log the user in', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });

        mock.onGet('/auth').reply(401, {});
        mock.onGet('/logout').reply(200, {});

        const expectedActions = [{ type: types.USER_LOGGING_IN }, { type: types.USER_LOGGED_OUT }];

        const store = mockStore({ user: { username: 'ExampleUser' } });
        return store.dispatch(userActions.login())
            .catch(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('invalid credentials should not log the user in', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });

        mock.onPost('/auth/').reply(401, {});
        mock.onGet('/logout').reply(200, {});

        const expectedActions = [{ type: types.USER_LOGGING_IN }, { type: types.USER_LOGGED_OUT }];

        const store = mockStore({ user: { username: 'ExampleUser' } });
        return store.dispatch(userActions.login({ username: 'username', password: 'bad_password' }))
            .catch(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('login should not log the user in if there is no response data', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });

        mock.onPost('/auth').reply(200, null);

        const expectedActions = [
            { type: types.USER_LOGGING_IN },
            { type: types.USER_LOGGED_OUT },
        ];

        const store = mockStore({ user: {} });
        return store.dispatch(userActions.login({ username: 'username', password: 'password' }))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('patchUser should handle patch request success', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        const user = { username: 'user1', name: 'user1' };
        mock.onPatch(`/api/users/${user.username}`).reply(200, user);
        const expectedActions = [
            { type: types.PATCHING_USER },
            { type: types.PATCHED_USER, payload: user },
        ];
        const store = mockStore({});
        return store.dispatch(userActions.patchUser([], user.username))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('patchUser should handle a request error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        const user = { username: 'user1' };
        const error = 'oh no an error';
        mock.onPatch(`/api/users/${user.username}`).reply(400, error);
        const expectedActions = [
            { type: types.PATCHING_USER },
            { type: types.PATCHING_USER_ERROR, error },
        ];
        const store = mockStore({});
        return store.dispatch(userActions.patchUser([], user.username))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
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
            type: types.USER_ACTIVE,
            payload: {
                autoLogoutAt: new Date(autoLogoutAtMS),
                autoLogoutWarningAt: new Date(autoLogoutWarningAtMS),
            },
        }];

        const store = mockStore({
            user: {
                autoLogoutAt: null,
                autoLogoutWarningat: null,
            },
        });

        return store.dispatch(userActions.userActive())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('userActive should handle an error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });

        mock.onGet('/user_active').reply(400, 'Oh no an error');

        const expectedActions = [];

        const store = mockStore({});

        return store.dispatch(userActions.userActive())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('getUsers should fetch users from the api', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        const users = [
            { user: { name: 'user1', username: 'user1' } },
            { user: { name: 'user2', username: 'user2' } },
            { user: { name: 'user3', username: 'user3' } },
        ];
        const headers = {
            'total-users': '3',
            'new-users': '2',
            'not-grouped-users': '1',
        };
        mock.onGet('/api/users').reply(200, users, headers);

        const expectedUsers = [
            users[1],
            users[2],
        ];

        const expectedActions = [
            { type: types.FETCHING_USERS },
            {
                type: types.FETCHED_USERS,
                users: expectedUsers,
                total: 3,
                new: 2,
                ungrouped: 1,
            },
        ];

        const store = mockStore({
            user: {
                data: {
                    user: { username: 'user1' },
                },
            },
        });

        return store.dispatch(userActions.getUsers())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('getUsers should handle fetching error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        const error = 'Oh no an error';
        mock.onGet('/api/users').reply(400, error);
        const expectedActions = [
            { type: types.FETCHING_USERS },
            { type: types.FETCH_USERS_ERROR, error },
        ];
        const store = mockStore({
            user: { data: { user: {} } },
        });

        return store.dispatch(userActions.getUsers())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });
});
