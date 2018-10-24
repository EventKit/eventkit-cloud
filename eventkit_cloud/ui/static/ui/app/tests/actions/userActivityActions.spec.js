import sinon from 'sinon';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import createTestStore from '../../store/configureTestStore';
import * as actions from '../../actions/userActivityActions';
import { exports as state } from '../../reducers/datapackReducer';
import Normalizer from '../../utils/normalizers';

const initialState = { exports: state, user: { data: { user: { username: 'test' } } } };

const apiPermissions = {
    value: '',
    groups: [],
    members: [],
};

const reduxPermissions = {
    value: '',
    groups: [],
    members: [],
};

const mockApiJobs = [{
    last_export_run: {
        uid: '123',
        job: { uid: '111', permissions: apiPermissions },
        provider_tasks: [],
    },
},
{
    last_export_run: {
        uid: '456',
        job: { uid: '222', permissions: apiPermissions },
        provider_tasks: [],
    },
}];

const mockJobs = [{
    last_export_run: {
        uid: '123',
        job: { uid: '111', permissions: reduxPermissions },
        provider_tasks: [],
    },
},
{
    last_export_run: {
        uid: '456',
        job: { uid: '222', permissions: reduxPermissions },
        provider_tasks: [],
    },
}];

const normalizer = new Normalizer();
const run1 = normalizer.normalizeRun(mockJobs[0].last_export_run);
const run2 = normalizer.normalizeRun(mockJobs[1].last_export_run);


describe('userActivityActions', () => {
    it('getViewedJobs() should send the received array of viewed jobs to the reducer', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/user/activity/jobs').reply(200, mockApiJobs, {
            link: '<www.link.com>; rel="next",something else', 'content-range': 'range 1-12/24',
        });

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);

        const expectedActions = [
            {
                type: actions.types.FETCHING_VIEWED_JOBS,
                cancelSource: testSource,
            },
            {
                type: actions.types.RECEIVED_VIEWED_JOBS,
                payload: {
                    ids: ['123', '456'],
                    nextPage: true,
                    range: '12/24',
                },
            },
            {
                type: 'ADD_VIEWED_RUN',
                payload: {
                    id: run1.result,
                    username: initialState.user.data.user.username,
                    ...run1.entities,
                },
            },
            {
                type: 'ADD_VIEWED_RUN',
                payload: {
                    id: run2.result,
                    username: initialState.user.data.user.username,
                    ...run2.entities,
                },
            },
        ];

        // const store = mockStore(initialState);
        const store = createTestStore(initialState);

        return store.dispatch(actions.getViewedJobs())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
            });
    });

    it('getViewedJobs() should cancel an active request when manually called', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/user/activity/jobs').reply(200, mockApiJobs, {});

        const cancel = sinon.spy();
        const cancelSource = { cancel };

        const store = createTestStore({
            ...initialState,
            exports: {
                ...initialState.exports,
                viewedInfo: {
                    ...initialState.exports.viewedInfo,
                    status: {
                        fetching: true,
                        cancelSource,
                    },
                },
            },
        });

        return store.dispatch(actions.getViewedJobs())
            .then(() => {
                expect(cancel.callCount).toBe(1);
                expect(cancel.calledWith('Request is no longer valid, cancelling.')).toBe(true);
            });
    });

    it('getViewedJobs() should NOT cancel an active request when automatically called', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/user/activity/jobs').reply(200, mockApiJobs, {});

        const cancel = sinon.spy();
        const cancelSource = { cancel };
        const store = createTestStore({
            ...initialState,
            exports: {
                ...initialState.exports,
                viewedInfo: {
                    ...initialState.viewedInfo,
                    status: {
                        fetching: true,
                        cancelSource,
                    },
                },
            },
        });

        const ret = store.dispatch(actions.getViewedJobs({ isAuto: true }));
        expect(cancel.called).toBe(false);
        expect(ret).toBe(null);
    });

    it('getViewedJobs() should handle the axios request being cancelled', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/user/activity/jobs').reply(400, 'oh no an error');

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);
        const cancelStub = sinon.stub(axios, 'isCancel').returns(true);

        const expectedActions = [
            { type: actions.types.FETCHING_VIEWED_JOBS, cancelSource: testSource },
        ];

        const store = createTestStore(initialState);


        return store.dispatch(actions.getViewedJobs())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
                cancelStub.restore();
            });
    });

    it('getViewedJobs() should handle a generic request error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/user/activity/jobs').reply(400, 'oh no an error');

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);

        const expectedActions = [
            { type: actions.types.FETCHING_VIEWED_JOBS, cancelSource: testSource },
            { type: actions.types.FETCH_VIEWED_JOBS_ERROR, error: 'oh no an error' },
        ];

        const store = createTestStore(initialState);


        return store.dispatch(actions.getViewedJobs())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
            });
    });
});
