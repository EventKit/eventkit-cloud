import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { types, getLicenses } from '../../actions/licenseActions';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('license actions', () => {
    it('should dispatch fetching then fetched with license data', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/licenses').reply(200, [
            { name: 'license 1' },
            { name: 'license 2' },
        ]);
        const expectedActions = [
            { type: types.FETCHING_LICENSES },
            { type: types.RECEIVED_LICENSES, licenses: [{ name: 'license 1' }, { name: 'license 2' }] },
        ];
        const store = mockStore({ licenses: [] });

        return store.dispatch(getLicenses())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('should dispatch fetching then error with error message', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/licenses').reply(404, 'oh no');
        const expectedActions = [
            { type: types.FETCHING_LICENSES },
            { type: types.FETCH_LICENSES_ERROR, error: 'oh no' },
        ];
        const store = mockStore({ licenses: [] });

        return store.dispatch(getLicenses())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });
});
