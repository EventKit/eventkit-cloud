import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import * as userActions from '../actions/userActions'
import types from '../actions/actionTypes'
import React from 'react'
import axios from 'axios'
import expect from 'expect'
import MockAdapter from 'axios-mock-adapter';

const middlewares = [ thunk]
const mockStore = configureMockStore(middlewares)

describe('userActions actions', () => {

    it('logout should call logout reducer if logout request is successful', () => {

        var mock = new MockAdapter(axios, {delayResponse: 1000});

        mock.onGet('/logout').reply(200, {
          users: [
            { id: 1, name: 'John Smith' }
          ]
        });

        const expectedActions = [{type: types.USER_LOGGED_OUT},
            {payload: {args: ['/login'], method: 'push'}, type: '@@router/CALL_HISTORY_METHOD'}];
        const store = mockStore({user: {username: "ExampleUser"}});

        return store.dispatch(userActions.logout())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })
    });

    it('existing credentials should log the user in', () => {
        const mock = new MockAdapter(axios, {delayResponse: 1000});

        mock.onGet('/auth/').reply(200, {});

        const expectedActions = [{type: types.USER_LOGGING_IN},  { payload: {}, type: 'USER_LOGGED_IN' }];

        const store = mockStore({user: {username: "ExampleUser"}});
        return store.dispatch(userActions.login())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })
    });

    it('valid credentials should log the user in', () => {
        const mock = new MockAdapter(axios, {delayResponse: 1000});

        mock.onPost('/auth/').reply(200, {});

        const expectedActions = [{type: types.USER_LOGGING_IN},  { payload: {}, type: 'USER_LOGGED_IN' }];

        const store = mockStore({user: {username: "ExampleUser"}});
        return store.dispatch(userActions.login({username: 'username', password: 'password'}))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })
    });

    it('invalid existing credentials should not log the user in', () => {
        const mock = new MockAdapter(axios, {delayResponse: 1000});

        mock.onGet('/auth/').reply(401, {});
        mock.onGet('/logout').reply(200, {});

        const expectedActions = [{type: types.USER_LOGGING_IN}, {type: types.USER_LOGGED_OUT}];

        const store = mockStore({user: {username: "ExampleUser"}});
        return store.dispatch(userActions.login())
            .catch(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })
    });

    it('invalid credentials should not log the user in', () => {
        const mock = new MockAdapter(axios, {delayResponse: 1000});

        mock.onPost('/auth/').reply(401, {});
        mock.onGet('/logout').reply(200, {});

        const expectedActions = [{type: types.USER_LOGGING_IN}, {type: types.USER_LOGGED_OUT}];

        const store = mockStore({user: {username: "ExampleUser"}});
        return store.dispatch(userActions.login({username: 'username', password: 'bad_password'}))
            .catch(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })
    });
})

