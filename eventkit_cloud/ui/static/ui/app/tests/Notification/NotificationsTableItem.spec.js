import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import moment from 'moment';
import OpenInNewIcon from 'material-ui/svg-icons/action/open-in-new';
import FlagIcon from 'material-ui/svg-icons/content/flag';
import CloseIcon from 'material-ui/svg-icons/navigation/close';
import { NotificationsTableItem } from '../../components/Notification/NotificationsTableItem';
import { getNotificationViewPath } from '../../utils/notificationUtils';
import { Checkbox, FlatButton, TableRow, TableRowColumn } from 'material-ui';

describe('NotificationsTableItem component', () => {
    beforeEach(() => {
        window.resizeTo(1920, 1080);
    });

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
                timestamp: 1525299972716,
                unread: true,
            },
            isSelected: true,
            router: {
                push: sinon.spy(),
            },
            markNotificationsAsRead: () => {},
            markNotificationsAsUnread: () => {},
            removeNotifications: () => {},
        };
    }

    function getShallowWrapper(props = getProps()) {
        return shallow(<NotificationsTableItem {...props} />);
    }

    function elementType(element) {
        return shallow(<div>{element}</div>).childAt(0).type();
    }

    it('should render the basic elements', () => {
        const props = getProps();
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        expect(wrapper.find(TableRow)).toHaveLength(1);
        expect(wrapper.find(TableRowColumn)).toHaveLength(4);
        expect(wrapper.find('.qa-NotificationsTableItem-Checkbox').find(Checkbox)).toHaveLength(1);
        const content = wrapper.find('.qa-NotificationsTableItem-Content');
        expect(content.find('.qa-NotificationIcon')).toHaveLength(1);
        expect(content.find('.qa-NotificationMessage-Text')).toHaveLength(1);
        expect(content.find('.qa-NotificationMessage-Link')).toHaveLength(1);
        const date = wrapper.find('.qa-NotificationsTableItem-Date');
        expect(date.childAt(0).text()).toBe(moment(props.notification.timestamp).format('M/D/YY'));
        expect(date.childAt(1).text()).toBe(moment(props.notification.timestamp).format('h:mma'));
        const options = wrapper.find('.qa-NotificationsTableItem-TableRowColumn-Options');
        expect(options.find(FlatButton)).toHaveLength(3);
        const viewButton = options.find(FlatButton).get(0);
        expect(viewButton.props.label).toBe('View');
        expect(elementType(viewButton.props.icon)).toBe(OpenInNewIcon);
        expect(viewButton.props.onClick).toBe(instance.handleView);
        const markAsReadButton = options.find(FlatButton).get(1);
        expect(markAsReadButton.props.label).toBe('Mark As Read');
        expect(elementType(markAsReadButton.props.icon)).toBe(FlagIcon);
        expect(markAsReadButton.props.onClick).toBe(instance.handleMarkAsRead);
        const removeButton = options.find(FlatButton).get(2);
        expect(removeButton.props.label).toBe('Remove');
        expect(elementType(removeButton.props.icon)).toBe(CloseIcon);
        expect(removeButton.props.onClick).toBe(instance.handleRemove);
    });

    it('should show menu instead of buttons below a window width of 1280', () => {
        window.resizeTo(1024, 768);
        const wrapper = getShallowWrapper();
        const options = wrapper.find('.qa-NotificationsTableItem-TableRowColumn-Options');
        expect(options.find(FlatButton)).toHaveLength(0);
        expect(options.find('.qa-NotificationsTableItem-NotificationMenu')).toHaveLength(1);
    });

    it('should pass correct props to NotificationMenu', () => {
        window.resizeTo(1024, 768);
        const props = {
            ...getProps(),
            onMarkAsRead: () => {},
            onMarkAsUnread: () => {},
            onRemove: () => {},
            onView: () => {},
        };
        const wrapper = getShallowWrapper(props);
        const options = wrapper.find('.qa-NotificationsTableItem-TableRowColumn-Options');
        const menu = options.find('.qa-NotificationsTableItem-NotificationMenu').get(0);
        expect(menu.props.notification).toBe(props.notification);
        expect(menu.props.router).toBe(props.router);
        expect(menu.props.onMarkAsRead).toBe(props.onMarkAsRead);
        expect(menu.props.onMarkAsUnread).toBe(props.onMarkAsUnread);
        expect(menu.props.onRemove).toBe(props.onRemove);
        expect(menu.props.onView).toBe(props.onView);
    });

    it('should change second button to "Mark As Unread" when notification is read', () => {
        const props = getProps();
        props.notification = {
            ...props.notification,
            unread: false,
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        const button = wrapper.find(FlatButton).get(1);
        expect(button.props.label).toBe('Mark As Unread');
        expect(elementType(button.props.icon)).toBe(FlagIcon);
        expect(button.props.onClick).toBe(instance.handleMarkAsUnread);
    });

    it('should call onView() with notification', () => {
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
        instance.handleMarkAsRead();
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
        instance.handleMarkAsRead();
        expect(instance.props.markNotificationsAsRead.callCount).toBe(0);
    });

    it('should continue handleMarkAsRead() if parent returns true in onMarkAsRead()', () => {
        const props = {
            ...getProps(),
            markNotificationsAsRead: sinon.spy(),
            router: {
                push: sinon.spy(),
            },
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
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
        instance.handleMarkAsUnread();
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
        expect(instance.props.markNotificationsAsUnread.calledWith([props.notification])).toBe(true);
    });

    it('should call onRemove() with notification', () => {
        const props = {
            ...getProps(),
            onRemove: sinon.spy(),
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleRemove();
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
        expect(instance.props.removeNotifications.calledWith([props.notification])).toBe(true);
    });

    it('should show a non-white background color for unread notifications', () => {
        const wrapper = getShallowWrapper();
        expect(wrapper.find(TableRow).get(0).props.style.backgroundColor).not.toBe('white');
    });

    it('should show a white background color for read notifications', () => {
        const props = getProps();
        props.notification = {
            ...props.notification,
            unread: false,
        };
        const wrapper = getShallowWrapper(props);
        expect(wrapper.find(TableRow).get(0).props.style.backgroundColor).toBe('white');
    });

    it('should pass correct props to checkbox', () => {
        const props = {
            ...getProps(),
            setSelected: sinon.spy(),
        };
        const wrapper = getShallowWrapper(props);
        const checkbox = wrapper.find('.qa-NotificationsTableItem-Checkbox').find(Checkbox).get(0);
        expect(checkbox.props.checked).toBe(props.isSelected);
        checkbox.props.onCheck({}, false);
        expect(props.setSelected.callCount).toBe(1);
        expect(props.setSelected.calledWith(props.notification, false)).toBe(true);
    });
});