
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
    REMOVED_NOTIFICATIONS: 'REMOVED_NOTIFICATIONS',
    REMOVE_NOTIFICATIONS_ERROR: 'REMOVE_NOTIFICATIONS_ERROR',
    FETCHING_NOTIFICATIONS_UNREAD_COUNT: 'FETCHING_NOTIFICATIONS_UNREAD_COUNT',
    RECEIVED_NOTIFICATIONS_UNREAD_COUNT: 'RECEIVED_NOTIFICATIONS_UNREAD_COUNT',
    FETCH_NOTIFICATIONS_UNREAD_COUNT_ERROR: 'FETCH_NOTIFICATIONS_UNREAD_COUNT_ERROR',
};

export function getNotifications(args = {}) {
    const params = {
        page_size: args.pageSize || 12,
    };

    return {
        types: [
            types.FETCHING_NOTIFICATIONS,
            types.RECEIVED_NOTIFICATIONS,
            types.FETCH_NOTIFICATIONS_ERROR,
        ],
        shouldCallApi: state => Boolean(state.user.data),
        getCancelSource: state => state.notifications.status.cancelSource,
        auto: args.isAuto,
        cancellable: args.isAuto,
        url: '/api/notifications',
        method: 'GET',
        params,
        onSuccess: (response) => {
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

            return {
                notifications: response.data,
                nextPage,
                range,
            };
        },
        onError: error => ({ error: error.response.data }),
    };
}

export function markNotificationsAsRead(notifications) {
    const data = { ids: [] };

    notifications.forEach((notification) => {
        data.ids.push(notification.id);
    });

    return {
        types: [
            types.MARKING_NOTIFICATIONS_AS_READ,
            types.MARKED_NOTIFICATIONS_AS_READ,
            types.MARK_NOTIFICATIONS_AS_READ_ERROR,
        ],
        shouldCallApi: state => Boolean(state.user.data),
        getCancelSource: state => state.notifications.status.cancelSource,
        url: '/api/notifications/read',
        method: 'POST',
        payload: { notifications },
        data,
        onError: error => ({ error: error.response.data }),
    };
}

export function markNotificationsAsUnread(notifications) {
    const data = { ids: [] };

    notifications.forEach((notification) => {
        data.ids.push(notification.id);
    });

    return {
        types: [
            types.MARKING_NOTIFICATIONS_AS_UNREAD,
            types.MARKED_NOTIFICATIONS_AS_UNREAD,
            types.MARK_NOTIFICATIONS_AS_UNREAD_ERROR,
        ],
        shouldCallApi: state => Boolean(state.user.data),
        getCancelSource: state => state.notifications.status.cancelSource,
        payload: { notifications },
        url: '/api/notifications/unread',
        method: 'POST',
        data,
        onError: error => ({ error: error.response.data }),
    };
}

export function removeNotifications(notifications) {
    const data = {};
    if (notifications) {
        data.ids = [];

        notifications.forEach((notification) => {
            data.ids.push(notification.id);
        });
    }

    return {
        types: [
            types.REMOVING_NOTIFICATIONS,
            types.REMOVED_NOTIFICATIONS,
            types.REMOVE_NOTIFICATIONS_ERROR,
        ],
        shouldCallApi: state => Boolean(state.user.data),
        getCancelSource: state => state.notifications.status.cancelSource,
        payload: { notifications },
        url: '/api/notifications/delete',
        method: 'DELETE',
        data,
        onError: error => ({ error: error.response.data }),
    };
}

export function markAllNotificationsAsRead() {
    return {
        types: [
            types.MARKING_ALL_NOTIFICATIONS_AS_READ,
            types.MARKED_ALL_NOTIFICATIONS_AS_READ,
            types.MARK_ALL_NOTIFICATIONS_AS_READ_ERROR,
        ],
        shouldCallApi: state => Boolean(state.user.data),
        getCancelSource: state => state.notifications.status.cancelSource,
        url: '/api/notifications/read',
        method: 'POST',
        onError: error => ({ error: error.response.data }),
    };
}

export function getNotificationsUnreadCount(args = {}) {
    return {
        types: [
            types.FETCHING_NOTIFICATIONS_UNREAD_COUNT,
            types.RECEIVED_NOTIFICATIONS_UNREAD_COUNT,
            types.FETCH_NOTIFICATIONS_UNREAD_COUNT_ERROR,
        ],
        shouldCallApi: state => Boolean(state.user.data),
        getCancelSource: state => state.notifications.unreadCount.status.cancelSource,
        auto: args.isAuto,
        cancellable: args.isAuto,
        url: '/api/notifications/counts',
        method: 'GET',
        onSuccess: response => ({ unreadCount: response.data.unread }),
        onError: error => ({ error: error.response.data }),
    };
}
