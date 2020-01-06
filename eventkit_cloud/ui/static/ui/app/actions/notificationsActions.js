
import { getHeaderPageInfo } from '../utils/generic';

export const types = {
    FETCHING_NOTIFICATIONS: 'FETCHING_NOTIFICATIONS',
    FETCHING_NOTIFICATIONS_UNREAD_COUNT: 'FETCHING_NOTIFICATIONS_UNREAD_COUNT',
    FETCH_NOTIFICATIONS_ERROR: 'FETCH_NOTIFICATIONS_ERROR',
    FETCH_NOTIFICATIONS_UNREAD_COUNT_ERROR: 'FETCH_NOTIFICATIONS_UNREAD_COUNT_ERROR',
    MARKED_ALL_NOTIFICATIONS_AS_READ: 'MARKED_ALL_NOTIFICATIONS_AS_READ',
    MARKED_NOTIFICATIONS_AS_READ: 'MARKED_NOTIFICATIONS_AS_READ',
    MARKED_NOTIFICATIONS_AS_UNREAD: 'MARKED_NOTIFICATIONS_AS_UNREAD',
    MARKING_ALL_NOTIFICATIONS_AS_READ: 'MARKING_ALL_NOTIFICATIONS_AS_READ',
    MARKING_NOTIFICATIONS_AS_READ: 'MARKING_NOTIFICATIONS_AS_READ',
    MARKING_NOTIFICATIONS_AS_UNREAD: 'MARKING_NOTIFICATIONS_AS_UNREAD',
    MARK_ALL_NOTIFICATIONS_AS_READ_ERROR: 'MARK_ALL_NOTIFICATIONS_AS_READ_ERROR',
    MARK_NOTIFICATIONS_AS_READ_ERROR: 'MARK_NOTIFICATIONS_AS_READ_ERROR',
    MARK_NOTIFICATIONS_AS_UNREAD_ERROR: 'MARK_NOTIFICATIONS_AS_UNREAD_ERROR',
    RECEIVED_NOTIFICATIONS: 'RECEIVED_NOTIFICATIONS',
    RECEIVED_NOTIFICATIONS_UNREAD_COUNT: 'RECEIVED_NOTIFICATIONS_UNREAD_COUNT',
    REMOVE_NOTIFICATIONS_ERROR: 'REMOVE_NOTIFICATIONS_ERROR',
    REMOVED_NOTIFICATIONS: 'REMOVED_NOTIFICATIONS',
    REMOVING_NOTIFICATIONS: 'REMOVING_NOTIFICATIONS',
};

export function getNotifications(args = {}) {
    const params = {
        page_size: args.pageSize || 12,
        slim: 'true',
    };

    return {
        auto: args.isAuto,
        cancellable: args.isAuto,
        getCancelSource: state => state.notifications.status.cancelSource,
        method: 'GET',
        onSuccess: (response) => {
            const { nextPage, range } = getHeaderPageInfo(response);
            return {
                nextPage,
                notifications: response.data,
                range,
            };
        },
        params,
        types: [
            types.FETCH_NOTIFICATIONS_ERROR,
            types.FETCHING_NOTIFICATIONS,
            types.RECEIVED_NOTIFICATIONS,
        ],
        url: '/api/notifications',
    };
}

export function markNotificationsAsRead(notifications) {
    const data = { ids: [] };

    notifications.forEach((notification) => {
        data.ids.push(notification.id);
    });

    return {
        data,
        getCancelSource: state => state.notifications.status.cancelSource,
        method: 'POST',
        payload: { notifications },
        types: [
            types.MARK_NOTIFICATIONS_AS_READ_ERROR,
            types.MARKED_NOTIFICATIONS_AS_READ,
            types.MARKING_NOTIFICATIONS_AS_READ,
        ],
        url: '/api/notifications/read',
    };
}

export function markNotificationsAsUnread(notifications) {
    const data = { ids: [] };

    notifications.forEach((notification) => {
        data.ids.push(notification.id);
    });

    return {
        data,
        getCancelSource: state => state.notifications.status.cancelSource,
        method: 'POST',
        payload: { notifications },
        types: [
            types.MARK_NOTIFICATIONS_AS_UNREAD_ERROR,
            types.MARKED_NOTIFICATIONS_AS_UNREAD,
            types.MARKING_NOTIFICATIONS_AS_UNREAD,
        ],
        url: '/api/notifications/unread',
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
        data,
        getCancelSource: state => state.notifications.status.cancelSource,
        method: 'DELETE',
        payload: { notifications },
        types: [
            types.REMOVE_NOTIFICATIONS_ERROR,
            types.REMOVED_NOTIFICATIONS,
            types.REMOVING_NOTIFICATIONS,
        ],
        url: '/api/notifications/delete',
    };
}

export function markAllNotificationsAsRead() {
    return {
        getCancelSource: state => state.notifications.status.cancelSource,
        method: 'POST',
        types: [
            types.MARK_ALL_NOTIFICATIONS_AS_READ_ERROR,
            types.MARKED_ALL_NOTIFICATIONS_AS_READ,
            types.MARKING_ALL_NOTIFICATIONS_AS_READ,
        ],
        url: '/api/notifications/read',
    };
}

export function getNotificationsUnreadCount(args = {}) {
    return {
        types: [
            types.FETCHING_NOTIFICATIONS_UNREAD_COUNT,
            types.FETCH_NOTIFICATIONS_UNREAD_COUNT_ERROR,
            types.RECEIVED_NOTIFICATIONS_UNREAD_COUNT,
        ],
        getCancelSource: state => state.notifications.unreadCount.status.cancelSource,
        auto: args.isAuto,
        cancellable: args.isAuto,
        url: '/api/notifications/counts',
        method: 'GET',
        onSuccess: response => ({ unreadCount: response.data.unread }),
    };
}
