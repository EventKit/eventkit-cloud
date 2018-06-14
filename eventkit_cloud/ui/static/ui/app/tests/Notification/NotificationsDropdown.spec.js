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
        const instance = wrapper.instance();
        loadNotifications(wrapper);
        expect(wrapper.find('.qa-NotificationsDropdown-Pointer')).toHaveLength(1);
        expect(wrapper.find(Paper)).toHaveLength(1);
        // Header
        expect(wrapper.find('.qa-NotificationsDropdown-Header')).toHaveLength(1);
        expect(wrapper.find('.qa-NotificationsDropdown-Header-Title')).toHaveLength(1);
        expect(wrapper.find('.qa-NotificationsDropdown-Header-Title').text()).toBe('Notifications');
        const markAllAsRead = wrapper.find('.qa-NotificationsDropdown-Header-MarkAllAsRead');
        expect(markAllAsRead).toHaveLength(1);
        expect(markAllAsRead.text()).toBe('Mark All As Read');
        expect(markAllAsRead.props().onClick).toBe(instance.props.markAllNotificationsAsRead);
        // Content
        const viewAll = wrapper.find('.qa-NotificationsDropdown-ViewAll');
        expect(viewAll).toHaveLength(1);
        expect(viewAll.props().onClick).toBe(instance.handleViewAll);
        expect(wrapper.find('.qa-NotificationsDropdown-NoData')).toHaveLength(0);
        const grid = wrapper.find('.qa-NotificationsDropdown-Grid');
        expect(grid).toHaveLength(1);
        expect(grid.props().cellHeight).toBe('auto');
        expect(grid.props().padding).toBe(0);
        expect(grid.props().cols).toBe(1);
        expect(grid.children()).toHaveLength(instance.props.notifications.notificationsSorted.length);
        for (let i = 0; i < instance.props.notifications.notificationsSorted.length; i++) {
            const notification = instance.props.notifications.notificationsSorted[i];
            const gridItem = grid.children().at(i);
            expect(gridItem.props().notification).toBe(notification);
            expect(gridItem.props().onView).toBe(instance.props.onNavigate);
            expect(gridItem.props().router).toBe(instance.props.router);
        }
    });

    it('should show loading indicator on page load and hide after fetching notifications', () => {
        const wrapper = getShallowWrapper();
        expect(wrapper.find('.qa-NotificationsDropdown-NoData')).toHaveLength(0);
        expect(wrapper.find('.qa-NotificationsDropdown-Grid')).toHaveLength(0);
        const circularProgress = wrapper.find(CircularProgress);
        expect(circularProgress).toHaveLength(1);
        expect(circularProgress.props().color).toBe('#4598bf');
        expect(circularProgress.props().size).toBe(35);
        loadNotifications(wrapper);
        expect(wrapper.find(CircularProgress)).toHaveLength(0);
    });

    it('should show "no data" message when user has no notificiations', () => {
        const wrapper = getShallowWrapper();
        loadNotificationsEmpty(wrapper);
        const noData = wrapper.find('.qa-NotificationsDropdown-NoData');
        expect(noData).toHaveLength(1);
        expect(noData.text()).toBe("You don't have any notifications.");
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