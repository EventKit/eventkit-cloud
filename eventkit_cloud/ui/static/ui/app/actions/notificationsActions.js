import axios from 'axios';
import cookie from 'react-cookie';
import { makeAuthRequired } from './authActions';

export const types = {
    FETCHING_NOTIFICATIONS: 'FETCHING_NOTIFICATIONS',
    RECEIVED_NOTIFICATIONS: 'RECEIVED_NOTIFICATIONS',
    FETCH_NOTIFICATIONS_ERROR: 'FETCH_NOTIFICATIONS_ERROR',
    MARKING_NOTIFICATIONS_AS_READ: 'MARKING_NOTIFICATIONS_AS_READ',
    MARKED_NOTIFICATIONS_AS_READ: 'MARKED_NOTIFICATIONS_AS_READ',
    MARK_NOTIFICATIONS_AS_READ_ERROR: 'MARK_NOTIFICATIONS_AS_READ_ERROR',
    MARKING_NOTIFICATIONS_AS_UNREAD: 'MARKING_NOTIFICATIONS_AS_UNREAD',
    MARKED_NOTIFICATIONS_AS_UNREAD: 'MARKED_NOTIFICATIONS_AS_UNREAD',
    MARK_NOTIFICATIONS_AS_UNREAD_ERROR: 'MARK_NOTIFICATIONS_AS_UNREAD_ERROR',
    MARKING_ALL_NOTIFICATIONS_AS_READ: 'MARKING_ALL_NOTIFICATIONS_AS_READ',
    MARKED_ALL_NOTIFICATIONS_AS_READ: 'MARKED_ALL_NOTIFICATIONS_AS_READ',
    MARK_ALL_NOTIFICATIONS_AS_READ_ERROR: 'MARK_ALL_NOTIFICATIONS_AS_READ_ERROR',
    REMOVING_NOTIFICATIONS: 'REMOVING_NOTIFICATIONS',
    REMOVED_NOTIFICATIONS: 'REMOVE_NOTIFICATIONS',
    REMOVE_NOTIFICATIONS_ERROR: 'REMOVE_NOTIFICATIONS_ERROR',
    FETCHING_NOTIFICATIONS_UNREAD_COUNT: 'FETCHING_NOTIFICATIONS_UNREAD_COUNT',
    RECEIVED_NOTIFICATIONS_UNREAD_COUNT: 'RECEIVED_NOTIFICATIONS_UNREAD_COUNT',
    FETCH_NOTIFICATIONS_UNREAD_COUNT_ERROR: 'FETCH_NOTIFICATIONS_UNREAD_COUNT_ERROR',
};

export function getNotifications(args = {}) {
    return (dispatch, getState) => {
        // Check if we should cancel the previous request due to a user action.
        const state = getState();
        if (state.notifications.status.fetching && state.notifications.status.cancelSource) {
            if (args.isAuto) {
                // Just ignore this request.
                return null;
            }
            // Cancel the last request.
            state.notifications.status.cancelSource.cancel('Request is no longer valid, cancelling.');
        }

        const cancelSource = axios.CancelToken.source();

        dispatch(makeAuthRequired({
            type: types.FETCHING_NOTIFICATIONS,
            cancelSource,
        }));

        const params = {
            page_size: args.pageSize || 12,
        };

        return axios({
            url: '/api/notifications/all',
            method: 'GET',
            params,
            cancelToken: cancelSource.token,
        }).then((response) => {
            let nextPage = false;
            let links = [];

            if (response.headers.link) {
                links = response.headers.link.split(',');
            }

            links.forEach((link) => {
                if (link.includes('rel="next"')) {
                    nextPage = true;
                }
            });
            let range = '';
            if (response.headers['content-range']) {
                [, range] = response.headers['content-range'].split('-');
            }

            dispatch(makeAuthRequired({
                type: types.RECEIVED_NOTIFICATIONS,
                notifications: response.data,
                nextPage,
                range,
            }));
        }).catch((error) => {
            if (axios.isCancel(error)) {
                console.warn(error.message);
            } else {
                dispatch(makeAuthRequired({
                    type: types.FETCH_NOTIFICATIONS_ERROR,
                    error: error.response.data,
                }));
            }
        });
    };
}

function cancelNotificationsSources(state) {
    // Avoid out-of-sync issues if we call this right as we're receiving notifications.
    if (state.notifications.status.fetching && state.notifications.status.cancelSource) {
        state.notifications.status.cancelSource.cancel('Taking another action on notifications, cancelling.');
    }

    if (state.notifications.unreadCount.status.fetching && state.notifications.unreadCount.status.cancelSource) {
        state.notifications.unreadCount.status.cancelSource.cancel('Taking another action on notifications, cancelling.');
    }
}

