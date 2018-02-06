import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as userActions from '../../actions/userActions';
import types from '../../actions/actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('userActions actions', () => {

    it('logout should call logout reducer if logout request is successful', () => {

        var mock = new MockAdapter(axios, {delayResponse: 1000});

        mock.onGet('/logout').reply(200, {
          users: [
            { id: 1, name: 'John Smith' }
          ]
        });

        const expectedActions = [{type: types.USER_LOGGED_OUT},
            {payload: {args: [{ pathname: '/login', search: undefined }], method: 'push'}, type: '@@router/CALL_HISTORY_METHOD'}];
        const store = mockStore({user: {username: "ExampleUser"}});

        return store.dispatch(userActions.logout())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })
    });

    it('existing credentials should log the user in', () => {
        const mock = new MockAdapter(axios, {delayResponse: 1000});

        mock.onGet('/auth').reply(200, {});

        const expectedActions = [{type: types.USER_LOGGING_IN},  { payload: {}, type: 'USER_LOGGED_IN' }];

        const store = mockStore({user: {username: "ExampleUser"}});
        return store.dispatch(userActions.login())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })
    });

    it('valid credentials should log the user in', () => {
        const mock = new MockAdapter(axios, {delayResponse: 1000});

        mock.onPost('/auth').reply(200, {});

        const expectedActions = [{type: types.USER_LOGGING_IN},  { payload: {}, type: 'USER_LOGGED_IN' }];

        const store = mockStore({user: {username: "ExampleUser"}});
        return store.dispatch(userActions.login({username: 'username', password: 'password'}))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })
    });

    it('invalid existing credentials should not log the user in', () => {
        const mock = new MockAdapter(axios, {delayResponse: 1000});

        mock.onGet('/auth').reply(401, {});
        mock.onGet('/logout').reply(200, {});

        const expectedActions = [{type: types.USER_LOGGING_IN}, {type: types.USER_LOGGED_OUT}];

        const store = mockStore({user: {username: "ExampleUser"}});
        return store.dispatch(userActions.login())
            .catch(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })
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

    it('patchUser should handle patch request success', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        const user = { username: 'user1', name: 'user1' };
        mock.onPatch(`/api/user/${user.username}`).reply(200, user);
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
        mock.onPatch(`/api/user/${user.username}`).reply(400, error);
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
});
