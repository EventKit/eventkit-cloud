import axios from 'axios';
import cookie from 'react-cookie';
import actions from './actionTypes';

export function getNotifications(args = {}) {
    return (dispatch, getState) => {
        // Check if we should cancel the previous request due to a user action.
        const state = getState();
        if (state.notifications.fetching && state.notifications.cancelSource) {
            if (args.isAuto) {
                // Just ignore this request.
                return null;
            }
            // Cancel the last request.
            state.notifications.cancelSource.cancel('Request is no longer valid, cancelling.');
        }

        const cancelSource = axios.CancelToken.source();

        dispatch({
            type: actions.FETCHING_NOTIFICATIONS,
            cancelSource,
        });

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

            dispatch({
                type: actions.RECEIVED_NOTIFICATIONS,
                notifications: response.data,
                nextPage,
                range,
            });
        }).catch((error) => {
            if (axios.isCancel(error)) {
                console.log(error.message);
            } else {
                dispatch({
                    type: actions.FETCH_NOTIFICATIONS_ERROR,
                    error: error.response.data,
                });
            }
        });
    };
}

function cancelNotificationsSources(state) {
    // Avoid out-of-sync issues if we call this right as we're receiving notifications.
    if (state.notifications.fetching && state.notifications.cancelSource) {
        state.notifications.cancelSource.cancel('Taking another action on notifications, cancelling.');
    }

    if (state.notifications.unreadCount.fetching && state.notifications.unreadCount.cancelSource) {
        state.notifications.unreadCount.cancelSource.cancel('Taking another action on notifications, cancelling.');
    }
}

export function markNotificationsAsRead(notifications) {
    return (dispatch, getState) => {
        cancelNotificationsSources(getState());

        dispatch({
            type: actions.MARKING_NOTIFICATIONS_AS_READ,
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
                type: actions.MARKED_NOTIFICATIONS_AS_READ,
                notifications,
            });
        }).catch((error) => {
            dispatch({
                type: actions.MARK_NOTIFICATIONS_AS_READ_ERROR,
                error: error.response.data,
            });
        });
    };
}

export function markNotificationsAsUnread(notifications) {
    return (dispatch, getState) => {
        cancelNotificationsSources(getState());

        dispatch({
            type: actions.MARKING_NOTIFICATIONS_AS_UNREAD,
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
                type: actions.MARKED_NOTIFICATIONS_AS_UNREAD,
                notifications,
            });
        }).catch((error) => {
            dispatch({
                type: actions.MARK_NOTIFICATIONS_AS_UNREAD_ERROR,
                error: error.response.data,
            });
        });
    };
}

export function removeNotifications(notifications) {
    return (dispatch, getState) => {
        cancelNotificationsSources(getState());

        dispatch({
            type: actions.REMOVING_NOTIFICATIONS,
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
                type: actions.REMOVED_NOTIFICATIONS,
                notifications,
            });
        }).catch((error) => {
            dispatch({
                type: actions.REMOVE_NOTIFICATIONS_ERROR,
                error: error.response.data,
            });
        });
    };
}

export function markAllNotificationsAsRead() {
    return (dispatch, getState) => {
        cancelNotificationsSources(getState());

        dispatch({
            type: actions.MARKING_ALL_NOTIFICATIONS_AS_READ,
        });

        return axios({
            url: '/api/notifications/mark_all_as_read',
            method: 'POST',
            headers: { 'X-CSRFToken': cookie.load('csrftoken') },
        }).then(() => {
            dispatch({
                type: actions.MARKED_ALL_NOTIFICATIONS_AS_READ,
            });
        }).catch((error) => {
            dispatch({
                type: actions.MARK_ALL_NOTIFICATIONS_AS_READ_ERROR,
                error: error.response.data,
            });
        });
    };
}

export function getNotificationsUnreadCount(args = {}) {
    return (dispatch, getState) => {
        // Check if we should cancel the previous request due to a user action.
        const state = getState();
        if (state.notifications.unreadCount.fetching && state.notifications.unreadCount.cancelSource) {
            if (args.isAuto) {
                // Just ignore this request.
                return null;
            }
            // Cancel the last request.
            state.notifications.unreadCount.cancelSource.cancel('Request is no longer valid, cancelling.');
        }

        const cancelSource = axios.CancelToken.source();

        dispatch({
            type: actions.FETCHING_NOTIFICATIONS_UNREAD_COUNT,
            cancelSource,
        });

        return axios({
            url: '/api/notifications/counts',
            method: 'GET',
            cancelToken: cancelSource.token,
        }).then((response) => {
            dispatch({
                type: actions.RECEIVED_NOTIFICATIONS_UNREAD_COUNT,
                unreadCount: response.data.unread,
            });
        }).catch((error) => {
            if (axios.isCancel(error)) {
                console.log(error.message);
            } else {
                dispatch({
                    type: actions.FETCH_NOTIFICATIONS_UNREAD_COUNT_ERROR,
                    error: error.response.data,
                });
            }
        });
    };
}
