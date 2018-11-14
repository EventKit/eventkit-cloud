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

    let store = createTestStore({ geocode: { cancelSource: null } });

    let testSource;
    let original;

    beforeAll(() => {
        testSource = axios.CancelToken.source();
        original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);
    });

    afterAll(() => {
        axios.CancelToken.source = original;
    });

    it('getGeonames should dispatch RECEIVED_GEONAMES after fetching', () => {
        mock.onGet('/search').reply(200, collection);

        const expectedActions = [
            { type: 'FETCHING_GEOCODE', _auth_required: true, cancelSource: testSource },
            { type: 'RECEIVED_GEOCODE', data: expected, _auth_required: true },
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
            { type: 'FETCHING_GEOCODE', _auth_required: true, cancelSource: testSource },
            { type: 'FETCH_GEOCODE_ERROR', error: 'Request failed with status code 400', _auth_required: true },
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
            { type: 'FETCHING_GEOCODE', _auth_required: true, cancelSource: testSource },
            { type: 'FETCH_GEOCODE_ERROR', error: 'An unknown error has occured', _auth_required: true },
        ];

        return store.dispatch(actions.getGeocode('18SJT9710003009'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('should handle cancel', () => {
        store = createTestStore({ geocode: { cancelSource: testSource } });
        const req = new MockAdapter(axios, { delayResponse: 10 });
        req.onGet('/search').reply(200);
        const expectedActions = [
            { type: 'FETCHING_GEOCODE', _auth_required: true, cancelSource: testSource },
        ];

        return store.dispatch(actions.getGeocode('123'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });
});
