import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { CircularProgress, Paper } from 'material-ui';
import { NotificationsDropdown } from '../../components/Notification/NotificationsDropdown';

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
        timestamp: '2018-05-04T17:32:04.716806Z',
        unread: true,
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
        timestamp: '2018-05-04T17:34:04.716806Z',
        unread: true,
    },
};

function loadNotifications(wrapper) {
    const props = wrapper.instance().props;
    wrapper.setProps({
        ...props,
        notifications: {
            ...props,
            fetched: true,
            notifications: mockNotifications,
            notificationsSorted: [
                mockNotifications['1'],
                mockNotifications['2'],
            ],
        },
    });
}

function loadNotificationsEmpty(wrapper) {
    const props = wrapper.instance().props;
    wrapper.setProps({
        ...props,
        notifications: {
            ...props.notifications,
            fetched: true,
            notifications: {},
            notificationsSorted: [],
        },
    });
}

describe('NotificationsDropdown component', () => {
    function getProps() {
        return {
            notifications: {
                fetched: false,
                notifications: {},
                notificationsSorted: [],
            },
            router: {
                push: () => {},
            },
            markAllNotificationsAsRead: () => {},
        };
    }

    function getShallowWrapper(props = getProps()) {
        return shallow(<NotificationsDropdown {...props} />);
    }

    it('should have the correct initial state', () => {
        const wrapper = getShallowWrapper();
        expect(wrapper.state().showLoading).toBe(true);
    });

    it('should render the basic elements', () => {
        const wrapper = getShallowWrapper();
        expect(wrapper.find('.qa-NotificationsDropdown-Pointer')).toHaveLength(1);
        expect(wrapper.find(Paper)).toHaveLength(1);
        expect(wrapper.find('.qa-NotificationsDropdown-Header')).toHaveLength(1);
        expect(wrapper.find('.qa-NotificationsDropdown-Header-Title')).toHaveLength(1);
        expect(wrapper.find('.qa-NotificationsDropdown-Header-Title').text()).toBe('Notifications');
        expect(wrapper.find('.qa-NotificationsDropdown-Header-MarkAllAsRead')).toHaveLength(1);
        expect(wrapper.find('.qa-NotificationsDropdown-Header-MarkAllAsRead').text()).toBe('Mark All As Read');
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
        expect(wrapper.find('.qa-NotificationsDropdown-ViewAll')).toHaveLength(1);
        expect(wrapper.find('.qa-NotificationsDropdown-NoData')).toHaveLength(0);
        expect(wrapper.find('.qa-NotificationsDropdown-Grid')).toHaveLength(0);
    });

    it('should hide loading indicator after fetching notifications', () => {
        const wrapper = getShallowWrapper();
        loadNotifications(wrapper);
        expect(wrapper.find(CircularProgress)).toHaveLength(0);
    });

    it('should show "no data" message when user has no notificiations', () => {
        const wrapper = getShallowWrapper();
        loadNotificationsEmpty(wrapper);
        expect(wrapper.find('.qa-NotificationsDropdown-NoData')).toHaveLength(1);
        expect(wrapper.find('.qa-NotificationsDropdown-NoData').text()).toBe("You don't have any notifications.");
    });

    it('should show notifications after fetching them', () => {
        const wrapper = getShallowWrapper();
        loadNotifications(wrapper);
        expect(wrapper.find('.qa-NotificationsDropdown-Grid')).toHaveLength(1);
    });

    it('should show a NotificationGridItem for each notification', () => {
        const wrapper = getShallowWrapper();
        loadNotifications(wrapper);
        const notificationsCount = wrapper.instance().props.notifications.notificationsSorted.length;
        expect(wrapper.find('.qa-NotificationsDropdown-Grid').children()).toHaveLength(notificationsCount);
    });

    it('should mark all as read when button is clicked', () => {
        const props = {
            ...getProps(),
            markAllNotificationsAsRead: () => {},
        };
        const wrapper = getShallowWrapper(props);
        loadNotifications(wrapper);
        expect(wrapper.find('.qa-NotificationsDropdown-Header-MarkAllAsRead').get(0).props.onClick).toBe(props.markAllNotificationsAsRead);
    });

    it('should pass the correct props to NotificationGridItem', () => {
        const props = {
            ...getProps(),
            onNavigate: () => {},
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        loadNotifications(wrapper);
        const grid = wrapper.find('.qa-NotificationsDropdown-Grid');
        expect(grid.children().get(0).props.notification).toBe(instance.props.notifications.notificationsSorted[0]);
        expect(grid.children().get(0).props.onView).toBe(props.onNavigate);
        expect(grid.children().get(0).props.router).toBe(props.router);
    });

    it('should correctly handle "View All" button click', () => {
        const props = {
            ...getProps(),
            router: {
                push: sinon.spy(),
            },
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        expect(wrapper.find('.qa-NotificationsDropdown-ViewAll').get(0).props.onClick).toBe(instance.handleViewAll);
        instance.handleViewAll();
        expect(instance.props.router.push.callCount).toBe(1);
        expect(instance.props.router.push.calledWith('/notifications')).toBe(true);
    });

    it('should call onNavigate() with "/notifications" in handleViewAll()', () => {
        const props = {
            ...getProps(),
            onNavigate: sinon.spy(),
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleViewAll();
        expect(instance.props.onNavigate.callCount).toBe(1);
        expect(instance.props.onNavigate.calledWith('/notifications')).toBe(true);
    });

    it('should abort handleViewAll() if parent returns false in onNavigate()', () => {
        const props = {
            ...getProps(),
            router: {
                push: sinon.spy(),
            },
            onNavigate: () => { return false; },
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleViewAll();
        expect(instance.props.router.push.callCount).toBe(0);
    });

    it('should continue handleViewAll() if parent returns true in onNavigate()', () => {
        const props = {
            ...getProps(),
            router: {
                push: sinon.spy(),
            },
            onNavigate: () => { return true; },
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        instance.handleViewAll();
        expect(instance.props.router.push.callCount).toBe(1);
    });
});