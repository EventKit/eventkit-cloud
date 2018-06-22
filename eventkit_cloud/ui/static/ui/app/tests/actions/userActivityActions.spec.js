import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import sinon from 'sinon';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as actions from '../../actions/userActivityActions';
import types from '../../actions/actionTypes';
import initialState from '../../reducers/initialState';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const mockViewedJobs = [
    {
        last_export_run: {
            job: {
                visibility: '',
                permissions: {
                    groups: [],
                    users: [],
                },
            },
        },
    },
    {
        last_export_run: {
            job: {
                visibility: '',
                permissions: {
                    groups: [],
                    users: [],
                },
            },
        },
    },
];

const processedViewedJobs = mockViewedJobs.map((viewedJob) => {
    const newViewedJob = { ...viewedJob };
    const run = newViewedJob.last_export_run;
    run.job.permissions = {
        value: run.job.visibility,
        groups: run.job.permissions.groups,
        members: run.job.permissions.users,
    };
    return newViewedJob;
});

describe('userActivityActions', () => {
    it('getViewedJobs() should send the received array of viewed jobs to the reducer', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/user/activity/jobs').reply(200, mockViewedJobs, {
            link: '<www.link.com>; rel="next",something else', 'content-range': 'range 1-12/24',
        });

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);

        const expectedActions = [
            { type: types.FETCHING_VIEWED_JOBS, cancelSource: testSource },
            {
                type: types.RECEIVED_VIEWED_JOBS, viewedJobs: processedViewedJobs, nextPage: true, range: '12/24',
            },
        ];

        const store = mockStore(initialState);

        return store.dispatch(actions.getViewedJobs())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
            });
    });

    it('getViewedJobs() should handle empty header', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/user/activity/jobs').reply(200, mockViewedJobs, {});

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);

        const expectedActions = [
            { type: types.FETCHING_VIEWED_JOBS, cancelSource: testSource },
            {
                type: types.RECEIVED_VIEWED_JOBS, viewedJobs: processedViewedJobs, nextPage: false, range: '',
            },
        ];

        const store = mockStore(initialState);

        return store.dispatch(actions.getViewedJobs())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
            });
    });

    it('getViewedJobs() should cancel an active request when manually called', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/user/activity/jobs').reply(200, mockViewedJobs, {});

        const cancel = sinon.spy();
        const cancelSource = { cancel };
        const store = mockStore({
            ...initialState,
            userActivity: {
                ...initialState.userActivity,
                viewedJobs: {
                    ...initialState.userActivity.viewedJobs,
                    fetching: true,
                    cancelSource,
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
        mock.onGet('/api/user/activity/jobs').reply(200, mockViewedJobs, {});

        const cancel = sinon.spy();
        const cancelSource = { cancel };
        const store = mockStore({
            ...initialState,
            userActivity: {
                ...initialState.userActivity,
                viewedJobs: {
                    ...initialState.userActivity.viewedJobs,
                    fetching: true,
                    cancelSource,
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
            { type: types.FETCHING_VIEWED_JOBS, cancelSource: testSource },
        ];

        const store = mockStore(initialState);

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
            { type: types.FETCHING_VIEWED_JOBS, cancelSource: testSource },
            { type: types.FETCH_VIEWED_JOBS_ERROR, error: 'oh no an error' },
        ];

        const store = mockStore(initialState);

        return store.dispatch(actions.getViewedJobs())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
            });
    });
});
