import React from 'react';
import { mount, shallow } from 'enzyme';
import sinon from 'sinon';
import { browserHistory, Link } from 'react-router';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { CircularProgress, Paper } from 'material-ui';
import { userIsDataPackAdmin } from '../../utils/generic';
import { DashboardPage } from '../../components/DashboardPage/DashboardPage';
import DataPackShareDialog from '../../components/DataPackShareDialog/DataPackShareDialog';
import CustomScrollbar from '../../components/CustomScrollbar';
import DashboardSection from '../../components/DashboardPage/DashboardSection';
import NotificationGridItem from '../../components/Notification/NotificationGridItem';
import DataPackGridItem from '../../components/DataPackPage/DataPackGridItem';
import DataPackFeaturedItem from '../../components/DashboardPage/DataPackFeaturedItem';

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
        timestamp: '2018-05-04T17:34:04.716806Z',
        unread: true,
    },
};

const mockRuns = [
    {
        user: 'admin2',
        uid: '2',
        job: {
            uid: '2',
            permissions: {
                value: '',
                groups: {},
                members: {},
            },
        },
    },
    {
        user: 'admin',
        uid: '1',
        job: {
            uid: '1',
            permissions: {
                value: '',
                groups: {},
                members: {},
            },
        },
    },
];

describe('DashboardPage component', () => {
    const muiTheme = getMuiTheme();

    function getProps() {
        return {
            user: {
                data: {
                    user: {
                        username: 'admin',
                    },
                },
            },
            runsList: {
                fetching: false,
                fetched: false,
                runs: [],
            },
            featuredRunsList: {
                fetching: false,
                fetched: false,
                runs: [],
            },
            runsDeletion: {
                deleted: false,
            },
            userActivity: {
                viewedJobs: {
                    fetching: false,
                    fetched: true,
                    viewedJobs: [],
                },
            },
            notifications: {
                fetching: false,
                fetched: false,
                notifications: {},
                notificationsSorted: [],
                unreadCount: {
                    fetching: false,
                    fetched: false,
                    unreadCount: 0,
                },
            },
            updatePermission: {
                updating: false,
                updated: false,
            },
            users: {
                fetching: false,
                fetched: false,
            },
            groups: {
                fetching: false,
                fetched: false,
            },
            refresh: () => {},
            getRuns: () => {},
            getFeaturedRuns: () => {},
            getViewedJobs: () => {},
            getProviders: () => {},
            deleteRuns: () => {},
            getNotifications: () => {},
            updateDataCartPermissions: () => {},
            getUsers: () => {},
            getGroups: () => {},
        }
    }

    function getShallowWrapper(props = getProps()) {
        return shallow(<DashboardPage {...props} />);
    }

    function getMountedWrapper(props = getProps()) {
        return mount(<DashboardPage {...props} />, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
    }

    function wrapShallow(element) {
        return shallow(<div>{element}</div>).childAt(0);
    }

    function loadEmptyData(wrapper) {
        const props = wrapper.instance().props;
        wrapper.setProps({
            ...props,
            runsList: {
                fetching: false,
                fetched: true,
                runs: [],
            },
            featuredRunsList: {
                fetching: false,
                fetched: true,
                runs: [],
            },
            userActivity: {
                ...props.userActivity,
                viewedJobs: {
                    ...props.userActivity.viewedJobs,
                    fetching: false,
                    fetched: true,
                    viewedJobs: [],
                },
            },
            notifications: {
                ...props.notifications,
                fetching: false,
                fetched: true,
                notifications: [],
            },
            users: {
                fetching: false,
                fetched: true,
            },
            groups: {
                fetching: false,
                fetched: true,
                groups: {},
            },
        });
    }

    function loadData(wrapper) {
        const props = wrapper.instance().props;
        wrapper.setProps({
            ...props,
            runsList: {
                fetching: false,
                fetched: true,
                runs: mockRuns,
            },
            featuredRunsList: {
                fetching: false,
                fetched: true,
                runs: mockRuns,
            },
            userActivity: {
                ...props.userActivity,
                viewedJobs: {
                    ...props.userActivity.viewedJobs,
                    fetching: false,
                    fetched: true,
                    viewedJobs: [
                        {last_export_run: mockRuns[0]},
                        {last_export_run: mockRuns[1]},
                    ],
                },
            },
            notifications: {
                ...props.notifications,
                fetching: false,
                fetched: true,
                notifications: mockNotifications,
                notificationsSorted: [
                    mockNotifications['1'],
                    mockNotifications['2'],
                ],
            },
            users: {
                fetching: false,
                fetched: true,
            },
            groups: {
                fetching: false,
                fetched: true,
            },
        });
    }

    it('should have the correct initial state', () => {
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        expect(wrapper.state().loadingPage).toBe(true);
        expect(wrapper.state().shareOpen).toBe(false);
        expect(wrapper.state().targetRun).toBe(null);
        expect(instance.autoRefreshInterval).toBe(10000);
        expect(instance.autoRefreshIntervalId).toBe(null);
    });

    it('should show loading indicator before page has loaded', () => {
        const wrapper = getShallowWrapper();
        const circularProgress = wrapper.find(CircularProgress);
        expect(circularProgress).toHaveLength(1);
        expect(circularProgress.props().color).toBe('#4598bf');
        expect(circularProgress.props().size).toBe(50);
    });

    it('should hide loading indicator after page has loaded', () => {
        const wrapper = getShallowWrapper();
        loadData(wrapper);
        expect(wrapper.find(CircularProgress)).toHaveLength(0);
    });

    it('should render basic components after page has loaded', () => {
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        loadData(wrapper);
        // AppBar
        const appBar = wrapper.find('.qa-Dashboard-AppBar');
        expect(appBar).toHaveLength(1);
        expect(appBar.props().title).toBe('Dashboard');
        expect(appBar.props().iconElementLeft).toEqual(<p />);
        // CustomScrollbar
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        // DashboardSections
        expect(wrapper.find(DashboardSection)).toHaveLength(4);
        // Notifications
        const notifications = wrapper.find('.qa-DashboardSection-Notifications');
        expect(notifications).toHaveLength(1);
        expect(notifications.props().title).toBe('Notifications');
        expect(notifications.props().name).toBe('Notifications');
        expect(notifications.props().columns).toBe(instance.getNotificationsColumns());
        expect(notifications.props().rows).toBe(instance.getNotificationsRows());
        expect(notifications.props().gridPadding).toBe(instance.getGridPadding());
        expect(notifications.props().providers).toBe(instance.props.providers);
        expect(notifications.props().onViewAll).toBe(instance.handleNotificationsViewAll);
        const notificationsNoDataElement = wrapShallow(notifications.props().noDataElement);
        expect(notificationsNoDataElement.find(Paper)).toHaveLength(1);
        expect(notificationsNoDataElement.childAt(0).text()).toBe("You don't have any notifications.");
        expect(notifications.props().rowMajor).toBe(false);
        expect(notifications.children().find(NotificationGridItem)).toHaveLength(instance.props.notifications.notificationsSorted.length);
        for (let i = 0; i < instance.props.notifications.notificationsSorted.length; i++) {
            const notificationItem = notifications.children().find(NotificationGridItem).at(i);
            expect(notificationItem.props().notification).toBe(instance.props.notifications.notificationsSorted[i]);
            expect(notificationItem.props().router).toBe(instance.props.router);
        }
        // Recently Viewed
        const recentlyViewed = wrapper.find('.qa-DashboardSection-RecentlyViewed');
        expect(recentlyViewed).toHaveLength(1);
        expect(recentlyViewed.props().title).toBe('Recently Viewed');
        expect(recentlyViewed.props().name).toBe('RecentlyViewed');
        expect(recentlyViewed.props().columns).toBe(instance.getGridColumns());
        expect(recentlyViewed.props().gridPadding).toBe(instance.getGridPadding());
        expect(recentlyViewed.props().providers).toBe(instance.props.providers);
        const recentlyViewedNoDataElement = wrapShallow(recentlyViewed.props().noDataElement);
        expect(recentlyViewedNoDataElement.find(Paper)).toHaveLength(1);
        expect(recentlyViewedNoDataElement.childAt(0).text()).toEqual(
            shallow(<span>{"You don't have any recently viewed DataPacks."}&nbsp;</span>).text()
        );
        const recentlyViewedNoDataElementLink = recentlyViewedNoDataElement.find(Link);
        expect(recentlyViewedNoDataElementLink).toHaveLength(1);
        expect(recentlyViewedNoDataElementLink.childAt(0).text()).toBe('View DataPack Library');
        expect(recentlyViewedNoDataElementLink.props().to).toBe('/exports');
        expect(recentlyViewedNoDataElementLink.props().href).toBe('/exports');
        expect(recentlyViewed.children().find(DataPackGridItem)).toHaveLength(instance.props.userActivity.viewedJobs.viewedJobs.length);
        for (let i = 0; i < instance.props.userActivity.viewedJobs.viewedJobs.length; i++) {
            const viewedJob = instance.props.userActivity.viewedJobs.viewedJobs[i];
            const run = viewedJob.last_export_run;
            const recentlyViewedItem = recentlyViewed.children().find(DataPackGridItem).at(i);
            expect(recentlyViewedItem.props().run).toBe(run);
            expect(recentlyViewedItem.props().user).toBe(instance.props.user);
            expect(recentlyViewedItem.props().onRunDelete).toBe(instance.props.deleteRuns);
            expect(recentlyViewedItem.props().providers).toBe(instance.props.providers);
            expect(recentlyViewedItem.props().adminPermission).toBe(
                userIsDataPackAdmin(instance.props.user.data.user, run.job.permissions, instance.props.groups.groups)
            );
            expect(recentlyViewedItem.props().openShare).toBe(instance.handleShareOpen);
            expect(recentlyViewedItem.props().gridName).toBe('RecentlyViewed');
            expect(recentlyViewedItem.props().index).toBe(i);
            expect(recentlyViewedItem.props().showFeaturedFlag).toBe(false);
        }
        // Featured
        const featured = wrapper.find('.qa-DashboardSection-Featured');
        expect(featured).toHaveLength(1);
        expect(featured.props().title).toBe('Featured');
        expect(featured.props().name).toBe('Featured');
        expect(featured.props().columns).toBe(instance.getGridWideColumns());
        expect(featured.props().gridPadding).toBe(instance.getGridPadding());
        expect(featured.props().cellHeight).toBe(335);
        expect(featured.props().providers).toBe(instance.props.providers);
        expect(featured.props().onViewAll).toBe(instance.handleFeaturedViewAll);
        expect(featured.children().find(DataPackFeaturedItem)).toHaveLength(instance.props.featuredRunsList.runs.length);
        for (let i = 0; i < instance.props.featuredRunsList.runs.length; i++) {
            const run = instance.props.featuredRunsList.runs[i];
            const featuredItem = featured.children().find(DataPackFeaturedItem).at(i);
            expect(featuredItem.props().run).toBe(run);
            expect(featuredItem.props().gridName).toBe('Featured');
            expect(featuredItem.props().index).toBe(i);
            expect(featuredItem.props().height).toBe('335px');
        }
        // My DataPacks
        const myDataPacks = wrapper.find('.qa-DashboardSection-MyDataPacks');
        expect(myDataPacks).toHaveLength(1);
        expect(myDataPacks.props().title).toBe('My DataPacks');
        expect(myDataPacks.props().name).toBe('MyDataPacks');
        expect(myDataPacks.props().columns).toBe(instance.getGridColumns());
        expect(myDataPacks.props().gridPadding).toBe(instance.getGridPadding());
        expect(myDataPacks.props().providers).toBe(instance.props.providers);
        expect(myDataPacks.props().onViewAll).toBe(instance.handleMyDataPacksViewAll);
        const myDataPacksNoDataElement = wrapShallow(myDataPacks.props().noDataElement);
        expect(myDataPacksNoDataElement.find(Paper)).toHaveLength(1);
        expect(myDataPacksNoDataElement.childAt(0).text()).toEqual(
            shallow(<span>{"You don't have any DataPacks."}&nbsp;</span>).text()
        );
        const myDataPacksNoDataElementLink = myDataPacksNoDataElement.find(Link);
        expect(myDataPacksNoDataElementLink).toHaveLength(1);
        expect(myDataPacksNoDataElementLink.childAt(0).text()).toBe('View DataPack Library');
        expect(myDataPacksNoDataElementLink.props().to).toBe('/exports');
        expect(myDataPacksNoDataElementLink.props().href).toBe('/exports');
        expect(myDataPacks.children().find(DataPackGridItem)).toHaveLength(instance.props.runsList.runs.length);
        for (let i = 0; i < instance.props.runsList.runs.length; i++) {
            const run = instance.props.runsList.runs[i];
            const myDataPacksItem = myDataPacks.children().find(DataPackGridItem).at(i);
            expect(myDataPacksItem.props().run).toBe(run);
            expect(myDataPacksItem.props().user).toBe(instance.props.user);
            expect(myDataPacksItem.props().onRunDelete).toBe(instance.props.deleteRuns);
            expect(myDataPacksItem.props().providers).toBe(instance.props.providers);
            expect(myDataPacksItem.props().adminPermission).toBe(
                userIsDataPackAdmin(instance.props.user.data.user, run.job.permissions, instance.props.groups.groups)
            );
            expect(myDataPacksItem.props().openShare).toBe(instance.handleShareOpen);
            expect(myDataPacksItem.props().gridName).toBe('MyDataPacks');
            expect(myDataPacksItem.props().index).toBe(i);
            expect(myDataPacksItem.props().showFeaturedFlag).toBe(false);
        }
    });

    it('should request necessary data and start auto refresh on mount', () => {
        const refreshSpy = sinon.spy(DashboardPage.prototype, 'refresh');
        const props = {
            ...getProps(),
            getGroups: sinon.spy(),
            getProviders: sinon.spy(),
            getNotifications: sinon.spy(),
        };
        const wrapper = getMountedWrapper(props);
        const instance = wrapper.instance();
        expect(wrapper.props().getGroups.callCount).toBe(1);
        expect(wrapper.props().getProviders.callCount).toBe(1);
        expect(wrapper.props().getNotifications.callCount).toBe(1);
        expect(refreshSpy.callCount).toBe(1);
        expect(instance.autoRefreshIntervalId).not.toBe(null);
        refreshSpy.restore();
    });

    it('should stop auto refreshing on unmount', () => {
        const wrapper = getMountedWrapper();
        const instance = wrapper.instance();
        wrapper.unmount();
        expect(instance.autoRefreshIntervalId).toBe(null);
    });

    it('should refresh the page periodically', () => {
        jest.useFakeTimers();
        const refreshSpy = sinon.spy(DashboardPage.prototype, 'refresh');
        const wrapper = getMountedWrapper();
        loadEmptyData(wrapper);
        expect(refreshSpy.callCount).toBe(1);
        jest.runOnlyPendingTimers();
        expect(refreshSpy.callCount).toBe(2);
        jest.runOnlyPendingTimers();
        expect(refreshSpy.callCount).toBe(3);
        refreshSpy.restore();
    });

    it('should refresh the page when deleting a datapack', () => {
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        instance.refresh = sinon.spy();
        loadData(wrapper);
        wrapper.setProps({
            runsDeletion: {
                deleted: true,
            },
        });
        expect(instance.refresh.callCount).toBe(1);
    });

    it('should refresh the page when updating permissions', () => {
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        instance.refresh = sinon.spy();
        loadData(wrapper);
        wrapper.setProps({
            updatePermission: {
                updated: true,
            },
        });
        expect(instance.refresh.callCount).toBe(1);
    });

    it('should show loading indicator while deleting a datapack', () => {
        const wrapper = getShallowWrapper();
        loadData(wrapper);
        wrapper.setProps({
            runsDeletion: {
                deleting: true,
            },
        });
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
        wrapper.setProps({
            runsDeletion: {
                deleting: false,
            },
        });
        expect(wrapper.find(CircularProgress)).toHaveLength(0);
    });

    it('should show loading indicator while deleting a datapack', () => {
        const wrapper = getShallowWrapper();
        loadData(wrapper);
        wrapper.setProps({
            updatePermission: {
                updating: true,
            },
        });
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
        wrapper.setProps({
            updatePermission: {
                updating: false,
            },
        });
        expect(wrapper.find(CircularProgress)).toHaveLength(0);
    });

    it('should NOT show a loading indicator when automatically refreshing', () => {
        const wrapper = getShallowWrapper();
        loadData(wrapper);
        wrapper.instance().autoRefresh();
        expect(wrapper.find(CircularProgress)).toHaveLength(0);
    });

    it('should correctly handle Notifications section "View All"', () => {
        const browserHistoryPushStub = sinon.stub(browserHistory, 'push');
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        loadData(wrapper);
        instance.handleNotificationsViewAll();
        expect(browserHistoryPushStub.callCount).toBe(1);
        expect(browserHistoryPushStub.calledWith('/notifications')).toBe(true);
        browserHistoryPushStub.restore();
    });

    it('should correctly handle Featured section "View All"', () => {
        const browserHistoryPushStub = sinon.stub(browserHistory, 'push');
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        loadData(wrapper);
        instance.handleFeaturedViewAll();
        expect(browserHistoryPushStub.callCount).toBe(1);
        expect(browserHistoryPushStub.calledWith('/exports')).toBe(true);
        browserHistoryPushStub.restore();
    });

    it('should correctly handle My DataPacks "View All"', () => {
        const browserHistoryPushStub = sinon.stub(browserHistory, 'push');
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        loadData(wrapper);
        instance.handleMyDataPacksViewAll();
        expect(browserHistoryPushStub.callCount).toBe(1);
        expect(browserHistoryPushStub.calledWith('/exports?collection=myDataPacks')).toBe(true);
        browserHistoryPushStub.restore();
    });

    it('should open share dialog with the target run', () => {
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        loadData(wrapper);
        const targetRun = {
            job: {
                permissions: {},
            },
        };
        wrapper.instance().handleShareOpen(targetRun);
        expect(wrapper.state().shareOpen).toBe(true);
        expect(wrapper.state().targetRun).toEqual(targetRun);
        const shareDialog = wrapper.find(DataPackShareDialog);
        expect(shareDialog).toHaveLength(1);
        expect(shareDialog.props().show).toBe(true);
        expect(shareDialog.props().onClose).toBe(instance.handleShareClose);
        expect(shareDialog.props().onSave).toBe(instance.handleShareSave);
        expect(shareDialog.props().user).toBe(instance.props.user.data);
        expect(shareDialog.props().groups).toBe(instance.props.groups.groups);
        expect(shareDialog.props().members).toBe(instance.props.users.users);
        expect(shareDialog.props().permissions).toBe(instance.state.targetRun.job.permissions);
        expect(shareDialog.props().groupsText).toBe(
            'You may share view and edit rights with groups exclusively. Group sharing is managed separately from member sharing.'
        );
        expect(shareDialog.props().membersText).toBe(
            'You may share view and edit rights with members exclusively. Member sharing is managed separately from group sharing.'
        );
        expect(shareDialog.props().canUpdateAdmin).toBe(true);
        expect(shareDialog.props().warnPublic).toBe(true);
    });

    it('should close share dialog and nullify the target run', () => {
        const wrapper = getShallowWrapper();
        wrapper.setState({
            shareOpen: true,
            run: 'test',
        });
        loadData(wrapper);
        wrapper.instance().handleShareClose();
        expect(wrapper.state().shareOpen).toBe(false);
        expect(wrapper.state().targetRun).toBe(null);
        expect(wrapper.find(DataPackShareDialog)).toHaveLength(0);
    });

    it('should close the share dialog and update datacart permissions', () => {
        const wrapper = getShallowWrapper({
            ...getProps(),
            updateDataCartPermissions: sinon.spy(),
        });
        const instance = wrapper.instance();
        instance.handleShareClose = sinon.spy();
        const targetRun = {
            job: {
                uid: 1,
            },
        };
        wrapper.setState({
            shareOpen: true,
            targetRun,
        });
        loadData(wrapper);
        const permissions = { some: 'permissions' };
        instance.handleShareSave(permissions);
        expect(instance.handleShareClose.callCount).toBe(1);
        expect(instance.props.updateDataCartPermissions.callCount).toBe(1);
        expect(instance.props.updateDataCartPermissions.calledWith(targetRun.job.uid, permissions)).toBe(true);
    });
});
