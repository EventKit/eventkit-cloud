import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import * as userActions from './userActions'
import types from './actionTypes'
import React from 'react'
import axios from 'axios'
import expect from 'expect'
import fetch from 'isomorphic-fetch'
import fetchMock from 'fetch-mock'


const promisifyMiddleware = ({dispatch, getState}) => next => action => {
    return new Promise((resolve) => resolve(next(action)))
}

const middlewares = [ thunk]
const mockStore = configureMockStore(middlewares)

describe('userActions actions', () => {

    afterEach(() => {
         fetchMock.restore();
    })

    it('logout should call logout reducer if logout request is successful', () => {

        fetchMock.mock('*', {status: 200});

        const expectedActions = [{type: types.USER_LOGGED_OUT}];
        const store = mockStore({user: {username: "ExampleUser"}})

        store.dispatch(userActions.logout())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })
    });

    // it('valid login should log the user in', () => {
    //     const mock = new MockAdapter(axios, {delayResponse: 1000});
    //
    //     mock.onGet('/auth').reply(200, {});
    //
    //     const expectedActions = [{type: types.USER_LOGGED_OUT}, {type: types.USER_LOGGED_IN}];
    //
    //     const getState = () => ({user: 'foo'});
    //     const dispatch = expect.createSpy();
    //     userActions.login({username: 'username', password: 'password'})(dispatch, getState).then(() => {
    //             expect(dispatch).toHaveBeenCalledWith(expectedActions);
    //         }
    //     )
    // });
    //
    // it('invalid login should log the user out', () => {
    //     const mock = new MockAdapter(axios, {delayResponse: 1000});
    //
    //     mock.onGet('/auth').reply(401, {});
    //
    //     const store = mockStore({user: null})
    //
    //     return store.dispatch(userActions.login({username: 'username', password: 'password'}))
    //         .then(() => {
    //             expect(store.getActions()).toEqual([{type: types.USER_LOGGING_IN}])
    //         })
    //         .then(() => {
    //             expect(store.getActions()).toEqual({type: types.USER_LOGGED_OUT})
    //         })
    // });

})

