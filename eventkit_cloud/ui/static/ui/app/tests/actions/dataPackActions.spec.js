import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import axios from 'axios';
import sinon from 'sinon';
import MockAdapter from 'axios-mock-adapter';
import * as actions from '../../actions/dataPackActions';
import types from '../../actions/actionTypes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const expectedRuns = [
    {
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
    },
];

describe('DataPackList actions', () => {
    it('getRuns should return runs from "api/runs/filter"', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/runs/filter').reply(200, expectedRuns, {
            link: '<www.link.com>; rel="next",something else', 'content-range': 'range 1-12/24',
        });

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);

        const expectedActions = [
            { type: types.FETCHING_RUNS, cancelSource: testSource },
            { type: types.RECEIVED_RUNS, runs: expectedRuns, nextPage: true, range: '12/24' }
        ];

        const store = mockStore({ runsList: {} });

        return store.dispatch(actions.getRuns({}, { fake: 'data' }))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
            });
    });

    it('getRuns should return handle empty header', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/runs/filter').reply(200, expectedRuns, {});

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);

        const expectedActions = [
            { type: types.FETCHING_RUNS, cancelSource: testSource },
            { type: types.RECEIVED_RUNS, runs: expectedRuns, nextPage: false, range: '' }
        ];

        const store = mockStore({ runsList: {} });

        return store.dispatch(actions.getRuns())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
            });
    });

    it('getRuns should cancel an active request', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/runs/filter').reply(200, expectedRuns, {
            link: '<www.link.com>; rel="next",something else', 'content-range': 'range 1-12/24',
        });
        const cancel = sinon.spy();
        const cancelSource = { cancel };
        const store = mockStore({ runsList: { fetching: true, cancelSource } });
        return store.dispatch(actions.getRuns({}, {}, false))
            .then(() => {
                expect(cancel.calledOnce).toBe(true);
                expect(cancel.calledWith('Request is no longer valid, cancelling')).toBe(true);
            });
    });

    it('getRuns should NOT cancel an active request', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/runs/filter').reply(200, expectedRuns, {
            link: '<www.link.com>; rel="next",something else', 'content-range': 'range 1-12/24',
        });
        const cancel = sinon.spy();
        const cancelSource = { cancel };
        const store = mockStore({ runsList: { fetching: true, cancelSource } });
        const ret = store.dispatch(actions.getRuns({}, {}, true));
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
            { type: types.FETCHING_RUNS, cancelSource: testSource },
        ];

        const store = mockStore({ runsList: {} });

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
            { type: types.FETCHING_RUNS, cancelSource: testSource },
            { type: types.FETCH_RUNS_ERROR, error: 'oh no an error' },
        ];

        const store = mockStore({ runsList: {} });

        return store.dispatch(actions.getRuns())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
            });
    });

    it('deleteRuns should dispatch deleting and deleted actions', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });

        mock.onDelete('/api/runs/123456789').reply(204);
        const expectedActions = [
            { type: types.DELETING_RUN },
            { type: types.DELETED_RUN },
        ];

        const store = mockStore({ deleteRuns: {} });

        return store.dispatch(actions.deleteRuns('123456789'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('deleteRuns should dispatch deleting and error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        
        mock.onDelete('/api/runs/12233').reply(400, 'oh no an error');
        const expectedActions = [
            { type: types.DELETING_RUN },
            { type: types.DELETE_RUN_ERROR, error: 'oh no an error' },
        ];
        const store = mockStore({ deleteRuns: {} });
        return store.dispatch(actions.deleteRuns('12233'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('setPageOrder should return type SET_PAGE_ORDER and the order', () => {
        const order = 'featured';
        expect(actions.setPageOrder(order)).toEqual(
            {
                type: types.SET_PAGE_ORDER,
                order,
            }
        );
    });

    it('setPageView should return type SET_PAGE_VIEW and the view', () => {
        const view = 'map';
        expect(actions.setPageView(view)).toEqual(
            {
                type: types.SET_PAGE_VIEW,
                view,
            }
        );
    });
});

