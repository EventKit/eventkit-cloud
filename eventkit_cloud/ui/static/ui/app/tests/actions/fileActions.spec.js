import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import createTestStore from '../../store/configureTestStore';
import * as actions from '../../actions/fileActions';

describe('file actions', () => {
    it('resetGeoJSONFile should return type FILE_RESET', () => {
        expect(actions.resetGeoJSONFile()).toEqual({
            type: 'FILE_RESET',
        });
    });

    it('processGeoJSONFile should add AOI to state if valid geojson', () => {
        const geojson = {
            features: [
                {
                    geometry: {
                        coordinates: [
                            [
                                [7.2, 46.2],
                                [7.6, 46.2],
                                [7.6, 46.6],
                                [7.2, 46.6],
                                [7.2, 46.2],
                            ],
                        ],
                        type: 'Polygon',
                    },
                    properties: {},
                    type: 'Feature',
                },
            ],
            type: 'FeatureCollection',
        };
        const initialState = {};
        const store = createTestStore(initialState);
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onPost('/file_upload').reply(200, geojson);
        const file = new File(
            [geojson],
            'test.geojson',
            { type: 'application/json' },
        );

        const expectedPayload = [
            { type: actions.types.FILE_PROCESSING, filename: 'test.geojson' },
            { type: actions.types.FILE_PROCESSED, featureCollection: geojson },
        ];
        return store.dispatch(actions.processGeoJSONFile(file))
            .then(() => {
                expect(store.getActions()).toEqual(expectedPayload);
            });
    });

    it('processGeoJSONFile should dispatch error if no data is returned in the response', () => {
        const initialState = {};
        const store = createTestStore(initialState);
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onPost('/file_upload').reply(200, null);
        const file = new File(
            [{}],
            'test.geojson',
            { type: 'application/json' },
        );

        const expectedPayload = [
            { type: actions.types.FILE_PROCESSING, filename: 'test.geojson' },
            { type: actions.types.FILE_ERROR, error: 'No data returned from the api.' },
        ];
        return store.dispatch(actions.processGeoJSONFile(file))
            .then(() => {
                expect(store.getActions()).toEqual(expectedPayload);
            });
    });

    it('processGeoJSONFile should dispatch error on axios error', () => {
        const initialState = {};
        const store = createTestStore(initialState);
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onPost('/file_upload').reply(400, 'whoops');
        const file = new File(
            ['not a file'],
            'test.geojson',
            { type: 'application/json' },
        );

        const expectedPayload = [
            { type: actions.types.FILE_PROCESSING, filename: 'test.geojson' },
            { type: actions.types.FILE_ERROR, error: 'whoops' },
        ];
        return store.dispatch(actions.processGeoJSONFile(file))
            .then(() => {
                expect(store.getActions()).toEqual(expectedPayload);
            });
    });
});
