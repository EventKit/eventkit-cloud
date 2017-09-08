import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk'
import getLicenses from '../../actions/licenseActions';
import types from '../../actions/actionTypes';
import React from 'react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('license actions', () => {
    it('should dispatch fetching then fetched with license data', () => {
        const mock = new MockAdapter(axios, {delayResponse: 500});
        mock.onGet('/api/licenses').reply(200,
            [
                {name: 'license 1'},
                {name: 'license 2'}
            ]
        );
        const expectedActions = [
            {type: types.FETCHING_LICENSES},
            {type: types.RECEIVED_LICENSES, licenses: [{name: 'license 1'}, {name: 'license 2'}]}
        ];
        const store = mockStore({licenses: []});

        return store.dispatch(getLicenses())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('should dispatch fetching then error with error code', () => {
        const mock = new MockAdapter(axios, {delayResponse: 500});
        mock.onGet('/api/licenses').reply(404, []);
        const expectedActions = [
            {type: types.FETCHING_LICENSES},
            {type: types.FETCH_LICENSES_ERROR, error: 404}
        ];
        const store = mockStore({licenses: []});

        return store.dispatch(getLicenses())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });
});