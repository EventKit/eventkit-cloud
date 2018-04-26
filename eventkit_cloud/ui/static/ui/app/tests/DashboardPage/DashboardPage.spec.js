import React from 'react';
import { mount, shallow } from 'enzyme';
import sinon from 'sinon';
import AppBar from 'material-ui/AppBar';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { DashboardPage } from '../../components/DashboardPage/DashboardPage';
import { CircularProgress, GridList } from 'material-ui';
import DataPackGridItem from '../../components/DataPackPage/DataPackGridItem';

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
            groups: [],
            refresh: () => {},
            getRuns: () => {},
            getFeaturedRuns: () => {},
            getViewedJobs: () => {},
            getProviders: () => {},
            deleteRuns: () => {},
            getNotifications: () => {},
            updateDataCartPermissions: () => {},
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
        });
    }

    function loadData(wrapper) {
        const props = wrapper.instance().props;
        const runs = getRuns();
        wrapper.setProps({
            ...props,
            runsList: {
                fetching: false,
                fetched: true,
                runs: runs,
            },
            featuredRunsList: {
                fetching: false,
                fetched: true,
                runs: runs,
            },
            userActivity: {
                ...props.userActivity,
                viewedJobs: {
                    ...props.userActivity.viewedJobs,
                    fetching: false,
                    fetched: true,
                    viewedJobs: [
                        {last_export_run: runs[0]},
                        {last_export_run: runs[1]},
                    ],
                },
            },
            notifications: {
                ...props.notifications,
                fetching: false,
                fetched: true,
                notifications: [],
            },
        });
    }

    it('should render loading indicator before page has loaded', () => {
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

    it('should refresh page when deleting datapack', () => {
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
});
