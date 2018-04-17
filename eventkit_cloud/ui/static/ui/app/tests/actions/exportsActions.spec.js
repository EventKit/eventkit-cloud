
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import axios from 'axios';
import sinon from 'sinon';
import MockAdapter from 'axios-mock-adapter';
import types from '../../actions/actionTypes';
import * as actions from '../../actions/exportsActions';
import { setCloseDrawerTimeout, getOpenDrawerTimeout, DrawerTimeout } from '../../actions/exportsActions';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('export actions', () => {
    const geojson = {
        "type": "FeatureCollection",
        "features": [
        { "type": "Feature",
            "geometry": {
            "type": "Polygon",
            "coordinates": [
                [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
                [100.0, 1.0], [100.0, 0.0] ]
                ]
            },
            }
        ]
    };

    const jobData = {
        name: 'testJobName',
        description: 'testJobDesc',
        event: 'testJobEvent',
        include_zipfile: false,
        provider_tasks: {'provider': ['provider1'], 'formats': ['gpkg']},
        selection: {"type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "bbox": [1,1,1,1],
                        "geometry" : {
                            "type": "Polygon",
                            "coordinates": [[[1,1],[1,1],[1,1],[1,1]]]
                        }}]},
        tags: [],

    };

    it('updateAoiInfo should return passed in json', () => {
        expect(actions.updateAoiInfo({
            geojson,
            geomType: 'Polygon',
            title: 'title',
            description: 'description',
        })).toEqual({
            type: 'UPDATE_AOI_INFO',
            geojson,
            geomType: 'Polygon',
            title: 'title',
            description: 'description',
        });
    });

    it('updateExportInfo should return passed in json', () => {
        expect(actions.updateExportInfo({
            exportName: 'exportName',
            datapackDescription: 'datapackDescription',
            projectName: 'projectName',
            providers: ['provider1'],
            areaStr: 'areaStr',
            layers: ['layer1'],
        })).toEqual({
            type: 'UPDATE_EXPORT_INFO',
            exportInfo: {
                exportName: 'exportName',
                datapackDescription: 'datapackDescription',
                projectName: 'projectName',
                providers: ['provider1'],
                areaStr: 'areaStr',
                layers: ['layer1'],
            },
        });
    });

    it('clearExportInfo should return CLEAR_EXPORT_INFO', () => {
        expect(actions.clearExportInfo()).toEqual({
            type: 'CLEAR_EXPORT_INFO',
        });
    });

    it('stepperNextDisabled should return MAKE_STEPPER_INACTIVE and false', () => {
        expect(actions.stepperNextDisabled()).toEqual({
            type: 'MAKE_STEPPER_INACTIVE',
            stepperNextEnabled: false,
        });
    });

    it('stepperNextEnabled should return MAKE_STEPPER_ACTIVE and true', () => {
        expect(actions.stepperNextEnabled()).toEqual({
            type: 'MAKE_STEPPER_ACTIVE',
            stepperNextEnabled: true,
        });
    });

    it('submitJob should post job data', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });

        mock.onPost('/api/jobs').reply(200, { uid: '123456789' });

        const expectedActions = [
            { type: types.SUBMITTING_JOB },
            { jobuid: '123456789', type: types.JOB_SUBMITTED_SUCCESS },
        ];

        const store = mockStore({ jobSubmit: { jobuid: {} } });
        return store.dispatch(actions.submitJob(jobData))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('submitJob should handle errors', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });

        mock.onPost('/api/jobs').reply(400, 'uh oh');

        const expectedActions = [
            { type: types.SUBMITTING_JOB },
            { type: types.JOB_SUBMITTED_ERROR, error: 'uh oh' },
        ];

        const store = mockStore({});
        return store.dispatch(actions.submitJob(jobData))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('getProviders should return providers from the api', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/providers').reply(200, ['my providers']);

        const expectedActions = [
            { type: types.GETTING_PROVIDERS },
            { type: types.PROVIDERS_RECEIVED, providers: ['my providers'] },
        ];
        const store = mockStore({});
        return store.dispatch(actions.getProviders())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('getProviders should handle errors', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/providers').reply(400);

        const expectedActions = [
            { type: types.GETTING_PROVIDERS },
        ];
        const store = mockStore({});
        return store.dispatch(actions.getProviders())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('getFormats should return formats from the api', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/formats').reply(200, ['my formats']);

        const expectedActions = [
            { type: types.GETTING_FORMATS },
            { type: types.FORMATS_RECEIVED, formats: ['my formats'] },
        ];
        const store = mockStore({});
        return store.dispatch(actions.getFormats())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('getFormats should handle errors', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/formats').reply(400);

        const expectedActions = [
            { type: types.GETTING_FORMATS },
        ];
        const store = mockStore({});
        return store.dispatch(actions.getFormats())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('clearAoiInfo should return type CLEAR_AOI_INFO and no action', () => {
        expect(actions.clearAoiInfo()).toEqual({
            type: 'CLEAR_AOI_INFO',
        });
    });

    it('clearJobInfo should dispatch CLEAR_JOB_INFO', () => {
        expect(actions.clearJobInfo()).toEqual({
            type: 'CLEAR_JOB_INFO',
        });
    });

    it('DrawerTimeout closeDrawer should close drawer', () => {
        const timeout = new actions.DrawerTimeout();
        const expectedActions = [
            { type: types.CLOSING_DRAWER },
            { type: types.CLOSED_DRAWER },
        ];

        const store = mockStore({ drawer: 'open' });
        return store.dispatch(timeout.closeDrawer())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('DrawerTimeout closeDrawer should close drawer and clear open timeout', () => {
        const clearStub = sinon.stub(global, 'clearTimeout');
        const timeout = new actions.DrawerTimeout(null, 'yo');
        const expectedActions = [
            { type: types.CLOSING_DRAWER },
            { type: types.CLOSED_DRAWER },
        ];

        const store = mockStore({ drawer: 'open' });
        return store.dispatch(timeout.closeDrawer())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                expect(clearStub.calledOnce).toBe(true);
                clearStub.restore();
            });
    });

    it('DrawerTimeout openDrawer should open drawer', () => {
        const timeout = new actions.DrawerTimeout();
        const expectedActions = [
            { type: types.OPENING_DRAWER },
            { type: types.OPENED_DRAWER },
        ];

        const store = mockStore({ drawer: 'closed' });
        return store.dispatch(timeout.openDrawer())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('DrawerTimeout openDrawer should open drawer and clear open timeout', () => {
        const clearStub = sinon.stub(global, 'clearTimeout');
        const timeout = new actions.DrawerTimeout('yo', null);
        const expectedActions = [
            { type: types.OPENING_DRAWER },
            { type: types.OPENED_DRAWER },
        ];

        const store = mockStore({ drawer: 'closed' });
        return store.dispatch(timeout.openDrawer())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                expect(clearStub.calledOnce).toBe(true);
                clearStub.restore();
            });
    });
});
