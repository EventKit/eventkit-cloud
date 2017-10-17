import configureMockStore from 'redux-mock-store';
import ol from 'openlayers';
import thunk from 'redux-thunk';
import axios from 'axios';
import sinon from 'sinon';
import MockAdapter from 'axios-mock-adapter';
import * as actions from '../../actions/mapToolActions';
import types from '../../actions/mapToolActionTypes';


const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('mapTool actions', () => {
    it('resetGeoJSONFile should return type FILE_RESET', () => {
        expect(actions.resetGeoJSONFile()).toEqual({
            type: 'FILE_RESET',
        });
    });

    it('processGeoJSONFile should create error if extension is not an accepted file type ', () => {
        const initialState = {};
        const store = mockStore(initialState);
        const file = new File(
            ['<!doctype html><div>file</div>'],
            'test.wkt',
            { type: 'text/html' },
        );
        const expectedPayload = [
            { type: types.FILE_PROCESSING },
            { type: types.FILE_ERROR, error: 'File type wkt is not supported' },
        ];
        return store.dispatch(actions.processGeoJSONFile(file))
            .catch(() => {
                expect(store.getActions()).toEqual(expectedPayload);
            });
    });

    it('processGeoJSONFile should add AOI to state if valid geojson', () => {
        const geojson = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [7.2, 46.2],
                                [7.6, 46.2],
                                [7.6, 46.6],
                                [7.2, 46.6],
                                [7.2, 46.2],
                            ],
                        ],
                    },
                },
            ],
        };
        const initialState = {};
        const store = mockStore(initialState);
        const geom = (new ol.format.GeoJSON()).readGeometry(geojson.features[0].geometry);
        const readGeomStub = sinon.stub(ol.format.GeoJSON.prototype, 'readGeometry')
            .returns(geom);
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onPost('/file_upload').reply(200, geojson);
        const file = new File(
            [geojson],
            'test.geojson',
            { type: 'application/json' },
        );

        const expectedPayload = [
            { type: types.FILE_PROCESSING },
            { type: types.FILE_PROCESSED, geom },
        ];
        return store.dispatch(actions.processGeoJSONFile(file))
            .then(() => {
                expect(store.getActions()).toEqual(expectedPayload);
                readGeomStub.restore();
            });
    });

    it('processGeoJSONFile should not add AOI to state if invalid geojson', () => {
        const geojson = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'polygon',
                        coordinates: [
                            [
                                [7.2, 46.2],
                                [7.6, 46.2],
                                [7.6, 46.6],
                                [7.2, 46.6],
                                [7.2, 46.2],
                            ],
                        ],
                    },
                },
            ],
        };
        const initialState = {};
        const store = mockStore(initialState);
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onPost('/file_upload').reply(200, geojson);
        const file = new File(
            [geojson],
            'test.geojson',
            { type: 'application/json' },
        );

        const expectedPayload = [
            { type: types.FILE_PROCESSING },
            { type: types.FILE_ERROR, error: 'There was an error processing the geojson file.' },
        ];
        return store.dispatch(actions.processGeoJSONFile(file))
            .then(() => {
                expect(store.getActions()).toEqual(expectedPayload);
            });
    });

    it('processGeoJSONFile should dispatch error if no data is returned in the response', () => {
        const initialState = {};
        const store = mockStore(initialState);
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onPost('/file_upload').reply(200, null);
        const file = new File(
            [{}],
            'test.geojson',
            { type: 'application/json' },
        );

        const expectedPayload = [
            { type: types.FILE_PROCESSING },
            { type: types.FILE_ERROR, error: 'No data returned from the api.' },
        ];
        return store.dispatch(actions.processGeoJSONFile(file))
            .then(() => {
                expect(store.getActions()).toEqual(expectedPayload);
            });
    });

    it('processGeoJSONFile should dispatch error on axios error', () => {
        const initialState = {};
        const store = mockStore(initialState);
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onPost('/file_upload').reply(400, 'whoops');
        const file = new File(
            ['not a file'],
            'test.geojson',
            { type: 'application/json' },
        );

        const expectedPayload = [
            { type: types.FILE_PROCESSING },
            { type: types.FILE_ERROR, error: 'whoops' },
        ];
        return store.dispatch(actions.processGeoJSONFile(file))
            .then(() => {
                expect(store.getActions()).toEqual(expectedPayload);
            });
    });
});
