import initialState from './initialState';
import types from '../actions/actionTypes';
import values from 'lodash/values';

export function notificationsReducer(state = initialState.notifications, action) {
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
            for (let notification of action.notifications) {
                notifications[notification.uid] = notification;
            }

            return {
                ...state,
                fetching: false,
                fetched: true,
                notifications: notifications,
                notificationsSorted: getSortedNotifications(notifications),
                nextPage: action.nextPage,
                range: action.range,
                error: action.error,
                cancelSource: null,
            };
        }
        case types.FETCH_NOTIFICATIONS_ERROR:
            return {
                ...state,
                fetching: false,
                fetched: false,
                notifications: [],
                error: action.error,
                cancelSource: null,
            };
        case types.MARKING_NOTIFICATIONS_AS_READ: {
            const notifications = { ...state.notifications };
            let unreadCount = state.unreadCount.unreadCount;
            for (let notification of action.notifications) {
                const uid = notification.uid;
                if (!notifications[uid].read) {
                    unreadCount--;
                }
                notifications[uid] = {
                    ...notifications[uid],
                    read: true,
                }
            }
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
        case types.MARKING_NOTIFICATIONS_AS_UNREAD: {
            const notifications = { ...state.notifications };
            let unreadCount = state.unreadCount.unreadCount;
            for (let notification of action.notifications) {
                const uid = notification.uid;
                if (notifications[uid].read) {
                    unreadCount++;
                }
                notifications[uid] = {
                    ...notifications[uid],
                    read: false,
                }
            }
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
        case types.MARKING_ALL_NOTIFICATIONS_AS_READ:
            const notifications = { ...state.notifications };
            for (let uid of Object.keys(notifications)) {
                notifications[uid] = {
                    ...notifications[uid],
                    read: true,
                }
            }
            return {
                ...state,
                notifications,
                notificationsSorted: getSortedNotifications(notifications),
                unreadCount: {
                    ...state.unreadCount,
                    unreadCount: 0,
                }
            };
        case types.REMOVING_NOTIFICATIONS: {
            let notifications = { ...state.notifications };
            let unreadCount = state.unreadCount.unreadCount;
            for (let notification of action.notifications) {
                const uid = notification.uid;
                if (!notifications[uid].read) {
                    unreadCount--;
                }
                delete notifications[uid];
            }
            return {
                ...state,
                notifications,
                notificationsSorted: getSortedNotifications(notifications),
                unreadCount: {
                    ...state.unreadCount,
                    unreadCount,
                }
            };
        }
        case types.FETCHING_NOTIFICATIONS_UNREAD_COUNT:
            return {
                ...state,
                unreadCount: {
                    ...state.unreadCount,
                    fetching: true,
                    fetched: false,
                },
            };
        case types.RECEIVED_NOTIFICATIONS_UNREAD_COUNT:
            return {
                ...state,
                unreadCount: {
                    fetching: false,
                    fetched: true,
                    unreadCount: action.unreadCount,
                },
            };
        default:
            return state;
    }
}

function getSortedNotifications(notificationsObj) {
    const notificationsSorted = values(notificationsObj);
    notificationsSorted.sort((a, b) => b.date - a.date);
    return notificationsSorted;
}
