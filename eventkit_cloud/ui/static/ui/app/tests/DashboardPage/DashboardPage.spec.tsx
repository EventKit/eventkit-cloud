import * as React from "react";
import * as sinon from 'sinon';
import { screen, fireEvent, within, waitFor } from '@testing-library/react';
import "@testing-library/jest-dom/extend-expect";
import * as TestUtils from '../test-utils';

jest.doMock("../../components/DataPackPage/DataPackGridItem", () => {
    return (props) => (<div className="gridItem" data-testid={props['data-testid']}>{props.children}</div>);
});

jest.doMock("../../components/DashboardPage/DataPackFeaturedItem", () => {
    return (props) => (<div className="gridItem" data-testid={props['data-testid']}>{props.children}</div>);
});

import { DashboardPage } from '../../components/DashboardPage/DashboardPage';
import history from '../../utils/history';


const mockNotifications = {
    1: {
        id: 1,
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
        id: 2,
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

const user = {
    data: {
        user: {
            username: 'admin'
        }
    },
    meta: {
        autoLogoutAt: null,
        autoLogoutWarningAt: null,
    },
    status: {
        patched: false,
        patching: false,
        error: null,
        isLoading: false,
    },
};

const mockExports = {
    data: {
        runs: {
            '6870234f-d876-467c-a332-65fdf0399a0d': {
                uid: '6870234f-d876-467c-a332-65fdf0399a0d',
                created_at: '2017-03-10T15:52:35.637331Z',
                job: '7643f806-1484-4446-b498-7ddaa65d011a',
                expiration: '2017-03-24T15:52:35.637258Z',
                extent: {type: 'FeatureCollection', features: []}
            }
        },
        jobs: {
            '7643f806-1484-4446-b498-7ddaa65d011a': {
                uid: '7643f806-1484-4446-b498-7ddaa65d011a',
                name: 'Test1',
                event: 'Test1 event',
                description: 'Test1 description',
                extent: {type: 'FeatureCollection', features: []}
            }
        }
    },
    viewedInfo: {
        ids: mockRuns.map(run => run.uid)
    },
    featuredInfo: {
        ids: mockRuns.map(run => run.uid)
    },
    ownInfo: {
        ids: mockRuns.map(run => run.uid)
    }
};


describe('DashboardPage component', () => {
    const getInitialState = (defaultState) => (
        {
            ...defaultState,
            aoiInfo: {
                geojson: {},
            },
            exportInfo: {
                exportName: '',
                datapackDescription: '',
                projectName: '',
                providers: [],
                providerInfo: {
                    'osm': {
                        availability: {
                            status: 'STAT'
                        },
                    }
                },
                exportOptions: {
                    '123': {
                        minZoom: 0,
                        maxZoom: 2,
                    }
                },
                projections: [],
            },
            user,
            topics: [],
            exports: mockExports,
            notifications: {
                data: {
                    notifications: mockNotifications,
                    notificationsSorted: [],
                },
                status: {
                    fetching: null,
                    fetched: null,
                    deleting: null,
                    deleted: null,
                    error: null,
                    cancelSource: null,
                },
                unreadCount: {
                    status: {
                        fetching: null,
                        fetched: null,
                        error: null,
                        cancelSource: null,
                    },
                    data: {
                        unreadCount: 0,
                    },
                },
            }
        }
    );

    function defaultProps() {
        return {
            userData: {
                user: {
                    username: 'admin',
                },
            },
            runDeletion: {
                deleted: false,
            },
            ownIds: [],
            featuredIds: [],
            viewedIds: [],
            runsFetched: null,
            featuredRunsFetched: null,
            viewedRunsFetched: null,
            notificationsStatus: {
                fetching: false,
                fetched: false,
            },
            notificationsData: {
                notifications: {},
                notificationsSorted: [],
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
            deleteRun: sinon.spy(),
            getUsers: sinon.spy(),
            updateDataCartPermissions: sinon.spy(),
            getGroups: sinon.spy(),
            getProviders: sinon.spy(),
            getNotifications: sinon.spy(),
            ...(global as any).eventkit_test_props,
            history,
        };
    }

    function loadEmptyData() {
        return {
            ownIds: [],
            runsFetched: true,
            featuredIds: [],
            featuredRunsFetched: true,
            viewedIds: [],
            viewedRunsFetched: true,
            notificationsStatus: {
                fetching: false,
                fetched: true,
            },
            notificationsData: {
                notifications: [],
                notificationsSorted: [],
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
        };
    }

    function loadedProps() {
        return {
            ownIds: mockRuns.map(run => run.uid),
            runsFetched: true,
            featuredIds: mockRuns.map(run => run.uid),
            featuredRunsFetched: true,
            viewedIds: mockRuns.map(run => run.uid),
            viewedRunsFetched: true,
            notificationsStatus: {
                fetching: false,
                fetched: true,
            },
            notificationsData: {
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
            runDeletion: {
                deleting: false
            },
            updatePermission: {
                updating: false
            }
        };
    }

    describe('when it mounts', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });
        afterEach(() => {
            jest.useRealTimers();
        });
        it('requests providers', () => {
            const props = {
                ...defaultProps(),
            };
            TestUtils.renderComponent(<DashboardPage {...props} />);
            expect(props.getProviders.callCount).toBe(1);
        });

        it('requests notifications', () => {
            const props = {
                ...defaultProps(),
            };
            TestUtils.renderComponent(<DashboardPage {...props} />);
            expect(props.getNotifications.callCount).toBe(2);
        });
    });

    describe('when data has loaded', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            const props = {
                ...defaultProps(),
                ...loadedProps(),
            };
            const defaultState = TestUtils.getDefaultTestState();
            const initialState = getInitialState(defaultState);
            TestUtils.renderComponent(<DashboardPage {...props} />, {
                includeToastContainer: false,
                initialState,
            });
            jest.runOnlyPendingTimers();
        });
        afterEach(() => {
            jest.useRealTimers();
        });
        it('renders Notifications section', () => {
            expect(screen.getByText("Notifications"));
        });

        it('renders Recently Viewed section',  () => {
            expect(screen.getByText("Recently Viewed"));
        });

        it('renders Featured section', () => {
            expect(screen.getByText("Featured"));
        });

        it('renders My DataPacks section', () => {
            expect(screen.getByText("My DataPacks"));
        });

        it('renders notifications', () => {
            const notifications = screen.getAllByTestId("notification");
            expect(notifications).not.toHaveLength(0);
            expect(notifications).toHaveLength(Object.keys(mockNotifications).length);
        });

        it('renders recently viewed datapacks', () => {
            const viewedItems = screen.getAllByTestId("viewed");
            expect(viewedItems).not.toHaveLength(0);
            expect(viewedItems).toHaveLength(mockRuns.length);
        });

        it('renders featured datapacks', () => {
            const featuredItems = screen.getAllByTestId("featured");
            expect(featuredItems).not.toHaveLength(0);
            expect(featuredItems).toHaveLength(mockRuns.length);
        });

        it('renders my datapacks', () => {
            const myDataPacksItems = screen.getAllByTestId("pack");
            expect(myDataPacksItems).not.toHaveLength(0);
            expect(myDataPacksItems).toHaveLength(mockRuns.length);
        });
    });

    describe('when empty data has loaded', () => {
        beforeEach(() => {
            const props = {
                ...defaultProps(),
                ...loadEmptyData(),
            };
            TestUtils.renderComponent(<DashboardPage {...props} />);
        });

        it('renders Notifications section', () => {
            expect(screen.getByText("Notifications"));
        });

        it('renders Recently Viewed section', () => {
            expect(screen.getByText("Recently Viewed"));
        });

        it('does not render Featured section', () => {
            expect(screen.queryByText("Featured")).toBeNull();
        });

        it('renders My DataPacks section', () => {
            expect(screen.getByText("My DataPacks"));
        });
    });

    describe('when Notifications section "View All" button is clicked', () => {
        let browserHistoryPushStub;

        beforeEach(() => {
            browserHistoryPushStub = sinon.stub(history, 'push');
            const props = {
                ...defaultProps(),
                ...loadedProps(),
            };
            TestUtils.renderComponent(<DashboardPage {...props} />);
        });

        afterEach(() => {
            browserHistoryPushStub.restore();
        });

        it('navigates to "/notifications"', () => {
            const nEle = screen.getByText("Notifications");
            const vAll = within(nEle.parentElement).getByText("View All");
            fireEvent.click(vAll);
            expect(browserHistoryPushStub.callCount).toBe(1);
            expect(browserHistoryPushStub.calledWith('/notifications')).toBe(true);
        });
    });

    describe('when Featured section "View All" button is clicked', () => {
        let browserHistoryPushStub;

        beforeEach(() => {
            jest.useFakeTimers();
            browserHistoryPushStub = sinon.stub(history, 'push');
            const props = {
                ...defaultProps(),
                ...loadedProps(),
            };
            TestUtils.renderComponent(<DashboardPage {...props} />);
        });

        afterEach(() => {
            browserHistoryPushStub.restore();
        });

        it('navigates to "/exports"', () => {
            const nEle = screen.getByText("Featured");
            const vAll = within(nEle.parentElement).getByText("View All");
            fireEvent.click(vAll);
            expect(browserHistoryPushStub.callCount).toBe(1);
            expect(browserHistoryPushStub.calledWith('/exports')).toBe(true);
        });
    });

    describe('when My DataPacks section "View All" button is clicked', () => {
        let browserHistoryPushStub;

        beforeEach(() => {
            jest.useFakeTimers();
            browserHistoryPushStub = sinon.stub(history, 'push');
            const props = {
                ...defaultProps(),
                ...loadedProps(),
            };
            TestUtils.renderComponent(<DashboardPage {...props} />);
        });

        afterEach(() => {
            browserHistoryPushStub.restore();
        });

        it('navigates to "/exports?collection=myDataPacks"', () => {
            const nEle = screen.getByText("My DataPacks");
            const vAll = within(nEle.parentElement).getByText("View All");
            fireEvent.click(vAll);
            expect(browserHistoryPushStub.callCount).toBe(1);
            expect(browserHistoryPushStub.calledWith('/exports?collection=admin')).toBe(true);
        });
    });
});
