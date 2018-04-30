import * as reducers from '../../reducers/notificationsReducer';
import initialState from '../../reducers/initialState';
import types from '../../actions/actionTypes';

const mockNotifications = {
    '1': {
        id: '1',
        unread: false,
        timestamp: 1
    },
    '2': {
        id: '2',
        unread: true,
        timestamp: 2
    },
};

const mockNotificationsArray = [
    mockNotifications['2'],
    mockNotifications['1'],
];

const mockNotificationsSorted = reducers.getSortedNotifications(mockNotifications);

const mockState = {
    ...initialState.notifications,
    notifications: mockNotifications,
    notificationsSorted: mockNotificationsSorted,
    unreadCount: {
        ...initialState.notifications.unreadCount,
        unreadCount: 1,
    },
};

describe('notificationsReducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.notificationsReducer(undefined, {})).toEqual(initialState.notifications);
    });

    it('should handle FETCHING_NOTIFICATIONS', () => {
        const action = {
            type: types.FETCHING_NOTIFICATIONS,
            cancelSource: 'test',
        };

        expect(reducers.notificationsReducer(initialState.notifications, action)).toEqual({
            ...initialState.notifications,
            fetching: true,
            fetched: false,
            error: null,
            cancelSource: 'test',
        });
    });

    it('should handle RECEIVED_NOTIFICATIONS', () => {
        const state = {
            ...initialState.notifications,
            fetching: true,
            cancelSource: 'test',
        };
        const action = {
            type: types.RECEIVED_NOTIFICATIONS,
            notifications: mockNotificationsArray,
            nextPage: true,
            range: '12/24',
        };

        expect(reducers.notificationsReducer(state, action)).toEqual({
            ...state,
            fetching: false,
            fetched: true,
            notifications: mockNotifications,
            notificationsSorted: mockNotificationsSorted,
            nextPage: action.nextPage,
            range: action.range,
            error: null,
            cancelSource: null,
        });
    });

    it('should handle FETCH_NOTIFICATIONS_ERROR', () => {
        const state = {
            ...initialState.notifications,
            fetching: true,
            cancelSource: 'test',
        };
        const action = {
            type: types.FETCH_NOTIFICATIONS_ERROR,
            error: 'oh no an error',
        };

        expect(reducers.notificationsReducer(state, action)).toEqual({
            ...state,
            fetching: false,
            fetched: false,
            error: action.error,
            cancelSource: null,
        });
    });

    it('should handle MARKING_NOTIFICATIONS_AS_READ', () => {
        const action = {
            type: types.MARKING_NOTIFICATIONS_AS_READ,
            notifications: mockNotificationsArray,
        };

        const expectedNotifications = {
            ...mockNotifications,
            '1': {
                ...mockNotifications['1'],
                unread: false,
            },
            '2': {
                ...mockNotifications['2'],
                unread: false,
            },
        };

        expect(reducers.notificationsReducer(mockState, action)).toEqual({
            ...mockState,
            notifications: expectedNotifications,
            notificationsSorted: reducers.getSortedNotifications(expectedNotifications),
            unreadCount: {
                ...mockState.unreadCount,
                unreadCount: 0,
            },
        });
    });

    it('should handle MARKED_NOTIFICATIONS_AS_READ', () => {
        const action = {
            type: types.MARKED_NOTIFICATIONS_AS_READ,
            notifications: mockNotificationsArray,
        };

        // This action is handled preemptively, so we should see the state unchanged here.
        expect(reducers.notificationsReducer(mockState, action)).toEqual(mockState);
    });

    it('should handle MARK_NOTIFICATIONS_AS_READ_ERROR', () => {
        const action = {
            type: types.MARK_NOTIFICATIONS_AS_READ_ERROR,
            error: 'oh no an error',
        };

        expect(reducers.notificationsReducer(mockState, action)).toEqual({
            ...mockState,
            error: action.error,
        });
    });

    it('should handle MARKING_NOTIFICATIONS_AS_UNREAD', () => {
        const action = {
            type: types.MARKING_NOTIFICATIONS_AS_UNREAD,
            notifications: mockNotificationsArray,
        };

        const expectedNotifications = {
            ...mockNotifications,
            '1': {
                ...mockNotifications['1'],
                unread: true,
            },
            '2': {
                ...mockNotifications['2'],
                unread: true,
            },
        };

        expect(reducers.notificationsReducer(mockState, action)).toEqual({
            ...mockState,
            notifications: expectedNotifications,
            notificationsSorted: reducers.getSortedNotifications(expectedNotifications),
            unreadCount: {
                ...mockState.unreadCount,
                unreadCount: 2,
            },
        });
    });

    it('should handle MARKED_NOTIFICATIONS_AS_UNREAD', () => {
        const action = {
            type: types.MARKED_NOTIFICATIONS_AS_UNREAD,
            notifications: mockNotificationsArray,
        };

        // This action is handled preemptively, so we should see the state unchanged here.
        expect(reducers.notificationsReducer(mockState, action)).toEqual(mockState);
    });

    it('should handle MARK_NOTIFICATIONS_AS_UNREAD_ERROR', () => {
        const action = {
            type: types.MARK_NOTIFICATIONS_AS_UNREAD_ERROR,
            error: 'oh no an error',
        };

        expect(reducers.notificationsReducer(mockState, action)).toEqual({
            ...mockState,
            error: action.error,
        });
    });

    it('should handle MARKING_ALL_NOTIFICATIONS_AS_READ', () => {
        const action = {
            type: types.MARKING_ALL_NOTIFICATIONS_AS_READ,
        };

        const expectedNotifications = {
            ...mockNotifications,
            '1': {
                ...mockNotifications['1'],
                unread: false,
            },
            '2': {
                ...mockNotifications['2'],
                unread: false,
            },
        };

        expect(reducers.notificationsReducer(mockState, action)).toEqual({
            ...mockState,
            notifications: expectedNotifications,
            notificationsSorted: reducers.getSortedNotifications(expectedNotifications),
            unreadCount: {
                ...mockState.unreadCount,
                unreadCount: 0,
            },
        });
    });

    it('should handle MARKED_ALL_NOTIFICATIONS_AS_READ', () => {
        const action = {
            type: types.MARKED_ALL_NOTIFICATIONS_AS_READ,
            notifications: mockNotificationsArray,
        };

        // This action is handled preemptively, so we should see the state unchanged here.
        expect(reducers.notificationsReducer(mockState, action)).toEqual(mockState);
    });

    it('should handle MARK_ALL_NOTIFICATIONS_AS_READ_ERROR', () => {
        const action = {
            type: types.MARK_ALL_NOTIFICATIONS_AS_READ_ERROR,
            error: 'oh no an error',
        };

        expect(reducers.notificationsReducer(mockState, action)).toEqual({
            ...mockState,
            error: action.error,
        });
    });

    it('should handle REMOVING_NOTIFICATIONS', () => {
        const action = {
            type: types.REMOVING_NOTIFICATIONS,
            notifications: mockNotificationsArray,
        };

        expect(reducers.notificationsReducer(mockState, action)).toEqual({
            ...mockState,
            notifications: {},
            notificationsSorted: [],
            unreadCount: {
                ...mockState.unreadCount,
                unreadCount: 0,
            },
        });
    });

    it('should handle REMOVED_NOTIFICATIONS', () => {
        const action = {
            type: types.REMOVED_NOTIFICATIONS,
            notifications: mockNotificationsArray,
        };

        // This action is handled preemptively, so we should see the state unchanged here.
        expect(reducers.notificationsReducer(mockState, action)).toEqual(mockState);
    });

    it('should handle REMOVE_NOTIFICATIONS_ERROR', () => {
        const action = {
            type: types.REMOVE_NOTIFICATIONS_ERROR,
            error: 'oh no an error',
        };

        expect(reducers.notificationsReducer(mockState, action)).toEqual({
            ...mockState,
            error: action.error,
        });
    });

    it('should handle FETCHING_NOTIFICATIONS_UNREAD_COUNT', () => {
        const action = {
            type: types.FETCHING_NOTIFICATIONS_UNREAD_COUNT,
        };

        expect(reducers.notificationsReducer(initialState.notifications, action)).toEqual({
            ...initialState.notifications,
            unreadCount: {
                ...initialState.notifications.unreadCount,
                fetching: true,
                fetched: false,
                error: null,
                cancelSource: action.cancelSource,
            },
        });
    });

    it('should handle RECEIVED_NOTIFICATIONS_UNREAD_COUNT', () => {
        const state = {
            ...initialState.notifications,
            unreadCount: {
                ...initialState.notifications.unreadCount,
                fetching: true,
                cancelSource: 'test',
            },
        };
        const action = {
            type: types.RECEIVED_NOTIFICATIONS_UNREAD_COUNT,
            unreadCount: 3,
        };

        expect(reducers.notificationsReducer(state, action)).toEqual({
            ...state,
            unreadCount: {
                ...state.unreadCount,
                fetching: false,
                fetched: true,
                unreadCount: action.unreadCount,
                cancelSource: null,
            },
        });
    });

    it('should handle FETCH_NOTIFICATIONS_UNREAD_COUNT_ERROR', () => {
        const state = {
            ...initialState.notifications,
            unreadCount: {
                ...initialState.notifications.unreadCount,
                fetching: true,
                cancelSource: 'test',
            },
        };
        const action = {
            type: types.FETCH_NOTIFICATIONS_UNREAD_COUNT_ERROR,
            error: 'oh no an error',
        };

        expect(reducers.notificationsReducer(state, action)).toEqual({
            ...state,
            unreadCount: {
                ...state.unreadCount,
                fetching: false,
                fetched: false,
                error: action.error,
                cancelSource: null,
            },
        });
    });

    it('should handle USER_LOGGED_OUT', () => {
        const action = {
            type: types.USER_LOGGED_OUT,
        };

        expect(reducers.notificationsReducer(mockNotifications, action)).toEqual(initialState.notifications);
    });
});