export function markNotificationsAsRead(notifications) {
    return (dispatch, getState) => {
        cancelNotificationsSources(getState());

        dispatch({
            type: types.MARKING_NOTIFICATIONS_AS_READ,
            notifications,
        });

        const data = [];

        notifications.forEach((notification) => {
            data.push({
                id: notification.id,
                action: 'READ',
            });
        });

        return axios({
            url: '/api/notifications/mark',
            method: 'POST',
            headers: { 'X-CSRFToken': cookie.load('csrftoken') },
            data,
        }).then(() => {
            dispatch({
                type: types.MARKED_NOTIFICATIONS_AS_READ,
                notifications,
            });
        }).catch((error) => {
            dispatch({
                type: types.MARK_NOTIFICATIONS_AS_READ_ERROR,
                error: error.response.data,
            });
        });
    };
}

export function markNotificationsAsUnread(notifications) {
    return (dispatch, getState) => {
        cancelNotificationsSources(getState());

        dispatch({
            type: types.MARKING_NOTIFICATIONS_AS_UNREAD,
            notifications,
        });

        const data = [];

        notifications.forEach((notification) => {
            data.push({
                id: notification.id,
                action: 'UNREAD',
            });
        });

        return axios({
            url: '/api/notifications/mark',
            method: 'POST',
            headers: { 'X-CSRFToken': cookie.load('csrftoken') },
            data,
        }).then(() => {
            dispatch({
                type: types.MARKED_NOTIFICATIONS_AS_UNREAD,
                notifications,
            });
        }).catch((error) => {
            dispatch({
                type: types.MARK_NOTIFICATIONS_AS_UNREAD_ERROR,
                error: error.response.data,
            });
        });
    };
}

export function removeNotifications(notifications) {
    return (dispatch, getState) => {
        cancelNotificationsSources(getState());

        dispatch({
            type: types.REMOVING_NOTIFICATIONS,
            notifications,
        });

        const data = [];

        notifications.forEach((notification) => {
            data.push({
                id: notification.id,
                action: 'DELETE',
            });
        });

        return axios({
            url: '/api/notifications/mark',
            method: 'POST',
            headers: { 'X-CSRFToken': cookie.load('csrftoken') },
            data,
        }).then(() => {
            dispatch({
                type: types.REMOVED_NOTIFICATIONS,
                notifications,
            });
        }).catch((error) => {
            dispatch({
                type: types.REMOVE_NOTIFICATIONS_ERROR,
                error: error.response.data,
            });
        });
    };
}

export function markAllNotificationsAsRead() {
    return (dispatch, getState) => {
        cancelNotificationsSources(getState());

        dispatch({
            type: types.MARKING_ALL_NOTIFICATIONS_AS_READ,
        });

        return axios({
            url: '/api/notifications/mark_all_as_read',
            method: 'POST',
            headers: { 'X-CSRFToken': cookie.load('csrftoken') },
        }).then(() => {
            dispatch({
                type: types.MARKED_ALL_NOTIFICATIONS_AS_READ,
            });
        }).catch((error) => {
            dispatch({
                type: types.MARK_ALL_NOTIFICATIONS_AS_READ_ERROR,
                error: error.response.data,
            });
        });
    };
}

export function getNotificationsUnreadCount(args = {}) {
    return (dispatch, getState) => {
        // Check if we should cancel the previous request due to a user action.
        const state = getState();
        if (state.notifications.unreadCount.status.fetching && state.notifications.unreadCount.status.cancelSource) {
            if (args.isAuto) {
                // Just ignore this request.
                return null;
            }
            // Cancel the last request.
            state.notifications.unreadCount.status.cancelSource.cancel('Request is no longer valid, cancelling.');
        }

        const cancelSource = axios.CancelToken.source();

        dispatch(makeAuthRequired({
            type: types.FETCHING_NOTIFICATIONS_UNREAD_COUNT,
            cancelSource,
        }));

        return axios({
            url: '/api/notifications/counts',
            method: 'GET',
            cancelToken: cancelSource.token,
        }).then((response) => {
            dispatch(makeAuthRequired({
                type: types.RECEIVED_NOTIFICATIONS_UNREAD_COUNT,
                unreadCount: response.data.unread,
            }));
        }).catch((error) => {
            if (axios.isCancel(error)) {
                console.warn(error.message);
            } else {
                dispatch(makeAuthRequired({
                    type: types.FETCH_NOTIFICATIONS_UNREAD_COUNT_ERROR,
                    error: error.response.data,
                }));
            }
        });
    };
}
