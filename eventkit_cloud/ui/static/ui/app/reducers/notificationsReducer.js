import values from 'lodash/values';
import moment from 'moment';
import { types } from '../actions/notificationsActions';


export const initialState = {
    data: {
        notifications: {},
        notificationsSorted: [],
    },
    status: {
        cancelSource: null,
        deleted: null,
        deleting: null,
        error: null,
        fetched: null,
        fetching: null,
    },
    unreadCount: {
        data: {
            unreadCount: 0,
        },
        status: {
            cancelSource: null,
            error: null,
            fetched: null,
            fetching: null,
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
                    cancelSource: action.cancelSource,
                    error: null,
                    fetched: false,
                    fetching: true,
                },
            };
        case types.RECEIVED_NOTIFICATIONS: {
            const status = {
                ...state.status,
                cancelSource: null,
                error: null,
                fetched: true,
                fetching: false,
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
                data: {
                    ...state.data,
                    nextPage: action.nextPage,
                    notifications: updated,
                    notificationsSorted: getSortedNotifications(updated),
                    range: action.range,

                },
                status,
            };
        }
        case types.FETCH_NOTIFICATIONS_ERROR:
            return {
                ...state,
                status: {
                    ...state.status,
                    cancelSource: null,
                    error: action.error,
                    fetched: false,
                    fetching: false,
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
                data: {
                    ...state.data,
                    notifications,
                    notificationsSorted: getSortedNotifications(notifications),
                },
                status: {
                    ...state.status,
                    deleted: false,
                    deleting: true,
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
                    deleted: true,
                    deleting: false,
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
                        cancelSource: action.cancelSource,
                        fetched: false,
                        fetching: true,
                    },
                },
            };
        case types.RECEIVED_NOTIFICATIONS_UNREAD_COUNT:
            return {
                ...state,
                unreadCount: {
                    ...state.unreadCount,
                    data: {
                        unreadCount: action.unreadCount,
                    },
                    status: {
                        ...state.unreadCount.status,
                        cancelSource: null,
                        fetched: true,
                        fetching: false,
                    },
                },
            };
        case types.FETCH_NOTIFICATIONS_UNREAD_COUNT_ERROR:
            return {
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
            };
        case types.USER_LOGGED_OUT:
            return initialState;
        default:
            return state;
    }
}
