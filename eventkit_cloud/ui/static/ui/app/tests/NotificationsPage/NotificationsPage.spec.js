import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { NotificationsPage } from '../../components/NotificationsPage/NotificationsPage';
import { AppBar, CircularProgress } from 'material-ui';
import CustomScrollbar from '../../components/CustomScrollbar';
import NotificationsTable from '../../components/Notification/NotificationsTable';
import LoadButtons from '../../components/DataPackPage/LoadButtons';
import NotificationGridItem from '../../components/Notification/NotificationGridItem';

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

describe('NotificationsPage component', () => {
    beforeEach(() => {
        window.resizeTo(1920, 1080);
    });

    function getProps() {
        return {
            notifications: {
                fetched: false,
                notifications: {},
                notificationsSorted: [],
                range: null,
                nextPage: null,
            },
            router: {
                push: sinon.spy(),
            },
            getNotifications: () => {},
        };
    }

    function getShallowWrapper(props = getProps()) {
        return shallow(<NotificationsPage {...props} />);
    }

    function loadNotifications(wrapper) {
        wrapper.setProps({
            notifications: {
                fetched: true,
                notifications: mockNotifications,
                notificationsSorted: [
                    mockNotifications['1'],
                    mockNotifications['2'],
                ],
                range: '2/4',
                nextPage: true,
            },
        });
    }

    it('should have the correct initial state', () => {
        const wrapper = getShallowWrapper();
        expect(wrapper.state().loadingPage).toEqual(true);
        expect(wrapper.state().loading).toEqual(true);
        expect(wrapper.state().pageSize).toEqual(wrapper.instance().itemsPerPage);
        expect(wrapper.instance().itemsPerPage).toBe(12);
    });

    it('should render the basic elements', () => {
        const wrapper = getShallowWrapper();
        expect(wrapper.find(AppBar)).toHaveLength(1);
        expect(wrapper.find(AppBar).get(0).props.title).toBe('Notifications');
        expect(wrapper.find(AppBar).get(0).props.iconElementLeft).toEqual(<p />);
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
        expect(wrapper.find(CircularProgress).get(0).props.color).toBe('#4598bf');
        expect(wrapper.find(CircularProgress).get(0).props.size).toBe(50);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find('.qa-NotificationsPage-Content')).toHaveLength(0);
    });

    it('should hide loading and show content after notifications are fetched', () => {
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
        expect(wrapper.find('.qa-NotificationsPage-Content')).toHaveLength(0);
        loadNotifications(wrapper);
        expect(wrapper.find(CircularProgress)).toHaveLength(0);
        expect(wrapper.find('.qa-NotificationsPage-Content')).toHaveLength(1);
        expect(wrapper.find('.qa-NotificationsPage-Content-NoData')).toHaveLength(0);
        expect(wrapper.find('.qa-NotificationsPage-Content-Notifications')).toHaveLength(1);
        expect(wrapper.find(NotificationsTable)).toHaveLength(1);
        expect(wrapper.find(NotificationsTable).get(0).props.notifications).toBe(instance.props.notifications);
        const notificationsArray = instance.props.notifications.notificationsSorted.slice(0, instance.state.pageSize);
        expect(wrapper.find(NotificationsTable).get(0).props.notificationsArray).toEqual(notificationsArray);
        expect(wrapper.find(NotificationsTable).get(0).props.router).toEqual(instance.props.router);
        expect(wrapper.find(LoadButtons)).toHaveLength(1);
        expect(wrapper.find(LoadButtons).get(0).props.range).toBe(instance.props.notifications.range);
        expect(wrapper.find(LoadButtons).get(0).props.handleLoadMore).toBe(instance.handleLoadMore);
        expect(wrapper.find(LoadButtons).get(0).props.loadMoreDisabled).toBe(!instance.props.notifications.nextPage);
    });

    it('should show message if user has no notifications', () => {
        const wrapper = getShallowWrapper();
        wrapper.setProps({
            notifications: {
                fetched: true,
                notifications: {},
                notificationsSorted: [],
            },
        });
        expect(wrapper.find('.qa-NotificationsPage-Content-NoData')).toHaveLength(1);
        expect(wrapper.find('.qa-NotificationsPage-Content-NoData').childAt(0).text()).toBe("You don't have any notifications.");
        expect(wrapper.find('.qa-NotificationsPage-Content-Notifications')).toHaveLength(0);
    });

    it('should show notification grid list on screen widths <= 768', () => {
        window.resizeTo(768, 600);
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        loadNotifications(wrapper);
        expect(wrapper.find('.qa-NotificationsPage-Content-Notifications-Grid')).toHaveLength(1);
        const grid = wrapper.find('.qa-NotificationsPage-Content-Notifications-Grid').get(0);
        expect(grid.props.cellHeight).toBe('auto');
        expect(grid.props.padding).toBe(2);
        expect(grid.props.cols).toBe(1);
        expect(wrapper.find(NotificationGridItem)).toHaveLength(instance.props.notifications.notificationsSorted.length);
        const gridItem = wrapper.find(NotificationGridItem).get(0);
        expect(gridItem.props.notification).toBe(instance.props.notifications.notificationsSorted[0]);
        expect(gridItem.props.router).toBe(instance.props.router);
    });

    it('should refresh on mount', () => {
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        instance.refresh = sinon.spy();
        instance.componentDidMount();
        expect(instance.refresh.callCount).toBe(1);
    });

    it('should get notifications and set state in refresh()', () => {
        const props = {
            ...getProps(),
            getNotifications: sinon.spy(),
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        loadNotifications(wrapper);
        expect(props.getNotifications.callCount).toBe(0);
        expect(instance.state.loading).toBe(false);
        instance.refresh();
        expect(props.getNotifications.callCount).toBe(1);
        expect(instance.state.loading).toBe(true);
    });

    it('should set state and refresh in handleLoadMore()', () => {
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        instance.refresh = sinon.spy();
        loadNotifications(wrapper);
        expect(instance.state.pageSize).toBe(instance.itemsPerPage);
        expect(instance.refresh.callCount).toBe(0);
        instance.handleLoadMore();
        expect(instance.state.pageSize).toBe(instance.itemsPerPage * 2);
        expect(instance.refresh.callCount).toBe(1);
    });

    it('should not set state or refresh in handleLoadMore() without a next page', () => {
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        instance.refresh = sinon.spy();
        expect(instance.state.pageSize).toBe(instance.itemsPerPage);
        expect(instance.refresh.callCount).toBe(0);
        instance.handleLoadMore();
        expect(instance.state.pageSize).toBe(instance.itemsPerPage);
        expect(instance.refresh.callCount).toBe(0);
    });
});