import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import moment from 'moment';
import { Paper } from 'material-ui';
import { NotificationGridItem } from '../../components/Notification/NotificationGridItem';
import NotificationMenu from '../../components/Notification/NotificationMenu';
import { getNotificationViewPath } from '../../utils/notificationUtils';

describe('NotificationGridItem component', () => {
    function getProps() {
        return {
            notification: {
                id: '1',
                verb: 'run_completed',
                actor: {
                    details: {
                        job: {
                            name: 'Test',
                        },
                    },
                },
                timestamp: '2018-05-04T17:32:04.716806Z',
                unread: true,
            },
            router: {
                push: sinon.spy(),
            },
            markNotificationsAsRead: () => {},
            markNotificationsAsUnread: () => {},
            removeNotifications: () => {},
            onMarkAsRead: () => {},
            onMarkAsUnread: () => {},
            onRemove: () => {},
        };
    }

    function getShallowWrapper(props = getProps()) {
        return shallow(<NotificationGridItem {...props} />);
    }

    it('should render the basic elements', () => {
        const props = getProps();
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        const paper = wrapper.find(Paper);
        expect(paper).toHaveLength(1);
        expect(paper.find('.qa-NotificationIcon')).toHaveLength(1);
        expect(paper.find('.qa-NotificationMessage-Text')).toHaveLength(1);
        expect(paper.find('.qa-NotificationMessage-Link')).toHaveLength(1);
        const date = wrapper.find('.qa-NotificationGridItem-Date');
        expect(date).toHaveLength(1);
        expect(date.text()).toBe(moment(props.notification.timestamp).fromNow());
        const notificationMenu = wrapper.find(NotificationMenu);
        expect(notificationMenu).toHaveLength(1);
        expect(notificationMenu.props().notification).toBe(instance.props.notification);
        expect(notificationMenu.props().router).toBe(instance.props.router);
        expect(notificationMenu.props().onMarkAsRead).toBe(instance.props.onMarkAsRead);
        expect(notificationMenu.props().onMarkAsUnread).toBe(instance.props.onMarkAsUnread);
        expect(notificationMenu.props().onRemove).toBe(instance.props.onRemove);
        expect(notificationMenu.props().onView).toBe(instance.handleView);
    });

    it('should push view path and mark notification as read in handleView()', () => {
        const props = {
            ...getProps(),
            router: {
                push: sinon.spy(),
            },
            markNotificationsAsRead: sinon.spy(),
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        const viewPath = getNotificationViewPath(instance.props.notification);
        instance.handleView();
        expect(instance.props.router.push.callCount).toBe(1);
        expect(instance.props.router.push.calledWith(viewPath)).toBe(true);
        expect(instance.props.markNotificationsAsRead.callCount).toBe(1);
        expect(instance.props.markNotificationsAsRead.calledWith([instance.props.notification])).toBe(true);
    });

    it('should call onView() with notification and view path in handleView()', () => {
        const props = {
            ...getProps(),
            onView: sinon.spy(),
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        const viewPath = getNotificationViewPath(instance.props.notification);
        instance.handleView();
        expect(instance.props.onView.callCount).toBe(1);
        expect(instance.props.onView.calledWith(props.notification, viewPath)).toBe(true);
    });

    it('should abort its own handleView() func if parent returns false in onView', () => {
        const props = {
            ...getProps(),
            onView: () => { return false; },
            router: {
                push: sinon.spy(),
            },
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleView();
        expect(instance.props.router.push.callCount).toBe(0);
    });

    it('should continue its own handleView() func if parent returns true in onView', () => {
        const props = {
            ...getProps(),
            onView: () => { return true; },
            router: {
                push: sinon.spy(),
            },
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleView();
        expect(instance.props.router.push.callCount).toBe(1);
    });

    it('should show a non-white background color for unread notifications', () => {
        const wrapper = getShallowWrapper();
        expect(wrapper.find(Paper).props().style.backgroundColor).not.toBe('white');
    });

    it('should show a white background color for read notifications', () => {
        const props = getProps();
        props.notification = {
            ...props.notification,
            unread: false,
        };
        const wrapper = getShallowWrapper(props);
        expect(wrapper.find(Paper).props().style.backgroundColor).toBe('white');
    });
});