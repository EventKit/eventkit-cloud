import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import sinon from 'sinon';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as actions from '../../actions/notificationsActions';
import { initialState } from '../../reducers/notificationsReducer';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const mockNotifications = {
    1: {
        id: 1,
        unread: true,
        timestamp: '2018-05-04T17:32:04.716806Z',
    },
    2: {
        id: 2,
        unread: false,
        timestamp: '2018-05-04T17:33:04.716806Z',
    },
};

const mockNotificationsArray = [
    mockNotifications['1'],
    mockNotifications['2'],
];

describe('notificationsActions', () => {
    it('getNotifications() should send the received array of notifications to the reducer', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/notifications/all').reply(200, mockNotificationsArray, {
            link: '<www.link.com>; rel="next",something else', 'content-range': 'range 1-12/24',
        });

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);

        const expectedActions = [
            { type: actions.types.FETCHING_NOTIFICATIONS, cancelSource: testSource },
            {
                type: actions.types.RECEIVED_NOTIFICATIONS,
                notifications: mockNotificationsArray,
                nextPage: true,
                range: '12/24',
            },
        ];

        const store = mockStore(initialState);

        return store.dispatch(actions.getNotifications())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
            });
    });

    it('getNotifications() should handle empty header', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/notifications/all').reply(200, mockNotificationsArray, {});

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);

        const expectedActions = [
            { type: actions.types.FETCHING_NOTIFICATIONS, cancelSource: testSource },
            {
                type: actions.types.RECEIVED_NOTIFICATIONS, notifications: mockNotificationsArray, nextPage: false, range: '',
            },
        ];

        const store = mockStore(initialState);

        return store.dispatch(actions.getNotifications())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
            });
    });

    it('getNotifications() should cancel an active request when manually called', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/notifications/all').reply(200, mockNotificationsArray, {});

        const cancel = sinon.spy();
        const cancelSource = { cancel };
        const store = mockStore({
            ...initialState,
            notifications: {
                ...initialState.notifications,
                fetching: true,
                cancelSource,
            },
        });

        return store.dispatch(actions.getNotifications())
            .then(() => {
                expect(cancel.callCount).toBe(1);
                expect(cancel.calledWith('Request is no longer valid, cancelling.')).toBe(true);
            });
    });

    it('getNotifications() should NOT cancel an active request when automatically called', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/notifications/all').reply(200, mockNotificationsArray, {});

        const cancel = sinon.spy();
        const cancelSource = { cancel };
        const store = mockStore({
            ...initialState,
            notifications: {
                ...initialState.notifications,
                fetching: true,
                cancelSource,
            },
        });

        const ret = store.dispatch(actions.getNotifications({ isAuto: true }));
        expect(cancel.called).toBe(false);
        expect(ret).toBe(null);
    });

    it('getNotifications() should handle the axios request being cancelled', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/notifications/all').reply(400, 'oh no an error');

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);
        const cancelStub = sinon.stub(axios, 'isCancel').returns(true);

        const expectedActions = [
            { type: actions.types.FETCHING_NOTIFICATIONS, cancelSource: testSource },
        ];

        const store = mockStore(initialState);

        return store.dispatch(actions.getNotifications())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
                cancelStub.restore();
            });
    });

    it('getNotifications() should handle a generic request error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/notifications/all').reply(400, 'oh no an error');

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);

        const expectedActions = [
            { type: actions.types.FETCHING_NOTIFICATIONS, cancelSource: testSource },
            { type: actions.types.FETCH_NOTIFICATIONS_ERROR, error: 'oh no an error' },
        ];

        const store = mockStore(initialState);

        return store.dispatch(actions.getNotifications())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
            });
    });

    it('getNotificationsUnreadCount() should send the unread count to the reducer', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/notifications/counts').reply(200, { read: 1, unread: 1 });

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);

        const expectedActions = [
            { type: actions.types.FETCHING_NOTIFICATIONS_UNREAD_COUNT, cancelSource: testSource },
            { type: actions.types.RECEIVED_NOTIFICATIONS_UNREAD_COUNT, unreadCount: 1 },
        ];

        const store = mockStore(initialState);

        return store.dispatch(actions.getNotificationsUnreadCount())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
            });
    });

    it('getNotificationsUnreadCount() should cancel an active request when manually called', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/notifications/counts').reply(200, { read: 1, unread: 1 });

        const cancel = sinon.spy();
        const cancelSource = { cancel };
        const store = mockStore({
            ...initialState,
            notifications: {
                ...initialState.notifications,
                unreadCount: {
                    ...initialState.notifications.unreadCount,
                    fetching: true,
                    cancelSource,
                },
            },
        });

        return store.dispatch(actions.getNotificationsUnreadCount())
            .then(() => {
                expect(cancel.callCount).toBe(1);
                expect(cancel.calledWith('Request is no longer valid, cancelling.')).toBe(true);
            });
    });

    it('getNotificationsUnreadCount() should NOT cancel an active request when automatically called', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/notifications/counts').reply(200, { read: 1, unread: 1 });

        const cancel = sinon.spy();
        const cancelSource = { cancel };
        const store = mockStore({
            ...initialState,
            notifications: {
                ...initialState.notifications,
                unreadCount: {
                    ...initialState.notifications.unreadCount,
                    fetching: true,
                    cancelSource,
                },
            },
        });

        const ret = store.dispatch(actions.getNotificationsUnreadCount({ isAuto: true }));
        expect(cancel.called).toBe(false);
        expect(ret).toBe(null);
    });

    it('getNotificationsUnreadCount() should handle the axios request being cancelled', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/notifications/counts').reply(400, 'oh no an error');

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);
        const cancelStub = sinon.stub(axios, 'isCancel').returns(true);

        const expectedActions = [
            { type: actions.types.FETCHING_NOTIFICATIONS_UNREAD_COUNT, cancelSource: testSource },
        ];

        const store = mockStore(initialState);

        return store.dispatch(actions.getNotificationsUnreadCount())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
                cancelStub.restore();
            });
    });

    it('getNotificationsUnreadCount() should handle a generic request error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/api/notifications/counts').reply(400, 'oh no an error');

        const testSource = axios.CancelToken.source();
        const original = axios.CancelToken.source;
        axios.CancelToken.source = () => (testSource);

        const expectedActions = [
            { type: actions.types.FETCHING_NOTIFICATIONS_UNREAD_COUNT, cancelSource: testSource },
            { type: actions.types.FETCH_NOTIFICATIONS_UNREAD_COUNT_ERROR, error: 'oh no an error' },
        ];

        const store = mockStore(initialState);

        return store.dispatch(actions.getNotificationsUnreadCount())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
                axios.CancelToken.source = original;
            });
    });

    it('markNotificationsAsRead() should send the marked notifications to the reducer', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/notifications/mark').reply(200);

        const expectedActions = [
            { type: actions.types.MARKING_NOTIFICATIONS_AS_READ, notifications: [mockNotificationsArray[0]] },
            { type: actions.types.MARKED_NOTIFICATIONS_AS_READ, notifications: [mockNotificationsArray[0]] },
        ];

        const store = mockStore(initialState);

        return store.dispatch(actions.markNotificationsAsRead([mockNotificationsArray[0]]))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('markNotificationsAsRead() should handle a generic request error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/notifications/mark').reply(400, 'oh no an error');

        const expectedActions = [
            { type: actions.types.MARKING_NOTIFICATIONS_AS_READ, notifications: [mockNotificationsArray[0]] },
            { type: actions.types.MARK_NOTIFICATIONS_AS_READ_ERROR, error: 'oh no an error' },
        ];

        const store = mockStore(initialState);

        return store.dispatch(actions.markNotificationsAsRead([mockNotificationsArray[0]]))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('markNotificationsAsUnread() should send the marked notifications to the reducer', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/notifications/mark').reply(200);

        const expectedActions = [
            { type: actions.types.MARKING_NOTIFICATIONS_AS_UNREAD, notifications: [mockNotificationsArray[1]] },
            { type: actions.types.MARKED_NOTIFICATIONS_AS_UNREAD, notifications: [mockNotificationsArray[1]] },
        ];

        const store = mockStore(initialState);

        return store.dispatch(actions.markNotificationsAsUnread([mockNotificationsArray[1]]))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('markNotificationsAsUnread() should handle a generic request error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/notifications/mark').reply(400, 'oh no an error');

        const expectedActions = [
            { type: actions.types.MARKING_NOTIFICATIONS_AS_UNREAD, notifications: [mockNotificationsArray[1]] },
            { type: actions.types.MARK_NOTIFICATIONS_AS_UNREAD_ERROR, error: 'oh no an error' },
        ];

        const store = mockStore(initialState);

        return store.dispatch(actions.markNotificationsAsUnread([mockNotificationsArray[1]]))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('removeNotifications() should send the removed notifications to the reducer', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/notifications/mark').reply(200);

        const expectedActions = [
            { type: actions.types.REMOVING_NOTIFICATIONS, notifications: [mockNotificationsArray[0]] },
            { type: actions.types.REMOVED_NOTIFICATIONS, notifications: [mockNotificationsArray[0]] },
        ];

        const store = mockStore(initialState);

        return store.dispatch(actions.removeNotifications([mockNotificationsArray[0]]))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('removeNotifications() should handle a generic request error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/notifications/mark').reply(400, 'oh no an error');

        const expectedActions = [
            { type: actions.types.REMOVING_NOTIFICATIONS, notifications: [mockNotificationsArray[0]] },
            { type: actions.types.REMOVE_NOTIFICATIONS_ERROR, error: 'oh no an error' },
        ];

        const store = mockStore(initialState);

        return store.dispatch(actions.removeNotifications([mockNotificationsArray[0]]))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('markAllNotificationsAsRead() should send the actions to the reducer', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/notifications/mark_all_as_read').reply(200);

        const expectedActions = [
            { type: actions.types.MARKING_ALL_NOTIFICATIONS_AS_READ },
            { type: actions.types.MARKED_ALL_NOTIFICATIONS_AS_READ },
        ];

        const store = mockStore(initialState);

        return store.dispatch(actions.markAllNotificationsAsRead())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('markAllNotificationsAsRead() should handle a generic request error', () => {
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onPost('/api/notifications/mark_all_as_read').reply(400, 'oh no an error');

        const expectedActions = [
            { type: actions.types.MARKING_ALL_NOTIFICATIONS_AS_READ },
            { type: actions.types.MARK_ALL_NOTIFICATIONS_AS_READ_ERROR, error: 'oh no an error' },
        ];

        const store = mockStore(initialState);

        return store.dispatch(actions.markAllNotificationsAsRead())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });
});
