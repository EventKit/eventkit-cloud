import axios from 'axios';
import actions from './actionTypes';
import cookie from 'react-cookie';

export function getNotifications(args = {}) {
    return (dispatch, getState) => {
        // Check if we should cancel the previous request due to a user action.
        const state = getState();
        if (state.notifications.fetching && state.notifications.cancelSource) {
            if (args.isAuto) {
                // Just ignore this request.
                return null;
            } else {
                // Cancel the last request.
                state.notifications.cancelSource.cancel('Request is no longer valid, cancelling.');
            }
        }

        const cancelSource = axios.CancelToken.source();

        dispatch({
            type: actions.FETCHING_NOTIFICATIONS,
            cancelSource,
        });

        const pageSize = args.pageSize || 10;
        const page = args.page || 1;

        let params = `page_size=${pageSize}&page=${page}`;

        return axios({
            url: `/api/notifications/all?${params}`,
            method: 'GET',
            cancelToken: cancelSource.token,
        }).then((response) => {
            let nextPage = false;
            let links = [];

            if (response.headers.link) {
                links = response.headers.link.split(',');
            }
            for (const i in links) {
                if (links[i].includes('rel="next"')) {
                    nextPage = true;
                }
            }
            let range = '';
            if (response.headers['content-range']) {
                range = response.headers['content-range'].split('-')[1];
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

export function markNotificationsAsRead(notifications) {
    return (dispatch, getState) => {
        cancelNotificationsSources(getState());

        const cancelSource = axios.CancelToken.source();

        dispatch({
            type: actions.MARKING_NOTIFICATIONS_AS_READ,
            notifications,
            cancelSource,
        });

        const data = [];
        for (let notification of notifications) {
            data.push({
                id: notification.id,
                action: 'READ',
            });
        }

        return axios({
            url: '/api/notifications/mark',
            method: 'POST',
            cancelToken: cancelSource.token,
            headers: { 'X-CSRFToken': cookie.load('csrftoken') },
            data,
        }).then(() => {
            dispatch({
                type: actions.MARKED_NOTIFICATIONS_AS_READ,
                notifications,
            });
        }).catch((error) => {
            if (axios.isCancel(error)) {
                console.log(error.message);
            } else {
                dispatch({
                    type: actions.MARK_NOTIFICATIONS_AS_READ_ERROR,
                    error: error.response.data,
                });
            }
        });
    };
}

export function markNotificationsAsUnread(notifications) {
    return (dispatch, getState) => {
        cancelNotificationsSources(getState());

        const cancelSource = axios.CancelToken.source();

        dispatch({
            type: actions.MARKING_NOTIFICATIONS_AS_UNREAD,
            notifications,
            cancelSource,
        });

        const data = [];
        for (let notification of notifications) {
            data.push({
                id: notification.id,
                action: 'UNREAD',
            });
        }

        return axios({
            url: '/api/notifications/mark',
            method: 'POST',
            cancelToken: cancelSource.token,
            headers: { 'X-CSRFToken': cookie.load('csrftoken') },
            data,
        }).then(() => {
            dispatch({
                type: actions.MARKED_NOTIFICATIONS_AS_UNREAD,
                notifications,
            });
        }).catch((error) => {
            if (axios.isCancel(error)) {
                console.log(error.message);
            } else {
                dispatch({
                    type: actions.MARK_NOTIFICATIONS_AS_UNREAD_ERROR,
                    error: error.response.data,
                });
            }
        });
    };
}

export function removeNotifications(notifications) {
    return (dispatch, getState) => {
        cancelNotificationsSources(getState());

        const cancelSource = axios.CancelToken.source();

        dispatch({
            type: actions.REMOVING_NOTIFICATIONS,
            notifications,
            cancelSource,
        });

        const data = [];
        for (let notification of notifications) {
            data.push({
                id: notification.id,
                action: 'DELETE',
            });
        }

        return axios({
            url: '/api/notifications/mark',
            method: 'POST',
            cancelToken: cancelSource.token,
            headers: { 'X-CSRFToken': cookie.load('csrftoken') },
            data,
        }).then(() => {
            dispatch({
                type: actions.REMOVED_NOTIFICATIONS,
                notifications,
            });
        }).catch((error) => {
            if (axios.isCancel(error)) {
                console.log(error.message);
            } else {
                dispatch({
                    type: actions.REMOVE_NOTIFICATIONS_ERROR,
                    error: error.response.data,
                });
            }
        });
    };
}

export function markAllNotificationsAsRead() {
    return (dispatch, getState) => {
        cancelNotificationsSources(getState());

        const cancelSource = axios.CancelToken.source();

        dispatch({
            type: actions.MARKING_ALL_NOTIFICATIONS_AS_READ,
            cancelSource,
        });

        return axios({
            url: '/api/notifications/markallasread',
            method: 'GET',
            cancelToken: cancelSource.token,
            headers: { 'X-CSRFToken': cookie.load('csrftoken') },
        }).then(() => {
            dispatch({
                type: actions.MARKED_ALL_NOTIFICATIONS_AS_READ,
            });
        }).catch((error) => {
            if (axios.isCancel(error)) {
                console.log(error.message);
            } else {
                dispatch({
                    type: actions.MARK_ALL_NOTIFICATIONS_AS_READ_ERROR,
                    error: error.response.data,
                });
            }
        });
    }
}

export function getNotificationsUnreadCount(args = {}) {
    return (dispatch, getState) => {
        // Check if we should cancel the previous request due to a user action.
        const state = getState();
        if (state.notifications.unreadCount.fetching && state.notifications.unreadCount.cancelSource) {
            if (args.isAuto) {
                // Just ignore this request.
                return null;
            } else {
                // Cancel the last request.
                state.notifications.unreadCount.cancelSource.cancel('Request is no longer valid, cancelling.');
            }
        }

        const cancelSource = axios.CancelToken.source();

        dispatch({
            type: actions.FETCHING_NOTIFICATIONS_UNREAD_COUNT,
            cancelSource,
        });

        // TODO: Switch this to a new endpoint that only returns the count.
        return axios({
            url: '/api/notifications/unread',
            method: 'GET',
            cancelToken: cancelSource.token,
        }).then((response) => {
            dispatch({
                type: actions.RECEIVED_NOTIFICATIONS_UNREAD_COUNT,
                unreadCount: response.data.length,
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
    }
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
