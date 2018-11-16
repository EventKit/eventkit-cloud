import moment from 'moment';
import { notificationsReducer, getSortedNotifications, initialState as initial } from '../../reducers/notificationsReducer';
import { types } from '../../actions/notificationsActions';

const initialState = { notifications: initial };
const mockNotifications = {
    1: {
        id: '1',
        unread: false,
        timestamp: '2018-05-04T17:32:04.716806Z',
    },
    2: {
        id: '2',
        unread: true,
        timestamp: '2018-05-04T17:34:04.716806Z',
    },
    3: {
        id: '3',
        unread: true,
        timestamp: '2018-05-04T17:36:04.716806Z',
    },
};

const mockNotificationsArray = [
    mockNotifications['1'],
    mockNotifications['2'],
    mockNotifications['3'],
];

const mockState = {
    ...initialState.notifications,
    data: {
        notifications: mockNotifications,
        notificationsSorted: getSortedNotifications(mockNotifications),
    },
    unreadCount: {
        ...initialState.notifications.unreadCount,
        data: {
            unreadCount: 2,
        },
    },
};

describe('notificationsReducer', () => {
    it('it should return the initial state', () => {
        expect(notificationsReducer(undefined, {})).toEqual(initialState.notifications);
    });

    it('should handle FETCHING_NOTIFICATIONS', () => {
        const action = {
            type: types.FETCHING_NOTIFICATIONS,
            cancelSource: 'test',
        };

        expect(notificationsReducer(initialState.notifications, action)).toEqual({
            ...initialState.notifications,
            status: {
                ...initialState.notifications.status,
                fetching: true,
                fetched: false,
                error: null,
                cancelSource: 'test',
            },
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

        expect(notificationsReducer(state, action)).toEqual({
            ...state,
            status: {
                ...state.status,
                fetching: false,
                fetched: true,
                error: null,
                cancelSource: null,
            },
            data: {
                notifications: mockNotifications,
                notificationsSorted: getSortedNotifications(mockNotifications),
                nextPage: action.nextPage,
                range: action.range,
            },
        });
    });

    it('should handle FETCH_NOTIFICATIONS_ERROR', () => {
        const state = {
            ...initialState.notifications,
            status: {
                fetching: true,
                cancelSource: 'test',
            },
        };
        const action = {
            type: types.FETCH_NOTIFICATIONS_ERROR,
            error: 'oh no an error',
        };

        expect(notificationsReducer(state, action)).toEqual({
            ...state,
            status: {
                fetching: false,
                fetched: false,
                error: action.error,
                cancelSource: null,
            },
        });
    });

    it('should handle MARKING_NOTIFICATIONS_AS_READ', () => {
        const action = {
            type: types.MARKING_NOTIFICATIONS_AS_READ,
            notifications: mockNotificationsArray,
        };

        const expectedNotifications = {
            ...mockNotifications,
            1: {
                ...mockNotifications['1'],
                unread: false,
            },
            2: {
                ...mockNotifications['2'],
                unread: false,
            },
            3: {
                ...mockNotifications['3'],
                unread: false,
            },
        };

        expect(notificationsReducer(mockState, action)).toEqual({
            ...mockState,
            data: {
                notifications: expectedNotifications,
                notificationsSorted: getSortedNotifications(expectedNotifications),
            },
            unreadCount: {
                ...mockState.unreadCount,
                data: { unreadCount: 0 },
            },
        });
    });

    it('should handle MARKED_NOTIFICATIONS_AS_READ', () => {
        const action = {
            type: types.MARKED_NOTIFICATIONS_AS_READ,
            notifications: mockNotificationsArray,
        };

        // This action is handled preemptively, so we should see the state unchanged here.
        expect(notificationsReducer(mockState, action)).toEqual(mockState);
    });

    it('should handle MARK_NOTIFICATIONS_AS_READ_ERROR', () => {
        const action = {
            type: types.MARK_NOTIFICATIONS_AS_READ_ERROR,
            error: 'oh no an error',
        };

        expect(notificationsReducer(mockState, action)).toEqual({
            ...mockState,
            status: {
                ...mockState.status,
                error: action.error,
            },
        });
    });

    it('should handle MARKING_NOTIFICATIONS_AS_UNREAD', () => {
        const action = {
            type: types.MARKING_NOTIFICATIONS_AS_UNREAD,
            notifications: mockNotificationsArray,
        };

        const expectedNotifications = {
            ...mockNotifications,
            1: {
                ...mockNotifications['1'],
                unread: true,
            },
            2: {
                ...mockNotifications['2'],
                unread: true,
            },
            3: {
                ...mockNotifications['3'],
                unread: true,
            },
        };

        expect(notificationsReducer(mockState, action)).toEqual({
            ...mockState,
            data: {
                notifications: expectedNotifications,
                notificationsSorted: getSortedNotifications(expectedNotifications),
            },
            unreadCount: {
                ...mockState.unreadCount,
                data: { unreadCount: 3 },
            },
        });
    });

    it('should handle MARKED_NOTIFICATIONS_AS_UNREAD', () => {
        const action = {
            type: types.MARKED_NOTIFICATIONS_AS_UNREAD,
            notifications: mockNotificationsArray,
        };

        // This action is handled preemptively, so we should see the state unchanged here.
        expect(notificationsReducer(mockState, action)).toEqual(mockState);
    });

    it('should handle MARK_NOTIFICATIONS_AS_UNREAD_ERROR', () => {
        const action = {
            type: types.MARK_NOTIFICATIONS_AS_UNREAD_ERROR,
            error: 'oh no an error',
        };

        expect(notificationsReducer(mockState, action)).toEqual({
            ...mockState,
            status: {
                ...mockState.status,
                error: action.error,
            },
        });
    });

    it('should handle MARKING_ALL_NOTIFICATIONS_AS_READ', () => {
        const action = {
            type: types.MARKING_ALL_NOTIFICATIONS_AS_READ,
        };

        const expectedNotifications = {
            ...mockNotifications,
            1: {
                ...mockNotifications['1'],
                unread: false,
            },
            2: {
                ...mockNotifications['2'],
                unread: false,
            },
            3: {
                ...mockNotifications['3'],
                unread: false,
            },
        };

        expect(notificationsReducer(mockState, action)).toEqual({
            ...mockState,
            data: {
                notifications: expectedNotifications,
                notificationsSorted: getSortedNotifications(expectedNotifications),
            },
            unreadCount: {
                ...mockState.unreadCount,
                data: { unreadCount: 0 },
            },
        });
    });

    it('should handle MARKED_ALL_NOTIFICATIONS_AS_READ', () => {
        const action = {
            type: types.MARKED_ALL_NOTIFICATIONS_AS_READ,
            notifications: mockNotificationsArray,
        };

        // This action is handled preemptively, so we should see the state unchanged here.
        expect(notificationsReducer(mockState, action)).toEqual(mockState);
    });

    it('should handle MARK_ALL_NOTIFICATIONS_AS_READ_ERROR', () => {
        const action = {
            type: types.MARK_ALL_NOTIFICATIONS_AS_READ_ERROR,
            error: 'oh no an error',
        };

        expect(notificationsReducer(mockState, action)).toEqual({
            ...mockState,
            status: {
                ...mockState.status,
                error: action.error,
            },
        });
    });

    it('should handle REMOVING_NOTIFICATIONS', () => {
        const action = {
            type: types.REMOVING_NOTIFICATIONS,
            notifications: mockNotificationsArray,
        };

        expect(notificationsReducer(mockState, action)).toEqual({
            ...mockState,
            status: {
                ...mockState.status,
                deleted: false,
                deleting: true,
            },
            data: {
                notifications: {},
                notificationsSorted: [],
            },
            unreadCount: {
                ...mockState.unreadCount,
                data: {
                    unreadCount: 0,
                },
            },
        });
    });

    it('should handle REMOVED_NOTIFICATIONS', () => {
        const action = {
            type: types.REMOVED_NOTIFICATIONS,
            notifications: mockNotificationsArray,
        };

        // This action is handled preemptively, so we should see the state unchanged here.
        expect(notificationsReducer(mockState, action)).toEqual({
            ...mockState,
            status: {
                ...mockState.status,
                deleted: true,
                deleting: false,
            },
        });
    });

    it('should handle REMOVE_NOTIFICATIONS_ERROR', () => {
        const action = {
            type: types.REMOVE_NOTIFICATIONS_ERROR,
            error: 'oh no an error',
        };

        expect(notificationsReducer(mockState, action)).toEqual({
            ...mockState,
            status: {
                ...mockState.status,
                deleting: false,
                deleted: false,
                error: action.error,
            },
        });
    });

    it('should handle FETCHING_NOTIFICATIONS_UNREAD_COUNT', () => {
        const action = {
            type: types.FETCHING_NOTIFICATIONS_UNREAD_COUNT,
        };

        expect(notificationsReducer(initialState.notifications, action)).toEqual({
            ...initialState.notifications,
            unreadCount: {
                ...initialState.notifications.unreadCount,
                status: {
                    fetching: true,
                    fetched: false,
                    error: null,
                    cancelSource: action.cancelSource,
                },
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

        expect(notificationsReducer(state, action)).toEqual({
            ...state,
            unreadCount: {
                ...state.unreadCount,
                status: {
                    fetching: false,
                    fetched: true,
                    error: null,
                    cancelSource: null,
                },
                data: {
                    unreadCount: action.unreadCount,
                },
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

        expect(notificationsReducer(state, action)).toEqual({
            ...state,
            unreadCount: {
                ...state.unreadCount,
                status: {
                    fetching: false,
                    fetched: false,
                    error: action.error,
                    cancelSource: null,
                },
            },
        });
    });

    it('should handle USER_LOGGED_OUT', () => {
        const action = {
            type: types.USER_LOGGED_OUT,
        };

        expect(notificationsReducer(mockNotifications, action)).toEqual(initialState.notifications);
    });

    it('should sort notifications by descending date', () => {
        const notificationsSorted = getSortedNotifications(mockNotifications);
        for (let i = 0; i < notificationsSorted.length; i += 1) {
            if (i !== 0) {
                const notification = notificationsSorted[i];
                const prevNotification = notificationsSorted[i - 1];
                expect(moment(notification.timestamp) < moment(prevNotification.timestamp)).toBe(true);
            }
        }
    });
});
