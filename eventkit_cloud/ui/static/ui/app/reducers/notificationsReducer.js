import values from 'lodash/values';
import moment from 'moment';
import { types } from '../actions/notificationsActions';


const initialState = {
    fetching: false,
    fetched: false,
    notifications: {},
    notificationsSorted: [],
    error: null,
    cancelSource: null,
    unreadCount: {
        fetching: false,
        fetched: false,
        unreadCount: 0,
        cancelSource: null,
    },
};

export function getSortedNotifications(notificationsObj) {
    const notificationsSorted = values(notificationsObj);
    notificationsSorted.sort((a, b) => moment(b.timestamp) - moment(a.timestamp));
    return notificationsSorted;
}

export function notificationsReducer(state = initialState, action) {
    switch (action.type) {
        case types.FETCHING_NOTIFICATIONS:
            return {
                ...state,
                fetching: true,
                fetched: false,
                error: null,
                cancelSource: action.cancelSource,
            };
        case types.RECEIVED_NOTIFICATIONS: {
            const notifications = { ...state.notifications };
            action.notifications.forEach((notification) => {
                notifications[notification.id] = notification;
            });

            return {
                ...state,
                fetching: false,
                fetched: true,
                notifications,
                notificationsSorted: getSortedNotifications(notifications),
                nextPage: action.nextPage,
                range: action.range,
                error: null,
                cancelSource: null,
            };
        }
        case types.FETCH_NOTIFICATIONS_ERROR:
            return {
                ...state,
                fetching: false,
                fetched: false,
                error: action.error,
                cancelSource: null,
            };
        case types.MARKING_NOTIFICATIONS_AS_READ: {
            const notifications = { ...state.notifications };
            let { unreadCount } = state.unreadCount;
            action.notifications.forEach((notification) => {
                if (notifications[notification.id].unread) {
                    unreadCount -= 1;
                }
                notifications[notification.id] = {
                    ...notifications[notification.id],
                    unread: false,
                };
            });
            return {
                ...state,
                notifications,
                notificationsSorted: getSortedNotifications(notifications),
                unreadCount: {
                    ...state.unreadCount,
                    unreadCount,
                },
            };
        }
        case types.MARK_NOTIFICATIONS_AS_READ_ERROR:
            return {
                ...state,
                error: action.error,
            };
        case types.MARKING_NOTIFICATIONS_AS_UNREAD: {
            const notifications = { ...state.notifications };
            let { unreadCount } = state.unreadCount;
            action.notifications.forEach((notification) => {
                if (!notifications[notification.id].unread) {
                    unreadCount += 1;
                }
                notifications[notification.id] = {
                    ...notifications[notification.id],
                    unread: true,
                };
            });

            return {
                ...state,
                notifications,
                notificationsSorted: getSortedNotifications(notifications),
                unreadCount: {
                    ...state.unreadCount,
                    unreadCount,
                },
            };
        }
        case types.MARK_NOTIFICATIONS_AS_UNREAD_ERROR:
            return {
                ...state,
                error: action.error,
            };
        case types.MARKING_ALL_NOTIFICATIONS_AS_READ: {
            const notifications = { ...state.notifications };
            Object.keys(notifications).forEach((id) => {
                notifications[id] = {
                    ...notifications[id],
                    unread: false,
                };
            });

            return {
                ...state,
                notifications,
                notificationsSorted: getSortedNotifications(notifications),
                unreadCount: {
                    ...state.unreadCount,
                    unreadCount: 0,
                },
            };
        }
        case types.MARK_ALL_NOTIFICATIONS_AS_READ_ERROR:
            return {
                ...state,
                error: action.error,
            };
        case types.REMOVING_NOTIFICATIONS: {
            const notifications = { ...state.notifications };
            let { unreadCount } = state.unreadCount;
            action.notifications.forEach((notification) => {
                if (notifications[notification.id].unread) {
                    unreadCount -= 1;
                }
                delete notifications[notification.id];
            });
            return {
                ...state,
                notifications,
                notificationsSorted: getSortedNotifications(notifications),
                unreadCount: {
                    ...state.unreadCount,
                    unreadCount,
                },
            };
        }
        case types.REMOVE_NOTIFICATIONS_ERROR:
            return {
                ...state,
                error: action.error,
            };
        case types.FETCHING_NOTIFICATIONS_UNREAD_COUNT:
            return {
                ...state,
                unreadCount: {
                    ...state.unreadCount,
                    fetching: true,
                    fetched: false,
                    error: null,
                    cancelSource: action.cancelSource,
                },
            };
        case types.RECEIVED_NOTIFICATIONS_UNREAD_COUNT:
            return {
                ...state,
                unreadCount: {
                    ...state.unreadCount,
                    fetching: false,
                    fetched: true,
                    unreadCount: action.unreadCount,
                    cancelSource: null,
                },
            };
        case types.FETCH_NOTIFICATIONS_UNREAD_COUNT_ERROR:
            return {
                ...state,
                unreadCount: {
                    ...state.unreadCount,
                    fetching: false,
                    fetched: false,
                    error: action.error,
                    cancelSource: null,
                },
            };
        case types.USER_LOGGED_OUT:
            return initialState;
        default:
            return state;
    }
}
