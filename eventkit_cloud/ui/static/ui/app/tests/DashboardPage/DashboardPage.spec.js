/* eslint prefer-destructuring: 0 */
import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { browserHistory } from 'react-router';
import { CircularProgress } from 'material-ui';
import { DashboardPage } from '../../components/DashboardPage/DashboardPage';
import DataPackShareDialog from '../../components/DataPackShareDialog/DataPackShareDialog';
import DashboardSection from '../../components/DashboardPage/DashboardSection';
import NotificationGridItem from '../../components/Notification/NotificationGridItem';
import DataPackGridItem from '../../components/DataPackPage/DataPackGridItem';
import DataPackFeaturedItem from '../../components/DashboardPage/DataPackFeaturedItem';

const mockNotifications = {
    1: {
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
    2: {
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
    let wrapper;
    let instance;

    function defaultProps() {
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
            refresh: sinon.spy(),
            getRuns: sinon.spy(),
            getFeaturedRuns: sinon.spy(),
            getViewedJobs: sinon.spy(),
            deleteRuns: sinon.spy(),
            getUsers: sinon.spy(),
            updateDataCartPermissions: sinon.spy(),
            getGroups: sinon.spy(),
            getProviders: sinon.spy(),
            getNotifications: sinon.spy(),
        };
    }

    function setup(propsOverride = {}) {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = shallow(<DashboardPage {...props} />);
        instance = wrapper.instance();

        instance.joyride = {
            reset: () => {},
        };
    }

    function loadEmptyData() {
        wrapper.setProps({
            ...instance.props,
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
                ...instance.props.userActivity,
                viewedJobs: {
                    ...instance.props.userActivity.viewedJobs,
                    fetching: false,
                    fetched: true,
                    viewedJobs: [],
                },
            },
            notifications: {
                ...instance.props.notifications,
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

    function loadData() {
        wrapper.setProps({
            ...instance.props,
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
                ...instance.props.userActivity,
                viewedJobs: {
                    ...instance.props.userActivity.viewedJobs,
                    fetching: false,
                    fetched: true,
                    viewedJobs: [
                        { last_export_run: mockRuns[0] },
                        { last_export_run: mockRuns[1] },
                    ],
                },
            },
            notifications: {
                ...instance.props.notifications,
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

    beforeEach(setup);

    it('joyrideAddSteps should set state for steps in tour', () => {
        const steps = [
            {
                text: 'im the step',
            },
        ];
        const stateStub = sinon.stub(instance, 'setState');
        instance.joyrideAddSteps(steps);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ steps }));
        stateStub.restore();
    });

    it('callback function stops tour if close is clicked', () => {
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
        const stateSpy = sinon.stub(DashboardPage.prototype, 'setState');
        instance.callback(callbackData);
        expect(stateSpy.calledWith({ isRunning: false }));
        stateSpy.restore();
    });

    it('callback sets location hash if step has a scrollToId', () => {
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
        expect(window.location.hash).toEqual('');
        instance.callback(callbackData);
        expect(window.location.hash).toEqual('#test-id');
    });

    describe('when it mounts', () => {
        let refreshSpy;

        beforeEach(() => {
            refreshSpy = sinon.spy(DashboardPage.prototype, 'refresh');
            jest.useFakeTimers();
            setup();
            instance.componentDidMount();
        });

        afterEach(() => {
            refreshSpy.restore();
        });

        it('requests groups', () => {
            expect(instance.props.getGroups.callCount).toBe(2);
        });

        it('requests providers', () => {
            expect(instance.props.getProviders.callCount).toBe(2);
        });

        it('requests notifications', () => {
            expect(instance.props.getNotifications.callCount).toBe(2);
        });

        it('refreshes the page periodically', () => {
            expect(instance.autoRefreshIntervalId).not.toBe(null);
            expect(refreshSpy.callCount).toBe(2);
            jest.runOnlyPendingTimers();
            expect(refreshSpy.callCount).toBe(4);
            jest.runOnlyPendingTimers();
            expect(refreshSpy.callCount).toBe(6);
            jest.runOnlyPendingTimers();
            expect(refreshSpy.callCount).toBe(8);
        });

        describe('then it unmounts', () => {
            beforeEach(() => {
                instance.componentWillUnmount();
            });

            it('stops auto refreshing', () => {
                expect(instance.autoRefreshIntervalId).toBe(null);
                expect(refreshSpy.callCount).toBe(2);
                jest.runOnlyPendingTimers();
                expect(refreshSpy.callCount).toBe(3);
            });
        });
    });

    describe('initial state', () => {
        it('renders loading spinner', () => {
            expect(wrapper.find(CircularProgress)).toHaveLength(1);
        });

        it('does not render any dashboard sections', () => {
            expect(wrapper.find(DashboardSection)).toHaveLength(0);
        });

        it('does not render share dialog', () => {
            expect(wrapper.find(DataPackShareDialog)).toHaveLength(0);
        });
    });

    describe('when data has loaded', () => {
        beforeEach(() => {
            loadData();
        });

        it('does not render loading spinner', () => {
            expect(wrapper.find(CircularProgress)).toHaveLength(0);
        });

        it('renders Notifications section', () => {
            expect(wrapper.find('.qa-DashboardSection-Notifications')).toHaveLength(1);
        });

        it('renders Recently Viewed section', () => {
            expect(wrapper.find('.qa-DashboardSection-RecentlyViewed')).toHaveLength(1);
        });

        it('renders Featured section', () => {
            expect(wrapper.find('.qa-DashboardSection-Featured')).toHaveLength(1);
        });

        it('renders My DataPacks section', () => {
            expect(wrapper.find('.qa-DashboardSection-MyDataPacks')).toHaveLength(1);
        });

        it('renders notifications', () => {
            const notificationItems = wrapper.find('.qa-DashboardSection-Notifications').children().find(NotificationGridItem);
            const notificationsSorted = instance.props.notifications.notificationsSorted;
            expect(notificationItems).not.toHaveLength(0);
            expect(notificationItems).toHaveLength(notificationsSorted.length);
            notificationsSorted.forEach((notification, i) => {
                expect(notificationItems.at(i).props().notification).toBe(notificationsSorted[i]);
            });
        });

        it('renders recently viewed datapacks', () => {
            const recentlyViewedItems = wrapper.find('.qa-DashboardSection-RecentlyViewed').children().find(DataPackGridItem);
            const viewedJobs = instance.props.userActivity.viewedJobs.viewedJobs;
            expect(recentlyViewedItems).not.toHaveLength(0);
            expect(recentlyViewedItems).toHaveLength(viewedJobs.length);
            viewedJobs.forEach((viewedJob, i) => {
                expect(recentlyViewedItems.at(i).props().run).toBe(viewedJob.last_export_run);
            });
        });

        it('renders featured datapacks', () => {
            const featuredItems = wrapper.find('.qa-DashboardSection-Featured').children().find(DataPackFeaturedItem);
            const featuredRuns = instance.props.featuredRunsList.runs;
            expect(featuredItems).not.toHaveLength(0);
            expect(featuredItems).toHaveLength(featuredRuns.length);
            featuredRuns.forEach((featuredRun, i) => {
                expect(featuredItems.at(i).props().run).toBe(featuredRun);
            });
        });

        it('renders my datapacks', () => {
            const myDataPacksItems = wrapper.find('.qa-DashboardSection-MyDataPacks').children().find(DataPackGridItem);
            const runs = instance.props.runsList.runs;
            expect(myDataPacksItems).not.toHaveLength(0);
            expect(myDataPacksItems).toHaveLength(runs.length);
            runs.forEach((run, i) => {
                expect(myDataPacksItems.at(i).props().run).toBe(run);
            });
        });

        it('does not render Notifications "no data" element', () => {
            const notificationsSection = wrapper.find('.qa-DashboardSection-Notifications').dive();
            expect(notificationsSection.find('.qa-DashboardSection-Notifications-NoData')).toHaveLength(0);
        });

        it('does not render Recently Viewed "no data" element', () => {
            const recentlyViewedSection = wrapper.find('.qa-DashboardSection-RecentlyViewed').dive();
            expect(recentlyViewedSection.find('.qa-DashboardSection-RecentlyViewed-NoData')).toHaveLength(0);
        });

        it('does not render My DataPacks "no data" element', () => {
            const myDataPacksSection = wrapper.find('.qa-DashboardSection-MyDataPacks').dive();
            expect(myDataPacksSection.find('.qa-DashboardSection-MyDataPacks-NoData')).toHaveLength(0);
        });
    });

    describe('when empty data has loaded', () => {
        beforeEach(() => {
            loadEmptyData();
        });

        it('does not render loading spinner', () => {
            expect(wrapper.find(CircularProgress)).toHaveLength(0);
        });

        it('renders Notifications section', () => {
            expect(wrapper.find('.qa-DashboardSection-Notifications')).toHaveLength(1);
        });

        it('renders Recently Viewed section', () => {
            expect(wrapper.find('.qa-DashboardSection-RecentlyViewed')).toHaveLength(1);
        });

        it('does not render Featured section', () => {
            expect(wrapper.find('.qa-DashboardSection-Featured')).toHaveLength(0);
        });

        it('renders My DataPacks section', () => {
            expect(wrapper.find('.qa-DashboardSection-MyDataPacks')).toHaveLength(1);
        });

        it('renders Notifications "no data" element', () => {
            const notificationsSection = wrapper.find('.qa-DashboardSection-Notifications').dive();
            expect(notificationsSection.find('.qa-DashboardSection-Notifications-NoData')).toHaveLength(1);
        });

        it('renders Recently Viewed "no data" element', () => {
            const recentlyViewedSection = wrapper.find('.qa-DashboardSection-RecentlyViewed').dive();
            expect(recentlyViewedSection.find('.qa-DashboardSection-RecentlyViewed-NoData')).toHaveLength(1);
        });

        it('renders My DataPacks "no data" element', () => {
            const myDataPacksSection = wrapper.find('.qa-DashboardSection-MyDataPacks').dive();
            expect(myDataPacksSection.find('.qa-DashboardSection-MyDataPacks-NoData')).toHaveLength(1);
        });
    });

    describe('when automatically refreshing', () => {
        beforeEach(() => {
            loadData();
            instance.autoRefresh();
        });

        it('does not render loading spinner', () => {
            expect(wrapper.find(CircularProgress)).toHaveLength(0);
        });
    });

    describe('when Notifications section "View All" button is clicked', () => {
        let browserHistoryPushStub;

        beforeEach(() => {
            browserHistoryPushStub = sinon.stub(browserHistory, 'push');
            instance.handleNotificationsViewAll();
        });

        afterEach(() => {
            browserHistoryPushStub.restore();
        });

        it('navigates to "/notifications"', () => {
            expect(browserHistoryPushStub.callCount).toBe(1);
            expect(browserHistoryPushStub.calledWith('/notifications')).toBe(true);
        });
    });

    describe('when Featured section "View All" button is clicked', () => {
        let browserHistoryPushStub;

        beforeEach(() => {
            browserHistoryPushStub = sinon.stub(browserHistory, 'push');
            instance.handleFeaturedViewAll();
        });

        afterEach(() => {
            browserHistoryPushStub.restore();
        });

        it('navigates to "/exports"', () => {
            expect(browserHistoryPushStub.callCount).toBe(1);
            expect(browserHistoryPushStub.calledWith('/exports')).toBe(true);
        });
    });

    describe('when My DataPacks section "View All" button is clicked', () => {
        let browserHistoryPushStub;

        beforeEach(() => {
            browserHistoryPushStub = sinon.stub(browserHistory, 'push');
            instance.handleMyDataPacksViewAll();
        });

        afterEach(() => {
            browserHistoryPushStub.restore();
        });

        it('navigates to "/exports?collection=myDataPacks"', () => {
            expect(browserHistoryPushStub.callCount).toBe(1);
            expect(browserHistoryPushStub.calledWith('/exports?collection=admin')).toBe(true);
        });
    });

    describe('when a datapack is being deleted', () => {
        let setupA;

        beforeEach(() => {
            setupA = () => {
                loadData();
                instance.refresh = sinon.spy();
                wrapper.setProps({
                    runsDeletion: {
                        deleting: true,
                        deleted: false,
                    },
                });
            };
            setupA();
        });

        it('renders loading spinner', () => {
            expect(wrapper.find(CircularProgress)).toHaveLength(1);
        });

        describe('then it is successfully deleted', () => {
            beforeEach(() => {
                setupA();
                wrapper.setProps({
                    runsDeletion: {
                        deleting: false,
                        deleted: true,
                    },
                });
            });

            it('does not render loading spinner', () => {
                expect(wrapper.find(CircularProgress)).toHaveLength(0);
            });

            it('refreshes the page', () => {
                expect(instance.refresh.callCount).toBe(1);
            });
        });
    });

    describe('when permissions are updated', () => {
        beforeEach(() => {
            instance.refresh = sinon.spy();
            wrapper.setProps({
                updatePermission: {
                    updated: true,
                },
            });
        });

        it('refreshes page', () => {
            expect(instance.refresh.callCount).toBe(1);
        });

        it('renders loading spinner', () => {
            expect(wrapper.find(CircularProgress)).toHaveLength(1);
        });
    });
});
