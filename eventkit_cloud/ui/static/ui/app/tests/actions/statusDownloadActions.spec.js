import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as actions from '../../actions/statusDownloadActions';
import types from '../../actions/actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('statusDownload actions', () => {
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

    it('getDatacartDetails should return a specific run from "api/runs"', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onGet('/api/runs?job_uid=123456789').reply(200, expectedRuns);
        const expectedActions = [
            { type: types.GETTING_DATACART_DETAILS },
            { type: types.DATACART_DETAILS_RECEIVED, datacartDetails: { data: expectedRuns } },
        ];

        const store = mockStore({ datacartDetails: {} });

        return store.dispatch(actions.getDatacartDetails('123456789'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('getDatacartDetails should dispatch an error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onGet('/api/runs?job_uid=123').reply(400, 'oh no an error');
        const expectedActions = [
            { type: types.GETTING_DATACART_DETAILS },
            { type: types.DATACART_DETAILS_ERROR, error: 'oh no an error' },
        ];

        const store = mockStore({ datacartDetails: {} });

        return store.dispatch(actions.getDatacartDetails('123'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('clearDataCartDetails should return CLEAR_DATACART_DETAILS', () => {
        expect(actions.clearDataCartDetails()).toEqual({ type: types.CLEAR_DATACART_DETAILS });
    });

    it('deleteRun should dispatch deleting and deleted actions', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });

        mock.onDelete('/api/runs/123456789').reply(204);
        const expectedActions = [
            { type: types.DELETING_RUN },
            { type: types.DELETED_RUN },
        ];

        const store = mockStore({ deleteRuns: {} });

        return store.dispatch(actions.deleteRun('123456789'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('deleteRun should dispatch an error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });

        mock.onDelete('/api/runs/123').reply(400, 'oh no an error');
        const expectedActions = [
            { type: types.DELETING_RUN },
            { type: types.DELETE_RUN_ERROR, error: 'oh no an error' },
        ];

        const store = mockStore({ deleteRuns: {} });

        return store.dispatch(actions.deleteRun('123'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('reRunExport should return a specific run from "api/runs"', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onPost('/api/jobs/123456789/run').reply(200, expectedRuns);
        const expectedActions = [
            { type: types.RERUNNING_EXPORT },
            { type: types.RERUN_EXPORT_SUCCESS, exportReRun: { data: expectedRuns } },
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
            { type: types.RERUNNING_EXPORT },
            { type: types.RERUN_EXPORT_ERROR, error: 'oh no an error' },
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

    it('cancelProviderTask should dispatch canceling and canceled actions', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });

        mock.onPatch('/api/provider_tasks/123456789').reply(204);
        const expectedActions = [
            { type: types.CANCELING_PROVIDER_TASK },
            { type: types.CANCELED_PROVIDER_TASK },
        ];

        const store = mockStore({ cancelProviderTask: {} });

        return store.dispatch(actions.cancelProviderTask('123456789'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('cancelProviderTask should dispatch an error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });

        mock.onPatch('/api/provider_tasks/123').reply(400, 'oh no an error');
        const expectedActions = [
            { type: types.CANCELING_PROVIDER_TASK },
            { type: types.CANCEL_PROVIDER_TASK_ERROR, error: 'oh no an error' },
        ];

        const store = mockStore({ cancelProviderTask: {} });

        return store.dispatch(actions.cancelProviderTask('123'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('updateExpiration should dispatch a patch and update the expiration date', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });

        mock.onPatch('/api/runs/123456789').reply(204);
        const expectedActions = [
            { type: types.UPDATING_EXPIRATION },
            { type: types.UPDATE_EXPIRATION_SUCCESS },
        ];

        const store = mockStore({ updateExpiration: {} });

        return store.dispatch(actions.updateExpiration('123456789', '2021/2/1'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('updateExpiration should dispatch and error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });

        mock.onPatch('/api/runs/123').reply(400, 'oh no an error');
        const expectedActions = [
            { type: types.UPDATING_EXPIRATION },
            { type: types.UPDATE_EXPIRATION_ERROR, error: 'oh no an error' },
        ];

        const store = mockStore({});

        return store.dispatch(actions.updateExpiration('123', '2021/2/1'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('updateDataCartPermissions should dispatch a patch and update the published state on the job', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });

        mock.onPatch('/api/jobs/123456789').reply(204);
        const expectedActions = [
            { type: types.UPDATING_PERMISSION },
            { type: types.UPDATE_PERMISSION_SUCCESS },
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
            { type: types.UPDATING_PERMISSION },
            { type: types.UPDATE_PERMISSION_ERROR, error: 'oh no an error' },
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
