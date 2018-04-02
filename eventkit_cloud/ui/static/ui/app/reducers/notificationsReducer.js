import initialState from './initialState';
import types from '../actions/actionTypes';

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
        case types.RECEIVED_NOTIFICATIONS:
            return {
                ...state,
                fetching: false,
                fetched: true,
                notifications: action.notifications,
                nextPage: action.nextPage,
                range: action.range,
                error: action.error,
                cancelSource: null,
            };
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
            const notifications = [ ...state.notifications ];
            const indices = getNotificationsIndices(notifications, action.notifications);
            let unreadCount = state.unreadCount.unreadCount;
            indices.forEach((index) => {
                if (!notifications[index].read) {
                    unreadCount--;
                }
                notifications[index] = {
                    ...notifications[index],
                    read: true,
                }
            });
            return {
                ...state,
                notifications,
                unreadCount: {
                    ...state.unreadCount,
                    unreadCount,
                },
            };
        }
        case types.MARKING_NOTIFICATIONS_AS_UNREAD: {
            const notifications = [ ...state.notifications ];
            const indices = getNotificationsIndices(notifications, action.notifications);
            let unreadCount = state.unreadCount.unreadCount;
            indices.forEach((index) => {
                if (notifications[index].read) {
                    unreadCount++;
                }
                notifications[index] = {
                    ...notifications[index],
                    read: false,
                }
            });
            return {
                ...state,
                notifications,
                unreadCount: {
                    ...state.unreadCount,
                    unreadCount,
                },
            };
        }
        case types.REMOVING_NOTIFICATIONS: {
            let notifications = [ ...state.notifications ];
            // Make sure we remove notifications from highest index to lowest.
            const indices = getNotificationsIndices(notifications, action.notifications).sort().reverse();
            let unreadCount = state.unreadCount.unreadCount;
            indices.forEach((index) => {
                if (!notifications[index].read) {
                    unreadCount--;
                }
                notifications.splice(index, 1);
            });
            return {
                ...state,
                notifications,
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

function getNotificationsIndices(stateNotifications, actionNotifications) {
    const stateNotificationsIndexLookup = {};
    for (let i = 0; i < stateNotifications.length; i++) {
        stateNotificationsIndexLookup[stateNotifications[i].uid] = i;
    }

    return actionNotifications.map((notification) => stateNotificationsIndexLookup[notification.uid]);
}
