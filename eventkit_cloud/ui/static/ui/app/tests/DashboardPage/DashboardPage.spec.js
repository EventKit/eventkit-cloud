import React from 'react';
import { mount, shallow } from 'enzyme';
import sinon from 'sinon';
import { browserHistory } from 'react-router';
import { CircularProgress } from 'material-ui';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { DashboardPage } from '../../components/DashboardPage/DashboardPage';
import DataPackShareDialog from '../../components/DataPackShareDialog/DataPackShareDialog';

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
        };
    }

    function getShallowWrapper(props = getProps()) {
        return shallow(<DashboardPage {...props} />);
    }

    function getMountedWrapper(props = getProps()) {
        return mount(<DashboardPage {...props} />, {
            context: { muiTheme },
            childContextTypes: { muiTheme: React.PropTypes.object },
        });
    }

    function getRuns() {
        return [
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
    }

    function loadEmptyData(wrapper) {
        const { props } = wrapper.instance();
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
            },
        });
    }

    function loadData(wrapper) {
        const { props } = wrapper.instance();
        const runs = getRuns();
        wrapper.setProps({
            ...props,
            runsList: {
                fetching: false,
                fetched: true,
                runs,
            },
            featuredRunsList: {
                fetching: false,
                fetched: true,
                runs,
            },
            userActivity: {
                ...props.userActivity,
                viewedJobs: {
                    ...props.userActivity.viewedJobs,
                    fetching: false,
                    fetched: true,
                    viewedJobs: [
                        { last_export_run: runs[0] },
                        { last_export_run: runs[1] },
                    ],
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
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
    });

    it('should hide loading indicator after page has loaded', () => {
        const wrapper = getShallowWrapper();
        loadData(wrapper);
        expect(wrapper.find(CircularProgress)).toHaveLength(0);
    });

    it('should render basic components after page has loaded', () => {
        const wrapper = getShallowWrapper();
        loadData(wrapper);
        expect(wrapper.find('.qa-Dashboard-AppBar')).toHaveLength(1);
        expect(wrapper.find('.qa-DashboardSection-RecentlyViewed')).toHaveLength(1);
        expect(wrapper.find('.qa-DashboardSection-Featured')).toHaveLength(1);
        expect(wrapper.find('.qa-DashboardSection-MyDataPacks')).toHaveLength(1);
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
        loadData(wrapper);
        const targetRun = {
            job: {
                permissions: {},
            },
        };
        wrapper.instance().handleShareOpen(targetRun);
        expect(wrapper.state().shareOpen).toBe(true);
        expect(wrapper.state().targetRun).toEqual(targetRun);
        expect(wrapper.find(DataPackShareDialog)).toHaveLength(1);
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

    it('joyrideAddSteps should set state for steps in tour', () => {
        const steps = [
            {
                text: 'im the step',
            },
        ];
        const props = getProps();
        const wrapper = getMountedWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().joyrideAddSteps(steps);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ steps }));
        stateStub.restore();
    });

    it('callback function should stop tour if close is clicked', () => {
        const callbackData = {
            action: 'close',
            index: 2,
            step: {
                position: 'bottom',
                selector: '.select',
                style: {},
                text: 'Click here to Navigate to Create a DataPack.',
                title: 'Create DataPack',
            },
            type: 'step:before',
        };
        const props = getProps();
        const wrapper = getMountedWrapper(props);
        const stateSpy = sinon.stub(DashboardPage.prototype, 'setState');
        wrapper.instance().callback(callbackData);
        expect(stateSpy.calledWith({ isRunning: false }));
        stateSpy.restore();
    });

    it('callback should set location hash if step has a scrollToId', () => {
        const callbackData = {
            action: 'next',
            index: 3,
            step: {
                scrollToId: 'test-id',
                position: 'bottom',
                selector: '.select',
                style: {},
                text: 'Click here to Navigate to Create a DataPack.',
                title: 'Create DataPack',
            },
            type: 'step:before',
        };
        const props = getProps();
        const wrapper = getMountedWrapper(props);
        expect(window.location.hash).toEqual('');
        wrapper.instance().callback(callbackData);
        expect(window.location.hash).toEqual('#test-id');
    });
});
