import values from 'lodash/values';
import moment from 'moment';
import { types } from '../actions/notificationsActions';


export const initialState = {
    status: {
        fetching: null,
        fetched: null,
        deleting: null,
        deleted: null,
        error: null,
        cancelSource: null,
    },
    data: {
        notifications: {},
        notificationsSorted: [],
    },
    unreadCount: {
        status: {
            fetching: null,
            fetched: null,
            error: null,
            cancelSource: null,
        },
        data: {
            unreadCount: 0,
        },
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
                status: {
                    ...state.status,
                    fetching: true,
                    fetched: false,
                    error: null,
                    cancelSource: action.cancelSource,
                },
            };
        case types.RECEIVED_NOTIFICATIONS: {
            const status = {
                ...state.status,
                fetching: false,
                fetched: true,
                error: null,
                cancelSource: null,
            };

            // assume that the notifications have not changed
            let changed = false;

            // old state for comparison
            const old = { ...state.data.notifications };

            // new state should still include the old notifications
            const updated = { ...state.data.notifications };

            action.notifications.forEach((n) => {
                if (old[n.id]) {
                    // if the notifcation was already in state check if it has changed
                    if (old[n.id].unread !== n.unread || old[n.id].deleted !== n.deleted) {
                        changed = true;
                    }
                } else { // if the notification was not in state then we know there is a change
                    changed = true;
                }
                // re-add updated notification or add brand new notification
                updated[n.id] = n;
            });

            // if no changes we only update the status
            if (!changed) {
                return {
                    ...state,
                    status,
                };
            }

            // if there are changes we update status and data
            return {
                ...state,
                status,
                data: {
                    ...state.data,
                    notifications: updated,
                    notificationsSorted: getSortedNotifications(updated),
                    nextPage: action.nextPage,
                    range: action.range,

                },
            };
        }
        case types.FETCH_NOTIFICATIONS_ERROR:
            return {
                ...state,
                status: {
                    ...state.status,
                    fetching: false,
                    fetched: false,
                    error: action.error,
                    cancelSource: null,
                },
            };
        case types.MARKING_NOTIFICATIONS_AS_READ: {
            const notifications = { ...state.data.notifications };
            let { unreadCount } = state.unreadCount.data;
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
                data: {
                    ...state.data,
                    notifications,
                    notificationsSorted: getSortedNotifications(notifications),
                },
                unreadCount: {
                    ...state.unreadCount,
                    data: {
                        unreadCount,
                    },
                },
            };
        }
        case types.MARK_NOTIFICATIONS_AS_READ_ERROR:
            return {
                ...state,
                status: {
                    ...state.status,
                    error: action.error,
                },
            };
        case types.MARKING_NOTIFICATIONS_AS_UNREAD: {
            const notifications = { ...state.data.notifications };
            let { unreadCount } = state.unreadCount.data;
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
                data: {
                    ...state.data,
                    notifications,
                    notificationsSorted: getSortedNotifications(notifications),
                },
                unreadCount: {
                    ...state.unreadCount,
                    data: {
                        unreadCount,
                    },
                },
            };
        }
        case types.MARK_NOTIFICATIONS_AS_UNREAD_ERROR:
            return {
                ...state,
                status: {
                    ...state.status,
                    error: action.error,
                },
            };
        case types.MARKING_ALL_NOTIFICATIONS_AS_READ: {
            const notifications = { ...state.data.notifications };
            Object.keys(notifications).forEach((id) => {
                notifications[id] = {
                    ...notifications[id],
                    unread: false,
                };
            });

            return {
                ...state,
                data: {
                    ...state.data,
                    notifications,
                    notificationsSorted: getSortedNotifications(notifications),
                },
                unreadCount: {
                    ...state.unreadCount,
                    data: {
                        unreadCount: 0,
                    },
                },
            };
        }
        case types.MARK_ALL_NOTIFICATIONS_AS_READ_ERROR:
            return {
                ...state,
                status: {
                    ...state.status,
                    error: action.error,
                },
            };
        case types.REMOVING_NOTIFICATIONS: {
            let notifications = { ...state.data.notifications };
            let { unreadCount } = state.unreadCount.data;

            if (action.notifications) {
                action.notifications.forEach((notification) => {
                    if (notifications[notification.id].unread) {
                        unreadCount -= 1;
                    }
                    delete notifications[notification.id];
                });
            } else {
                // clear all notifications
                notifications = {};
            }

            return {
                ...state,
                status: {
                    ...state.status,
                    deleting: true,
                    deleted: false,
                },
                data: {
                    ...state.data,
                    notifications,
                    notificationsSorted: getSortedNotifications(notifications),
                },
                unreadCount: {
                    ...state.unreadCount,
                    data: {
                        unreadCount,
                    },
                },
            };
        }
        case types.REMOVED_NOTIFICATIONS:
            return {
                ...state,
                status: {
                    ...state.status,
                    deleting: false,
                    deleted: true,
                },
            };
        case types.REMOVE_NOTIFICATIONS_ERROR:
            return {
                ...state,
                status: {
                    ...state.status,
                    deleted: false,
                    deleting: false,
                    error: action.error,
                },
            };
        case types.FETCHING_NOTIFICATIONS_UNREAD_COUNT:
            return {
                ...state,
                unreadCount: {
                    ...state.unreadCount,
                    status: {
                        ...state.unreadCount.status,
                        fetching: true,
                        fetched: false,
                        cancelSource: action.cancelSource,
                    },
                },
            };
        case types.RECEIVED_NOTIFICATIONS_UNREAD_COUNT:
            return {
                ...state,
                unreadCount: {
                    ...state.unreadCount,
                    status: {
                        ...state.unreadCount.status,
                        fetching: false,
                        fetched: true,
                        cancelSource: null,
                    },
                    data: {
                        unreadCount: action.unreadCount,
                    },
                },
            };
        case types.FETCH_NOTIFICATIONS_UNREAD_COUNT_ERROR:
            return {
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
            };
        case types.USER_LOGGED_OUT:
            return initialState;
        default:
            return state;
    }
}
