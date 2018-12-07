import sinon from 'sinon';
import * as actions from '../../actions/notificationsActions';
import * as utils from '../../utils/generic';

describe('notificationsActions', () => {
    describe('getNotifications action', () => {
        it('should return the correct types', () => {
            expect(actions.getNotifications().types).toEqual([
                actions.types.FETCHING_NOTIFICATIONS,
                actions.types.RECEIVED_NOTIFICATIONS,
                actions.types.FETCH_NOTIFICATIONS_ERROR,
            ]);
        });

        it('getCancelSource should return the source', () => {
            const s = { notifications: { status: { cancelSource: 'test' } } };
            expect(actions.getNotifications().getCancelSource(s)).toEqual('test');
        });

        it('should return the correct params', () => {
            const args = { pageSize: 13 };
            expect(actions.getNotifications(args).params).toEqual({
                page_size: args.pageSize,
                slim: 'true',
            });
        });

        it('onSuccess should return header info and notifications', () => {
            const headerStub = sinon.stub(utils, 'getHeaderPageInfo').returns({
                range: '1-1',
                nextPage: true,
            });
            const ret = { data: ['one', 'two'] };
            expect(actions.getNotifications().onSuccess(ret)).toEqual({
                notifications: ret.data,
                nextPage: true,
                range: '1-1',
            });
            headerStub.restore();
        });
    });

    describe('markNotificationsAsRead action', () => {
        it('should return the correct types', () => {
            expect(actions.markNotificationsAsRead([]).types).toEqual([
                actions.types.MARKING_NOTIFICATIONS_AS_READ,
                actions.types.MARKED_NOTIFICATIONS_AS_READ,
                actions.types.MARK_NOTIFICATIONS_AS_READ_ERROR,
            ]);
        });

        it('getCancelSource should return source', () => {
            const s = { notifications: { status: { cancelSource: 'test' } } };
            expect(actions.markNotificationsAsRead([]).getCancelSource(s)).toEqual('test');
        });

        it('should return notification ids in the data and notifications in the payload', () => {
            const notifications = [{ id: '1' }, { id: '2' }];
            const config = actions.markNotificationsAsRead(notifications);
            expect(config.payload).toEqual({ notifications });
            expect(config.data).toEqual({
                ids: ['1', '2'],
            });
        });
    });

    describe('markNotificationsAsUnread action', () => {
        it('should return the correct types', () => {
            expect(actions.markNotificationsAsUnread([]).types).toEqual([
                actions.types.MARKING_NOTIFICATIONS_AS_UNREAD,
                actions.types.MARKED_NOTIFICATIONS_AS_UNREAD,
                actions.types.MARK_NOTIFICATIONS_AS_UNREAD_ERROR,
            ]);
        });

        it('getCancelSource should return source', () => {
            const s = { notifications: { status: { cancelSource: 'test' } } };
            expect(actions.markNotificationsAsUnread([]).getCancelSource(s)).toEqual('test');
        });

        it('should return notification ids in the data and notifications in the payload', () => {
            const notifications = [{ id: '1' }, { id: '2' }];
            const config = actions.markNotificationsAsUnread(notifications);
            expect(config.payload).toEqual({ notifications });
            expect(config.data).toEqual({
                ids: ['1', '2'],
            });
        });
    });

    describe('removeNotifications action', () => {
        it('should return the correct types', () => {
            expect(actions.removeNotifications([]).types).toEqual([
                actions.types.REMOVING_NOTIFICATIONS,
                actions.types.REMOVED_NOTIFICATIONS,
                actions.types.REMOVE_NOTIFICATIONS_ERROR,
            ]);
        });

        it('getCancelSource should return source', () => {
            const s = { notifications: { status: { cancelSource: 'test' } } };
            expect(actions.removeNotifications([]).getCancelSource(s)).toEqual('test');
        });

        it('should return notification ids in the data', () => {
            const notifications = [{ id: '1' }, { id: '2' }];
            const config = actions.removeNotifications(notifications);
            expect(config.data).toEqual({
                ids: ['1', '2'],
            });
        });

        it('should return empty data', () => {
            expect(actions.removeNotifications().data).toEqual({});
        });
    });

    describe('markAllNotificationsAsRead action', () => {
        it('should return the correct types', () => {
            expect(actions.markAllNotificationsAsRead().types).toEqual([
                actions.types.MARKING_ALL_NOTIFICATIONS_AS_READ,
                actions.types.MARKED_ALL_NOTIFICATIONS_AS_READ,
                actions.types.MARK_ALL_NOTIFICATIONS_AS_READ_ERROR,
            ]);
        });

        it('getCancelSource should return source', () => {
            const s = { notifications: { status: { cancelSource: 'test' } } };
            expect(actions.markAllNotificationsAsRead().getCancelSource(s)).toEqual('test');
        });
    });

    describe('getNotificationsUnreadCound action', () => {
        it('should return the correct types', () => {
            expect(actions.getNotificationsUnreadCount().types).toEqual([
                actions.types.FETCHING_NOTIFICATIONS_UNREAD_COUNT,
                actions.types.RECEIVED_NOTIFICATIONS_UNREAD_COUNT,
                actions.types.FETCH_NOTIFICATIONS_UNREAD_COUNT_ERROR,
            ]);
        });

        it('getCancelSource should return source', () => {
            const s = { notifications: { unreadCount: { status: { cancelSource: 'test' } } } };
            expect(actions.getNotificationsUnreadCount().getCancelSource(s)).toEqual('test');
        });

        it('onSuccess should return unread count', () => {
            const ret = { data: { unread: 12 } };
            expect(actions.getNotificationsUnreadCount().onSuccess(ret)).toEqual({
                unreadCount: ret.data.unread,
            });
        });
    });
});
