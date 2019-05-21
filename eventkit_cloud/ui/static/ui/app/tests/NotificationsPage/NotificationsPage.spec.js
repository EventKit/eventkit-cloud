import React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import sinon from 'sinon';
import PageLoading from '../../components/common/PageLoading';
import { NotificationsPage } from '../../components/NotificationsPage/NotificationsPage';
import NotificationsTable from '../../components/Notification/NotificationsTable';
import LoadButtons from '../../components/common/LoadButtons';
import NotificationGridItem from '../../components/Notification/NotificationGridItem';

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

describe('NotificationsPage component', () => {
    let wrapper;
    let instance;
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    function defaultProps() {
        return {
            notificationsData: {
                notifications: {},
                notificationsSorted: [],
                range: '',
                nextPage: false,
            },
            notificationsStatus: {
                fetched: false,
            },
            router: {
                push: sinon.spy(),
            },
            getNotifications: sinon.spy(),
            ...global.eventkit_test_props,
        };
    }

    const config = { NOTIFICATIONS_PAGE_SIZE: '12' };

    function setup(propsOverride = {}) {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = shallow(<NotificationsPage {...props} />, {
            context: { config },
        });
        instance = wrapper.instance();
    }

    beforeEach(() => {
        window.resizeTo(1920, 1080);
        setup();
    });

    function loadNotifications() {
        wrapper.setProps({
            notificationsData: {
                notifications: mockNotifications,
                notificationsSorted: [
                    mockNotifications['1'],
                    mockNotifications['2'],
                ],
                range: '2/4',
                nextPage: true,
            },
            notificationsStatus: {
                fetched: true,
            },
        });
    }

    it('gets correct range', () => {
        wrapper.setProps({
            notificationsData: {
                ...instance.props.notificationsData,
                range: '20/40',
            },
        });
        const range = instance.getRange([1, 2, 3, 4, 5, 6, 7, 8]);
        expect(range).toBe('8/40');
    });

    describe('initial state', () => {
        it('renders loading spinner', () => {
            expect(wrapper.find(PageLoading)).toHaveLength(1);
        });

        it('does not render content', () => {
            expect(wrapper.find('.qa-NotificationsPage-Content')).toHaveLength(0);
        });
    });

    describe('when data has loaded', () => {
        beforeEach(() => {
            loadNotifications();
        });

        it('does not render loading spinner', () => {
            expect(wrapper.find(PageLoading)).toHaveLength(0);
        });

        it('renders content', () => {
            expect(wrapper.find('.qa-NotificationsPage-Content')).toHaveLength(1);
        });

        it('renders notifications table', () => {
            expect(wrapper.find(NotificationsTable)).toHaveLength(1);
        });

        it('sets "range" prop on LoadButtons', () => {
            const notifications = instance.props.notificationsData.notificationsSorted;
            expect(wrapper.find(LoadButtons).props().range).toBe(instance.getRange(notifications));
        });

        describe('and next page is available', () => {
            beforeEach(() => {
                wrapper.setProps({
                    notificationsData: {
                        ...instance.props.notificationsData,
                        nextPage: true,
                    },
                });
            });

            it('enables "Load More" button', () => {
                expect(wrapper.find(LoadButtons).props().loadMoreDisabled).toBe(false);
            });
        });

        describe('and next page is not available', () => {
            beforeEach(() => {
                wrapper.setProps({
                    notificationsData: {
                        ...instance.props.notificationsData,
                        nextPage: false,
                    },
                });
            });

            it('disables "Load More" button', () => {
                expect(wrapper.find(LoadButtons).props().loadMoreDisabled).toBe(true);
            });
        });

        describe('and user has notifications', () => {
            it('renders notifications', () => {
                expect(wrapper.find('.qa-NotificationsPage-Content-Notifications')).toHaveLength(1);
            });

            it('does not render "no data" message', () => {
                expect(wrapper.find('.qa-NotificationsPage-Content-NoData')).toHaveLength(0);
            });
        });

        describe('and user has no notifications', () => {
            beforeEach(() => {
                wrapper.setProps({
                    notificationsData: {
                        notifications: {},
                        notificationsSorted: [],
                    },
                });
            });

            it('does not render notifications', () => {
                expect(wrapper.find('.qa-NotificationsPage-Content-Notifications')).toHaveLength(0);
            });

            it('renders "no data" message', () => {
                expect(wrapper.find('.qa-NotificationsPage-Content-NoData')).toHaveLength(1);
            });
        });

        describe('and window width is <= 768', () => {
            beforeEach(() => {
                setup();
                wrapper.setProps({ width: 'sm' });
                loadNotifications();
            });

            it('renders notification grid', () => {
                expect(wrapper.find('.qa-NotificationsPage-Content-Notifications-Grid')).toHaveLength(1);
            });

            it('renders notification grid items', () => {
                const gridItems = wrapper.find(NotificationGridItem);
                instance.props.notificationsData.notificationsSorted.forEach((notification, i) => {
                    expect(gridItems.at(i).props().notification).toBe(notification);
                });
            });
        });
    });

    describe('when it mounts', () => {
        beforeEach(() => {
            instance.refresh = sinon.spy();
            instance.componentDidMount();
        });

        it('calls refresh()', () => {
            expect(instance.refresh.callCount).toBe(1);
        });
    });

    describe('when it refreshes', () => {
        beforeEach(() => {
            instance.props.getNotifications.reset();
            instance.refresh();
        });

        it('requests notifications', () => {
            expect(instance.props.getNotifications.callCount).toBe(1);
        });

        it('updates "loading" state', () => {
            expect(wrapper.state().loading).toBe(true);
        });
    });

    describe('when "Load More" is clicked', () => {
        beforeEach(() => {
            loadNotifications();
            instance.refresh = sinon.spy();
            wrapper.find(LoadButtons).props().handleLoadMore();
        });

        it('increases page size', () => {
            expect(wrapper.state().pageSize).toBe(instance.itemsPerPage * 2);
        });

        it('refreshes', () => {
            expect(instance.refresh.callCount).toBe(1);
        });
    });
});
