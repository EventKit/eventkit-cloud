import moment from 'moment';
import { notificationsReducer, getSortedNotifications, initialState as initial } from '../../reducers/notificationsReducer';
import { types } from '../../actions/notificationsActions';

const initialState = { notifications: initial };
const mockNotifications = {
    1: {
        id: '1',
        timestamp: '2018-05-04T17:32:04.716806Z',
        unread: false,
    },
    2: {
        id: '2',
        timestamp: '2018-05-04T17:34:04.716806Z',
        unread: true,
    },
    3: {
        id: '3',
        timestamp: '2018-05-04T17:36:04.716806Z',
        unread: true,
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
            cancelSource: 'test',
            type: types.FETCHING_NOTIFICATIONS,
        };

        expect(notificationsReducer(initialState.notifications, action)).toEqual({
            ...initialState.notifications,
            status: {
                ...initialState.notifications.status,
                cancelSource: 'test',
                error: null,
                fetched: false,
                fetching: true,
            },
        });
    });

    it('should handle RECEIVED_NOTIFICATIONS', () => {
        const state = {
            ...initialState.notifications,
            cancelSource: 'test',
            fetching: true,
        };
        const action = {
            nextPage: true,
            notifications: mockNotificationsArray,
            range: '12/24',
            type: types.RECEIVED_NOTIFICATIONS,
        };

        expect(notificationsReducer(state, action)).toEqual({
            ...state,
            data: {
                nextPage: action.nextPage,
                notifications: mockNotifications,
                notificationsSorted: getSortedNotifications(mockNotifications),
                range: action.range,
            },
            status: {
                ...state.status,
                cancelSource: null,
                error: null,
                fetched: true,
                fetching: false,
            },
        });
    });

    it('should handle FETCH_NOTIFICATIONS_ERROR', () => {
        const state = {
            ...initialState.notifications,
            status: {
                cancelSource: 'test',
                fetching: true,
            },
        };
        const action = {
            error: 'oh no an error',
            type: types.FETCH_NOTIFICATIONS_ERROR,
        };

        expect(notificationsReducer(state, action)).toEqual({
            ...state,
            status: {
                cancelSource: null,
                error: action.error,
                fetched: false,
                fetching: false,
            },
        });
    });

    it('should handle MARKING_NOTIFICATIONS_AS_READ', () => {
        const action = {
            notifications: mockNotificationsArray,
            type: types.MARKING_NOTIFICATIONS_AS_READ,
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
            notifications: mockNotificationsArray,
            type: types.MARKED_NOTIFICATIONS_AS_READ,
        };

        // This action is handled preemptively, so we should see the state unchanged here.
        expect(notificationsReducer(mockState, action)).toEqual(mockState);
    });

    it('should handle MARK_NOTIFICATIONS_AS_READ_ERROR', () => {
        const action = {
            error: 'oh no an error',
            type: types.MARK_NOTIFICATIONS_AS_READ_ERROR,
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
            notifications: mockNotificationsArray,
            type: types.MARKING_NOTIFICATIONS_AS_UNREAD,
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
            notifications: mockNotificationsArray,
            type: types.MARKED_NOTIFICATIONS_AS_UNREAD,
        };

        // This action is handled preemptively, so we should see the state unchanged here.
        expect(notificationsReducer(mockState, action)).toEqual(mockState);
    });

    it('should handle MARK_NOTIFICATIONS_AS_UNREAD_ERROR', () => {
        const action = {
            error: 'oh no an error',
            type: types.MARK_NOTIFICATIONS_AS_UNREAD_ERROR,
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
            notifications: mockNotificationsArray,
            type: types.MARKED_ALL_NOTIFICATIONS_AS_READ,
        };

        // This action is handled preemptively, so we should see the state unchanged here.
        expect(notificationsReducer(mockState, action)).toEqual(mockState);
    });

    it('should handle MARK_ALL_NOTIFICATIONS_AS_READ_ERROR', () => {
        const action = {
            error: 'oh no an error',
            type: types.MARK_ALL_NOTIFICATIONS_AS_READ_ERROR,
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
            notifications: mockNotificationsArray,
            type: types.REMOVING_NOTIFICATIONS,
        };

        expect(notificationsReducer(mockState, action)).toEqual({
            ...mockState,
            data: {
                notifications: {},
                notificationsSorted: [],
            },
            status: {
                ...mockState.status,
                deleted: false,
                deleting: true,
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
            notifications: mockNotificationsArray,
            type: types.REMOVED_NOTIFICATIONS,
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
            error: 'oh no an error',
            type: types.REMOVE_NOTIFICATIONS_ERROR,
        };

        expect(notificationsReducer(mockState, action)).toEqual({
            ...mockState,
            status: {
                ...mockState.status,
                deleted: false,
                deleting: false,
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
                    cancelSource: action.cancelSource,
                    error: null,
                    fetched: false,
                    fetching: true,
                },
            },
        });
    });

    it('should handle RECEIVED_NOTIFICATIONS_UNREAD_COUNT', () => {
        const state = {
            ...initialState.notifications,
            unreadCount: {
                ...initialState.notifications.unreadCount,
                cancelSource: 'test',
                fetching: true,
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
                data: {
                    unreadCount: action.unreadCount,
                },
                status: {
                    cancelSource: null,
                    error: null,
                    fetched: true,
                    fetching: false,
                },
            },
        });
    });

    it('should handle FETCH_NOTIFICATIONS_UNREAD_COUNT_ERROR', () => {
        const state = {
            ...initialState.notifications,
            unreadCount: {
                ...initialState.notifications.unreadCount,
                cancelSource: 'test',
                fetching: true,
            },
        };
        const action = {
            error: 'oh no an error',
            type: types.FETCH_NOTIFICATIONS_UNREAD_COUNT_ERROR,
        };

        expect(notificationsReducer(state, action)).toEqual({
            ...state,
            unreadCount: {
                ...state.unreadCount,
                status: {
                    cancelSource: null,
                    error: action.error,
                    fetched: false,
                    fetching: false,
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
