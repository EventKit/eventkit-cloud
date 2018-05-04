import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import values from 'lodash/values';
import { Divider, IconMenu, MenuItem } from 'material-ui';
import FlagIcon from 'material-ui/svg-icons/content/flag';
import CloseIcon from 'material-ui/svg-icons/navigation/close';
import { NotificationsTableMenu } from '../../components/Notification/NotificationsTableMenu';

const mockNotifications = {
    '1': {
        id: '1',
        verb: 'run_started',
        actor: {
            details: {
                job: {
                    name: 'Test',
                },
            },
        },
        timestamp: 1525299902716,
        unread: false,
    },
    '2': {
        id: '2',
        verb: 'run_completed',
        actor: {
            details: {
                job: {
                    name: 'Test',
                },
            },
        },
        timestamp: 1525299972716,
        unread: true,
    },
};

describe('NotificationsTableMenu component', () => {
    function getProps() {
        return {
            selectedNotifications: mockNotifications,
            router: {
                push: sinon.spy(),
            },
            markNotificationsAsRead: () => {},
            markNotificationsAsUnread: () => {},
            removeNotifications: () => {},
            markAllNotificationsAsRead: () => {},
        };
    }

    function getShallowWrapper(props = getProps()) {
        return shallow(<NotificationsTableMenu {...props} />);
    }

    it('should render the basic elements', () => {
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        expect(wrapper.find(IconMenu)).toHaveLength(1);
        expect(wrapper.find(MenuItem)).toHaveLength(4);
        expect(wrapper.find(MenuItem).get(0).props.primaryText).toBe('Mark As Read');
        expect(wrapper.find(MenuItem).get(0).props.leftIcon).toEqual(<FlagIcon />);
        expect(wrapper.find(MenuItem).get(0).props.onClick).toBe(instance.handleMarkAsRead);
        expect(wrapper.find(MenuItem).get(1).props.primaryText).toBe('Mark As Unread');
        expect(wrapper.find(MenuItem).get(1).props.leftIcon).toEqual(<FlagIcon />);
        expect(wrapper.find(MenuItem).get(1).props.onClick).toBe(instance.handleMarkAsUnread);
        expect(wrapper.find(MenuItem).get(2).props.primaryText).toBe('Remove');
        expect(wrapper.find(MenuItem).get(2).props.leftIcon).toEqual(<CloseIcon />);
        expect(wrapper.find(MenuItem).get(2).props.onClick).toBe(instance.handleRemove);
        expect(wrapper.find(MenuItem).get(3).props.primaryText).toBe('Mark All As Read');
        expect(wrapper.find(MenuItem).get(3).props.onClick).toBe(instance.handleMarkAllAsRead);
        expect(wrapper.find('.qa-NotificationsTableMenu-Remove + Divider')).toHaveLength(1);
    });

    it('should only show "Mark All As Read" with no selected notifications', () => {
        const props = {
            ...getProps(),
            selectedNotifications: {},
        };
        const wrapper = getShallowWrapper(props);
        expect(wrapper.find('.qa-NotificationsTableMenu-MarkAllAsRead')).toHaveLength(1);
        expect(wrapper.find(Divider)).toHaveLength(0);
    });

    it('should show "Mark As Read" and hide "Mark As Unread" when all selected notifications are unread', () => {
        const props = {
            ...getProps(),
            selectedNotifications: {
                '1': {
                    ...mockNotifications['1'],
                    unread: true,
                },
                '2': {
                    ...mockNotifications['2'],
                    unread: true,
                }
            },
        };
        const wrapper = getShallowWrapper(props);
        expect(wrapper.find('.qa-NotificationsTableMenu-MarkAsRead')).toHaveLength(1);
        expect(wrapper.find('.qa-NotificationsTableMenu-MarkAsUnread')).toHaveLength(0);
    });

    it('should show "Mark As Unread" and hide "Mark As Read" when all selected notifications are read', () => {
        const props = {
            ...getProps(),
            selectedNotifications: {
                '1': {
                    ...mockNotifications['1'],
                    unread: false,
                },
                '2': {
                    ...mockNotifications['2'],
                    unread: false,
                }
            },
        };
        const wrapper = getShallowWrapper(props);
        expect(wrapper.find('.qa-NotificationsTableMenu-MarkAsUnread')).toHaveLength(1);
        expect(wrapper.find('.qa-NotificationsTableMenu-MarkAsRead')).toHaveLength(0);
    });

    it('should call onMarkAsRead() with selected notifications array', () => {
        const props = {
            ...getProps(),
            onMarkAsRead: sinon.spy(),
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleMarkAsRead();
        expect(instance.props.onMarkAsRead.callCount).toBe(1);
        expect(instance.props.onMarkAsRead.calledWith(values(props.selectedNotifications))).toBe(true);
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
        instance.handleMarkAsRead();
        expect(instance.props.markNotificationsAsRead.callCount).toBe(1);
        expect(instance.props.markNotificationsAsRead.calledWith(values(props.selectedNotifications))).toBe(true);
    });

    it('should call onMarkAsUnread() with selected notifications array', () => {
        const props = {
            ...getProps(),
            onMarkAsUnread: sinon.spy(),
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleMarkAsUnread();
        expect(instance.props.onMarkAsUnread.callCount).toBe(1);
        expect(instance.props.onMarkAsUnread.calledWith(values(props.selectedNotifications))).toBe(true);
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
        instance.handleMarkAsUnread();
        expect(instance.props.markNotificationsAsUnread.callCount).toBe(1);
        expect(instance.props.markNotificationsAsUnread.calledWith(values(props.selectedNotifications))).toBe(true);
    });

    it('should call onRemove() with selected notifications array', () => {
        const props = {
            ...getProps(),
            onRemove: sinon.spy(),
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleRemove();
        expect(instance.props.onRemove.callCount).toBe(1);
        expect(instance.props.onRemove.calledWith(values(props.selectedNotifications))).toBe(true);
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
        instance.handleRemove();
        expect(instance.props.removeNotifications.callCount).toBe(1);
        expect(instance.props.removeNotifications.calledWith(values(props.selectedNotifications))).toBe(true);
    });
    
    it('should call onMarkAllAsRead()', () => {
        const props = {
            ...getProps(),
            onMarkAllAsRead: sinon.spy(),
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleMarkAllAsRead();
        expect(instance.props.onMarkAllAsRead.callCount).toBe(1);
    });

    it('should abort handleMarkAllAsRead() if parent returns false in onMarkAllAsRead()', () => {
        const props = {
            ...getProps(),
            onMarkAllAsRead: () => { return false; },
            markAllNotificationsAsRead: sinon.spy(),
            router: {
                push: sinon.spy(),
            },
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleMarkAllAsRead();
        expect(instance.props.markAllNotificationsAsRead.callCount).toBe(0);
    });

    it('should continue handleMarkAllAsRead() if parent returns true in onMarkAllAsRead()', () => {
        const props = {
            ...getProps(),
            onMarkAllAsRead: () => { return true; },
            markAllNotificationsAsRead: sinon.spy(),
            router: {
                push: sinon.spy(),
            },
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleMarkAllAsRead();
        expect(instance.props.markAllNotificationsAsRead.callCount).toBe(1);
    });
});