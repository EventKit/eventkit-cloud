import axios from 'axios';
import sinon from 'sinon';
import MockAdapter from 'axios-mock-adapter';
import * as actions from '../../actions/datapackActions';
import { exports } from '../../reducers/datapackReducer';
import Normalizer from '../../utils/normalizers';
import createTestStore from '../../store/configureTestStore';

const initialState = { exports, user: { data: { user: { username: 'test' } } } };

const getRun = () => ({
    uid: '6870234f-d876-467c-a332-65fdf0399a0d',
    url: 'http://cloud.eventkit.test/api/runs/6870234f-d876-467c-a332-65fdf0399a0d',
    started_at: '2017-03-10T15:52:35.637331Z',
    finished_at: '2017-03-10T15:52:39.837Z',
    user: 'admin',
    status: 'COMPLETED',
    job: {
        uid: '7643f806-1484-4446-b498-7ddaa65d011a',
        name: 'Test1',
        event: 'Test1 event',
        description: 'Test1 description',
        url: 'http://cloud.eventkit.test/api/jobs/7643f806-1484-4446-b498-7ddaa65d011a',
        permissions: {
            value: 'PRIVATE',
            groups: {},
            members: {},
        },
    },
    expiration: '2017-03-24T15:52:35.637258Z',
});

const getApiRun = () => ({
    uid: '6870234f-d876-467c-a332-65fdf0399a0d',
    url: 'http://cloud.eventkit.test/api/runs/6870234f-d876-467c-a332-65fdf0399a0d',
    started_at: '2017-03-10T15:52:35.637331Z',
    finished_at: '2017-03-10T15:52:39.837Z',
    user: 'admin',
    status: 'COMPLETED',
    job: {
        uid: '7643f806-1484-4446-b498-7ddaa65d011a',
        name: 'Test1',
        event: 'Test1 event',
        description: 'Test1 description',
        url: 'http://cloud.eventkit.test/api/jobs/7643f806-1484-4446-b498-7ddaa65d011a',
        permissions: {
            value: 'PRIVATE',
            groups: {},
            users: {},
        },
    },
    expiration: '2017-03-24T15:52:35.637258Z',
});

const normalizer = new Normalizer();
const normalRun = normalizer.normalizeRun(getRun());

