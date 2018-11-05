import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import createTestStore from '../../store/configureTestStore';
import * as actions from '../../actions/geocodeActions';

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

    let store = createTestStore({ geocode: [] });

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
        store = createTestStore({ geocode: [] });
        const fail = new MockAdapter(axios, { delayResponse: 10 });
        fail.onGet('/search').reply(400, 'Request failed with status code 400');

        const expectedActions = [
            { type: 'FETCHING_GEOCODE' },
            { type: 'FETCH_GEOCODE_ERROR', error: 'Request failed with status code 400' },
        ];

        return store.dispatch(actions.getGeocode('18SJT9710003009'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('should handle unknown errors', () => {
        store = createTestStore({ geocode: [] });
        const fail = new MockAdapter(axios, { delayResponse: 10 });
        fail.onGet('/search').reply(400, '');

        const expectedActions = [
            { type: 'FETCHING_GEOCODE' },
            { type: 'FETCH_GEOCODE_ERROR', error: 'An unknown error has occured' },
        ];

        return store.dispatch(actions.getGeocode('18SJT9710003009'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });
});
