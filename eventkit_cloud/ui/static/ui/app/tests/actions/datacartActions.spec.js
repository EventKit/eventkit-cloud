
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import axios from 'axios';
import sinon from 'sinon';
import MockAdapter from 'axios-mock-adapter';
import * as actions from '../../actions/datacartActions';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('export actions', () => {
    const expectedRuns = [
        {
            uid: '123',
            url: 'http://cloud.eventkit.test/api/runs/123',
            started_at: '2017-03-10T15:52:35.637331Z',
            finished_at: '2017-03-10T15:52:39.837Z',
            duration: '0:00:04.199825',
            user: 'admin',
            status: 'COMPLETED',
            visibility: 'PRIVATE',
            job: {
                uid: '123',
                name: 'Test1',
                event: 'Test1 event',
                description: 'Test1 description',
                url: 'http://cloud.eventkit.test/api/jobs/123',
                extent: {},
                selection: '',
                permissions: {
                    groups: {},
                    users: {},
                },
            },
            provider_tasks: [],
            zipfile_url: 'http://cloud.eventkit.test/downloads/123/test.zip',
            expiration: '2017-03-24T15:52:35.637258Z',
        },
    ];

    const geojson = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
                            [100.0, 1.0], [100.0, 0.0]],
                    ],
                },
            },
        ],
    };

    const jobData = {
        name: 'testJobName',
        description: 'testJobDesc',
        event: 'testJobEvent',
        include_zipfile: false,
        provider_tasks: { provider: ['provider1'], formats: ['gpkg'] },
        selection: {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                bbox: [1, 1, 1, 1],
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[1, 1], [1, 1], [1, 1], [1, 1]]],
                },
            }],
        },
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
            { type: actions.types.SUBMITTING_JOB },
            { jobuid: '123456789', type: actions.types.JOB_SUBMITTED_SUCCESS },
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
            { type: actions.types.SUBMITTING_JOB },
            { type: actions.types.JOB_SUBMITTED_ERROR, error: 'uh oh' },
        ];

        const store = mockStore({});
        return store.dispatch(actions.submitJob(jobData))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('getFormats should return formats from the api', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/formats').reply(200, ['my formats']);

        const expectedActions = [
            { type: actions.types.GETTING_FORMATS },
            { type: actions.types.FORMATS_RECEIVED, formats: ['my formats'] },
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
            { type: actions.types.GETTING_FORMATS },
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
            { type: actions.types.CLOSING_DRAWER },
            { type: actions.types.CLOSED_DRAWER },
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
            { type: actions.types.CLOSING_DRAWER },
            { type: actions.types.CLOSED_DRAWER },
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
            { type: actions.types.OPENING_DRAWER },
            { type: actions.types.OPENED_DRAWER },
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
            { type: actions.types.OPENING_DRAWER },
            { type: actions.types.OPENED_DRAWER },
        ];

        const store = mockStore({ drawer: 'closed' });
        return store.dispatch(timeout.openDrawer())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                expect(clearStub.calledOnce).toBe(true);
                clearStub.restore();
            });
    });

    it('reRunExport should return a specific run from "api/runs"', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onPost('/api/jobs/123456789/run').reply(200, expectedRuns);
        const expectedActions = [
            { type: actions.types.RERUNNING_EXPORT },
            { type: actions.types.RERUN_EXPORT_SUCCESS, exportReRun: { data: expectedRuns } },
        ];

        const store = mockStore({ exportReRun: {} });

        return store.dispatch(actions.rerunExport('123456789'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('reRunExport should dispatch an error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onPost('/api/jobs/123/run').reply(400, 'oh no an error');
        const expectedActions = [
            { type: actions.types.RERUNNING_EXPORT },
            { type: actions.types.RERUN_EXPORT_ERROR, error: 'oh no an error' },
        ];

        const store = mockStore({ exportReRun: {} });

        return store.dispatch(actions.rerunExport('123'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('clearReRunInfo should return type CLEAR_RERUN_INFO and no action', () => {
        expect(actions.clearReRunInfo()).toEqual({
            type: 'CLEAR_RERUN_INFO',
        });
    });

    it('updateDataCartPermissions should dispatch a patch and update the published state on the job', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });

        mock.onPatch('/api/jobs/123456789').reply(204);
        const expectedActions = [
            { type: actions.types.UPDATING_PERMISSION },
            { type: actions.types.UPDATE_PERMISSION_SUCCESS },
        ];

        const store = mockStore({ updatePermission: {} });

        return store.dispatch(actions.updateDataCartPermissions('123456789', {
            permissions: {
                value: 'SHARED',
                groups: { group_one: 'READ' },
                members: { admin: 'ADMIN' },
            },
        })).then(() => {
            expect(store.getActions()).toEqual(expectedActions);
        });
    });

    it('updateDataCartPermissions should dispatch an error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });

        mock.onPatch('/api/jobs/123').reply(400, 'oh no an error');
        const expectedActions = [
            { type: actions.types.UPDATING_PERMISSION },
            { type: actions.types.UPDATE_PERMISSION_ERROR, error: 'oh no an error' },
        ];

        const store = mockStore({ updatePermission: {} });

        return store.dispatch(actions.updateDataCartPermissions('123', {
            permissions: {
                value: 'SHARED',
                groups: { group_one: 'READ' },
                members: { admin: 'ADMIN' },
            },
        })).then(() => {
            expect(store.getActions()).toEqual(expectedActions);
        });
    });
});