describe('DataPackList actions', () => {
    it('getRuns should return runs from "api/runs/filter"', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/runs/filter').reply(200, [getApiRun()], {
            link: '<www.link.com>; rel="next",something else', 'content-range': 'range 1-12/24',
        });

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);

        const expectedActions = [
            {
                type: actions.types.FETCHING_RUNS,
                cancelSource: testSource,
            },
            {
                type: actions.types.RECEIVED_RUNS,
                payload: {
                    orderedIds: [getRun().uid],
                    nextPage: true,
                    range: '12/24',
                },
            },
            {
                type: 'ADD_RUN',
                payload: {
                    id: normalRun.result,
                    username: initialState.user.data.user.username,
                    ...normalRun.entities,
                },
            },
        ];

        const store = createTestStore(initialState);

        return store.dispatch(actions.getRuns({ fake: 'data' }))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
            });
    });

    it('getRuns should return handle empty header', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/runs/filter').reply(200, [getApiRun()], {});

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);

        const expectedActions = [
            {
                type: actions.types.FETCHING_RUNS,
                cancelSource: testSource,
            },
            {
                type: actions.types.RECEIVED_RUNS,
                payload: {
                    orderedIds: [getRun().uid],
                    nextPage: false,
                    range: '',
                },
            },
            {
                type: 'ADD_RUN',
                payload: {
                    id: normalRun.result,
                    username: initialState.user.data.user.username,
                    ...normalRun.entities,
                },
            },
        ];

        const store = createTestStore(initialState);

        return store.dispatch(actions.getRuns())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
            });
    });

    it('getRuns should cancel an active request', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/runs/filter').reply(200, [getApiRun()], {
            link: '<www.link.com>; rel="next",something else', 'content-range': 'range 1-12/24',
        });
        const cancel = sinon.spy();
        const cancelSource = { cancel };
        const store = createTestStore({
            ...initialState,
            exports: {
                ...initialState.exports,
                allInfo: {
                    ...initialState.exports.allInfo,
                    status: {
                        ...initialState.exports.allInfo.status,
                        fetching: true,
                        cancelSource,
                    },
                },
            },
        });
        return store.dispatch(actions.getRuns({ isAuto: false }))
            .then(() => {
                expect(cancel.calledOnce).toBe(true);
                expect(cancel.calledWith('Request is no longer valid, cancelling')).toBe(true);
            });
    });

    it('getRuns should NOT cancel an active request', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/runs/filter').reply(200, [getApiRun()], {
            link: '<www.link.com>; rel="next",something else', 'content-range': 'range 1-12/24',
        });
        const cancel = sinon.spy();
        const cancelSource = { cancel };
        const store = createTestStore({
            ...initialState,
            exports: {
                ...initialState.exports,
                allInfo: {
                    ...initialState.exports.allInfo,
                    status: {
                        ...initialState.exports.allInfo.status,
                        fetching: true,
                        cancelSource,
                    },
                },
            },
        });
        const ret = store.dispatch(actions.getRuns({ isAuto: true }));
        expect(cancel.called).toBe(false);
        expect(ret).toBe(null);
    });

    it('getRuns should handle the axios request being cancelled', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/runs/filter').reply(400, 'oh no an error');

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);
        const cancelStub = sinon.stub(axios, 'isCancel').returns(true);

        const expectedActions = [
            { type: actions.types.FETCHING_RUNS, cancelSource: testSource },
        ];

        const store = createTestStore(initialState);

        return store.dispatch(actions.getRuns())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
                cancelStub.restore();
            });
    });

    it('getRuns should handle a generic request error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/runs/filter').reply(400, 'oh no an error');

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);

        const expectedActions = [
            { type: actions.types.FETCHING_RUNS, cancelSource: testSource },
            { type: actions.types.FETCH_RUNS_ERROR, error: 'oh no an error' },
        ];

        const store = createTestStore(initialState);

        return store.dispatch(actions.getRuns())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
            });
    });

    it('getFeaturedRuns should return runs from "api/runs/filter"', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/runs/filter').reply(200, [getApiRun()], {
            link: '<www.link.com>; rel="next",something else', 'content-range': 'range 1-6/24',
        });

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);

        const expectedActions = [
            {
                type: actions.types.FETCHING_FEATURED_RUNS,
                cancelSource: testSource,
            },
            {
                type: actions.types.RECEIVED_FEATURED_RUNS,
                payload: {
                    ids: [getRun().uid],
                    nextPage: true,
                    range: '6/24',
                },
            },
            {
                type: 'ADD_FEATURED_RUN',
                payload: {
                    id: normalRun.result,
                    username: initialState.user.data.user.username,
                    ...normalRun.entities,
                },
            },
        ];

        const store = createTestStore(initialState);

        return store.dispatch(actions.getFeaturedRuns({ pageSize: 6 }))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
            });
    });

    it('getFeaturedRuns should handle a generic request error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/runs/filter').reply(400, 'oh no an error');

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);

        const expectedActions = [
            { type: actions.types.FETCHING_FEATURED_RUNS, cancelSource: testSource },
            { type: actions.types.FETCH_FEATURED_RUNS_ERROR, error: 'oh no an error' },
        ];

        const store = createTestStore(initialState);

        return store.dispatch(actions.getFeaturedRuns({ pageSize: 2 }))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
            });
    });

    it('deleteRun should dispatch deleting and deleted actions', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });

        mock.onDelete('/api/runs/123456789').reply(204);
        const expectedActions = [
            { type: actions.types.DELETING_RUN, payload: { id: '123456789' } },
            { type: actions.types.DELETED_RUN, payload: { id: '123456789' } },
        ];

        const store = createTestStore(initialState);

        return store.dispatch(actions.deleteRun('123456789'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('deleteRun should dispatch deleting and error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });

        mock.onDelete('/api/runs/12233').reply(400, 'oh no an error');
        const expectedActions = [
            { type: actions.types.DELETING_RUN, payload: { id: '12233' } },
            { type: actions.types.DELETE_RUN_ERROR, error: 'oh no an error' },
        ];
        const store = createTestStore(initialState);
        return store.dispatch(actions.deleteRun('12233'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('getDatacartDetails should return a specific run from "api/runs"', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onGet('/api/runs?job_uid=123456789').reply(200, [getApiRun()]);
        const expectedActions = [
            { type: actions.types.GETTING_DATACART_DETAILS },
            {
                type: actions.types.DATACART_DETAILS_RECEIVED,
                ids: [getRun().uid],
            },
            {
                type: 'ADD_RUN',
                payload: {
                    id: normalRun.result,
                    username: initialState.user.data.user.username,
                    ...normalRun.entities,
                },
            },
        ];

        const store = createTestStore(initialState);

        return store.dispatch(actions.getDatacartDetails('123456789'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('getDatacartDetails should return an empty array if there are no results', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onGet('/api/runs?job_uid=123456789').reply(200, []);
        const expectedActions = [
            { type: actions.types.GETTING_DATACART_DETAILS },
            {
                type: actions.types.DATACART_DETAILS_RECEIVED,
                ids: [],
            },
        ];

        const store = createTestStore(initialState);

        return store.dispatch(actions.getDatacartDetails('123456789'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('getDatacartDetails should dispatch an error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        mock.onGet('/api/runs?job_uid=123').reply(400, 'oh no an error');
        const expectedActions = [
            { type: actions.types.GETTING_DATACART_DETAILS },
            { type: actions.types.DATACART_DETAILS_ERROR, error: 'oh no an error' },
        ];

        const store = createTestStore(initialState);

        return store.dispatch(actions.getDatacartDetails('123'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('clearDataCartDetails should return CLEAR_DATACART_DETAILS', () => {
        expect(actions.clearDataCartDetails()).toEqual({ type: actions.types.CLEAR_DATACART_DETAILS });
    });

    it('deleteRun should dispatch deleting and deleted actions', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });

        mock.onDelete('/api/runs/123456789').reply(204);
        const expectedActions = [
            { type: actions.types.DELETING_RUN, payload: { id: '123456789' } },
            { type: actions.types.DELETED_RUN, payload: { id: '123456789' } },
        ];

        const store = createTestStore(initialState);

        return store.dispatch(actions.deleteRun('123456789'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('deleteRun should dispatch an error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });

        mock.onDelete('/api/runs/123').reply(400, 'oh no an error');
        const expectedActions = [
            {
                type: actions.types.DELETING_RUN,
                payload: { id: '123' },
            },
            {
                type: actions.types.DELETE_RUN_ERROR,
                error: 'oh no an error',
            },
        ];

        const store = createTestStore(initialState);

        return store.dispatch(actions.deleteRun('123'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('updateExpiration should dispatch a patch and update the expiration date', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });

        mock.onPatch('/api/runs/123456789').reply(204);
        const expectedActions = [
            { type: actions.types.UPDATING_EXPIRATION },
            { type: actions.types.UPDATE_EXPIRATION_SUCCESS },
        ];

        const store = createTestStore(initialState);

        return store.dispatch(actions.updateExpiration('123456789', '2021/2/1'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('updateExpiration should dispatch and error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });

        mock.onPatch('/api/runs/123').reply(400, 'oh no an error');
        const expectedActions = [
            { type: actions.types.UPDATING_EXPIRATION },
            { type: actions.types.UPDATE_EXPIRATION_ERROR, error: 'oh no an error' },
        ];

        const store = createTestStore(initialState);

        return store.dispatch(actions.updateExpiration('123', '2021/2/1'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });
});

