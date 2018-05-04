import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { IconMenu, MenuItem } from 'material-ui';
import OpenInNewIcon from 'material-ui/svg-icons/action/open-in-new';
import FlagIcon from 'material-ui/svg-icons/content/flag';
import CloseIcon from 'material-ui/svg-icons/navigation/close';
import { NotificationMenu } from '../../components/Notification/NotificationMenu';
import { getNotificationViewPath } from '../../utils/notificationUtils';

describe('NotificationMenu component', () => {
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
        };
    }

    function getShallowWrapper(props = getProps()) {
        return shallow(<NotificationMenu {...props} />);
    }

    it('should have the correct initial state', () => {
        const wrapper = getShallowWrapper();
        expect(wrapper.state().forceClose).toBe(false);
    });

    it('should render the basic elements', () => {
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        expect(wrapper.find(IconMenu)).toHaveLength(1);
        expect(wrapper.find(MenuItem)).toHaveLength(3);
        expect(wrapper.find(MenuItem).get(0).props.primaryText).toBe('View');
        expect(wrapper.find(MenuItem).get(0).props.leftIcon).toEqual(<OpenInNewIcon />);
        expect(wrapper.find(MenuItem).get(0).props.onClick).toBe(instance.handleView);
        expect(wrapper.find(MenuItem).get(1).props.primaryText).toBe('Mark As Read');
        expect(wrapper.find(MenuItem).get(1).props.leftIcon).toEqual(<FlagIcon />);
        expect(wrapper.find(MenuItem).get(1).props.onClick).toBe(instance.handleMarkAsRead);
        expect(wrapper.find(MenuItem).get(2).props.primaryText).toBe('Remove');
        expect(wrapper.find(MenuItem).get(2).props.leftIcon).toEqual(<CloseIcon />);
        expect(wrapper.find(MenuItem).get(2).props.onClick).toBe(instance.handleRemove);
    });

    it('should change second item to "Mark As Unread" when notification is read', () => {
        const props = getProps();
        props.notification = {
            ...props.notification,
            unread: false,
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        expect(wrapper.find(MenuItem).get(1).props.primaryText).toBe('Mark As Unread');
        expect(wrapper.find(MenuItem).get(1).props.leftIcon).toEqual(<FlagIcon />);
        expect(wrapper.find(MenuItem).get(1).props.onClick).toBe(instance.handleMarkAsUnread);
    });

    it('should call onView() with notification', () => {
        const props = {
            ...getProps(),
            onView: sinon.spy(),
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleMenuItemClick = sinon.stub();
        const viewPath = getNotificationViewPath(instance.props.notification);
        instance.handleView();
        expect(instance.handleMenuItemClick.callCount).toBe(1);
        expect(instance.props.onView.callCount).toBe(1);
        expect(instance.props.onView.calledWith(props.notification, viewPath)).toBe(true);
    });

    it('should abort handleView() if parent returns false in onView()', () => {
        const props = {
            ...getProps(),
            onView: () => { return false; },
            markNotificationsAsRead: sinon.spy(),
            router: {
                push: sinon.spy(),
            },
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleMenuItemClick = sinon.stub();
        instance.handleView();
        expect(instance.props.router.push.callCount).toBe(0);
        expect(instance.props.markNotificationsAsRead.callCount).toBe(0);
    });

    it('should continue handleView() if parent returns true in onView()', () => {
        const props = {
            ...getProps(),
            onView: () => { return true; },
            markNotificationsAsRead: sinon.spy(),
            router: {
                push: sinon.spy(),
            },
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleMenuItemClick = sinon.stub();
        instance.handleView();
        expect(instance.props.router.push.callCount).toBe(1);
        expect(instance.props.markNotificationsAsRead.callCount).toBe(1);
        expect(instance.props.markNotificationsAsRead.calledWith([props.notification])).toBe(true);
    });

    it('should call onMarkAsRead() with notification', () => {
        const props = {
            ...getProps(),
            onMarkAsRead: sinon.spy(),
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleMenuItemClick = sinon.stub();
        instance.handleMarkAsRead();
        expect(instance.handleMenuItemClick.callCount).toBe(1);
        expect(instance.props.onMarkAsRead.callCount).toBe(1);
        expect(instance.props.onMarkAsRead.calledWith(props.notification)).toBe(true);
    });

    it('should abort handleMarkAsRead() if parent returns false in onMarkAsRead()', () => {
        const props = {
            ...getProps(),
            onMarkAsRead: () => { return false; },
            markNotificationsAsRead: sinon.spy(),
            router: {
                push: sinon.spy(),
            },
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleMenuItemClick = sinon.stub();
        instance.handleMarkAsRead();
        expect(instance.props.markNotificationsAsRead.callCount).toBe(0);
    });

    it('should continue handleMarkAsRead() if parent returns true in onMarkAsRead()', () => {
        const props = {
            ...getProps(),
            onMarkAsRead: () => { return true; },
            markNotificationsAsRead: sinon.spy(),
            router: {
                push: sinon.spy(),
            },
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleMenuItemClick = sinon.stub();
        instance.handleMarkAsRead();
        expect(instance.props.markNotificationsAsRead.callCount).toBe(1);
        expect(instance.props.markNotificationsAsRead.calledWith([props.notification])).toBe(true);
    });
    
    it('should call onMarkAsUnread() with notification', () => {
        const props = {
            ...getProps(),
            onMarkAsUnread: sinon.spy(),
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleMenuItemClick = sinon.stub();
        instance.handleMarkAsUnread();
        expect(instance.handleMenuItemClick.callCount).toBe(1);
        expect(instance.props.onMarkAsUnread.callCount).toBe(1);
        expect(instance.props.onMarkAsUnread.calledWith(props.notification)).toBe(true);
    });

    it('should abort handleMarkAsUnread() if parent returns false in onMarkAsUnread()', () => {
        const props = {
            ...getProps(),
            onMarkAsUnread: () => { return false; },
            markNotificationsAsUnread: sinon.spy(),
            router: {
                push: sinon.spy(),
            },
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleMenuItemClick = sinon.stub();
        instance.handleMarkAsUnread();
        expect(instance.props.markNotificationsAsUnread.callCount).toBe(0);
    });

    it('should continue handleMarkAsUnread() if parent returns true in onMarkAsUnread()', () => {
        const props = {
            ...getProps(),
            onMarkAsUnread: () => { return true; },
            markNotificationsAsUnread: sinon.spy(),
            router: {
                push: sinon.spy(),
            },
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleMenuItemClick = sinon.stub();
        instance.handleMarkAsUnread();
        expect(instance.props.markNotificationsAsUnread.callCount).toBe(1);
        expect(instance.props.markNotificationsAsUnread.calledWith([props.notification])).toBe(true);
    });

    it('should call onRemove() with notification', () => {
        const props = {
            ...getProps(),
            onRemove: sinon.spy(),
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleMenuItemClick = sinon.stub();
        instance.handleRemove();
        expect(instance.handleMenuItemClick.callCount).toBe(1);
        expect(instance.props.onRemove.callCount).toBe(1);
        expect(instance.props.onRemove.calledWith(props.notification)).toBe(true);
    });

    it('should abort handleRemove() if parent returns false in onRemove()', () => {
        const props = {
            ...getProps(),
            onRemove: () => { return false; },
            removeNotifications: sinon.spy(),
            router: {
                push: sinon.spy(),
            },
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleMenuItemClick = sinon.stub();
        instance.handleRemove();
        expect(instance.props.removeNotifications.callCount).toBe(0);
    });

    it('should continue handleRemove() if parent returns true in onRemove()', () => {
        const props = {
            ...getProps(),
            onRemove: () => { return true; },
            removeNotifications: sinon.spy(),
            router: {
                push: sinon.spy(),
            },
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleMenuItemClick = sinon.stub();
        instance.handleRemove();
        expect(instance.props.removeNotifications.callCount).toBe(1);
        expect(instance.props.removeNotifications.calledWith([props.notification])).toBe(true);
    });
});