import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as actions from '../../actions/searchToolbarActions';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('async searchToolbar actions', () => {
    const mock = new MockAdapter(axios, { delayResponse: 10 });

    const collection = {
        type: 'FeatureCollection',
        features: [
            {
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [-1, 1],
                            [-1, 1],
                            [-1, 1],
                            [-1, 1],
                            [-1, 1],
                        ],
                    ],
                },
                type: 'Feature',
                properties: {
                    label: 'A',
                    source: 'B',
                    name: 'C',
                    country: 'X',
                    region: 'Y',
                },
                bbox: [-1, 1, -1, 1],
            },
        ],
        bbox: [-1, 1, -1, 1],
    };

    const expected = [{
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [-1, 1],
                    [-1, 1],
                    [-1, 1],
                    [-1, 1],
                    [-1, 1],
                ],
            ],
        },
        type: 'Feature',
        properties: {
            label: 'A',
            source: 'B',
            name: 'C',
            country: 'X',
            region: 'Y',
        },
        bbox: [-1, 1, -1, 1],
        label: 'A',
        source: 'B',
        name: 'C',
        country: 'X',
        region: 'Y',
    }];

    let store = mockStore({ geocode: [] });

    it('getGeonames should dispatch RECEIVED_GEONAMES after fetching', () => {
        mock.onGet('/search').reply(200, collection);

        const expectedActions = [
            { type: 'FETCHING_GEOCODE' },
            { type: 'RECEIVED_GEOCODE', data: expected },
        ];

        return store.dispatch(actions.getGeocode('some place'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('should handle errors', () => {
        store = mockStore({ geocode: [] });
        const fail = new MockAdapter(axios, { delayResponse: 10 });
        fail.onGet('/search').reply(400, 'ERROR: Invalid MGRS String');

        const expectedActions = [
            { type: 'FETCHING_GEOCODE' },
            { type: 'GEOCODE_ERROR', error: new Error('Request failed with status code 400') },
        ];

        return store.dispatch(actions.getGeocode('18SJT9710003009'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });
});
