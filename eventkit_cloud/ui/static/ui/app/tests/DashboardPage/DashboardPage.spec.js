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
                viewedJobs: {
                    fetching: false,
                    fetched: false,
                    jobs: [],
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
            refresh: () => {},
            getRuns: () => {},
            getFeaturedRuns: () => {},
            getViewedJobs: () => {},
            getProviders: () => {},
            deleteRuns: () => {},
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
                },
            },
            {
                user: 'admin',
                uid: '1',
                job: {
                    uid: '1',
                },
            },
        ];
    }

    function loadNoDataPacks(wrapper) {
        const props = wrapper.props();
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
            user: {
                ...props.user,
                viewedJobs: {
                    fetching: false,
                    fetched: true,
                    jobs: [],
                },
            },
        });
    }

    function loadDataPacks(wrapper) {
        const props = wrapper.props();
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
            user: {
                ...props.user,
                viewedJobs: {
                    fetching: false,
                    fetched: true,
                    jobs: [
                        {last_export_run: runs[0]},
                        {last_export_run: runs[1]},
                    ],
                },
            },
        });
    }

    it('should render loading indicator before page has loaded', () => {
        const wrapper = getShallowWrapper();
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
    });

    it('should hide loading indicator after page has loaded', () => {
        const wrapper = getShallowWrapper();
        loadDataPacks(wrapper);
        expect(wrapper.find(CircularProgress)).toHaveLength(0);
    });

    it('should render basic components after page has loaded', () => {
        const wrapper = getShallowWrapper();
        loadDataPacks(wrapper);
        expect(wrapper.find(AppBar)).toHaveLength(3);
    });

    it('should render messages when data is not available', () => {
        const wrapper = getShallowWrapper();
        loadNoDataPacks(wrapper);
        expect(wrapper.find('.qa-Dashboard-MyDataPacks-NoData')).toHaveLength(1);
        expect(wrapper.find('.qa-Dashboard-RecentlyViewedDataPacks-NoData')).toHaveLength(1);
        expect(wrapper.find(GridList)).toHaveLength(0);
    });

    it('should render datapacks after data is loaded', () => {
        const wrapper = getShallowWrapper();
        loadDataPacks(wrapper);
        expect(wrapper.find('.qa-Dashboard-MyDataPacks-NoData')).toHaveLength(0);
        expect(wrapper.find('.qa-Dashboard-RecentlyViewedDataPacks-NoData')).toHaveLength(0);
        expect(wrapper.find(GridList)).toHaveLength(3);
        expect(wrapper.find(GridList).at(0).find(DataPackGridItem)).toHaveLength(2);
        expect(wrapper.find(GridList).at(1).find(DataPackGridItem)).toHaveLength(2);
        expect(wrapper.find(GridList).at(2).find(DataPackGridItem)).toHaveLength(2);
    });

    it('should refresh the page periodically', () => {
        jest.useFakeTimers();
        const refreshSpy = new sinon.spy(DashboardPage.prototype, 'refresh');
        const wrapper = getMountedWrapper();
        loadNoDataPacks(wrapper);
        expect(refreshSpy.calledOnce).toBe(true);
        expect(setInterval.mock.calls.length).toEqual(1);
        expect(setInterval.mock.calls[0][1]).toEqual(10000);
        jest.runOnlyPendingTimers();
        expect(refreshSpy.calledTwice).toBe(true);
        jest.runOnlyPendingTimers();
        expect(refreshSpy.calledThrice).toBe(true);
    });

    it('should refresh page when deleting datapack', () => {
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        instance.refresh = sinon.spy();
        loadDataPacks(wrapper);
        expect(wrapper.find(CircularProgress)).toHaveLength(0);
        wrapper.setProps({
            runsDeletion: {
                deleted: true,
            },
        });
        expect(instance.refresh.calledOnce).toBe(true);
    });

    it('should show loading indicator on refresh({ showLoading: true })', () => {
        const wrapper = getMountedWrapper();
        const instance = wrapper.instance();
        loadNoDataPacks(wrapper);
        expect(wrapper.find(CircularProgress)).toHaveLength(0);
        instance.refresh({ showLoading: true });
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
    });

    it('should not show loading indicator on refresh()', () => {
        const wrapper = getMountedWrapper();
        const instance = wrapper.instance();
        loadNoDataPacks(wrapper);
        expect(wrapper.find(CircularProgress)).toHaveLength(0);
        instance.refresh();
        expect(wrapper.find(CircularProgress)).toHaveLength(0);
    });
});
