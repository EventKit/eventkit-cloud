import React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import sinon from 'sinon';
import CircularProgress from '@material-ui/core/CircularProgress';
import { NotificationsDropdown } from '../../components/Notification/NotificationsDropdown';

const mockNotifications = {
    1: {
        actor: {
            details: {
                job: {
                    name: 'Test',
                },
            },
        },
        id: '1',
        timestamp: '2018-05-04T17:32:04.716806Z',
        unread: true,
        verb: 'run_started',
    },
    2: {
        actor: {
            details: {
                job: {
                    name: 'Test',
                },
            },
        },
        id: '2',
        timestamp: '2018-05-04T17:34:04.716806Z',
        unread: true,
        verb: 'run_completed',
    },
};

describe('NotificationsDropdown component', () => {
    let wrapper;
    let instance;
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    function defaultProps() {
        return {
            history: {
                push: sinon.spy(),
            },
            loading: true,
            markAllNotificationsAsRead: sinon.spy(),
            notifications: {
                notifications: {},
                notificationsSorted: [],
            },
            onClickAway: sinon.spy(),
            onNavigate: sinon.spy(),
            ...global.eventkit_test_props,
        };
    }

    function setup(propsOverride = {}) {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = shallow(<NotificationsDropdown {...props} />);
        instance = wrapper.instance();
    }

    function loadNotifications() {
        wrapper.setProps({
            ...instance.props,
            loading: false,
            notifications: {
                ...instance.props,
                notifications: mockNotifications,
                notificationsSorted: [
                    mockNotifications['1'],
                    mockNotifications['2'],
                ],
            },
        });
    }

    function loadNotificationsEmpty() {
        wrapper.setProps({
            ...instance.props,
            loading: false,
            notifications: {
                ...instance.props.notifications,
                notifications: {},
                notificationsSorted: [],
            },
        });
    }

    beforeEach(setup);

    describe('initial state', () => {
        it('renders loading spinner', () => {
            expect(wrapper.find(CircularProgress)).toHaveLength(1);
        });
    });

    describe('after data has loaded', () => {
        beforeEach(() => {
            loadNotifications();
        });

        it('does not render loading spinner', () => {
            expect(wrapper.find(CircularProgress)).toHaveLength(0);
        });

        it('renders pointer', () => {
            expect(wrapper.find('.qa-NotificationsDropdown-Pointer')).toHaveLength(1);
        });

        it('does not render "no data" element', () => {
            expect(wrapper.find('.qa-NotificationsDropdown-NoData')).toHaveLength(0);
        });

        it('renders notifications', () => {
            const grid = wrapper.find('.qa-NotificationsDropdown-Grid');
            expect(grid.children()).not.toHaveLength(0);
            expect(grid.children()).toHaveLength(instance.props.notifications.notificationsSorted.length);
            instance.props.notifications.notificationsSorted.forEach((notification, i) => {
                const gridItem = grid.children().at(i);
                expect(gridItem.props().notification).toBe(notification);
            });
        });
    });

    describe('after empty data has loaded', () => {
        beforeEach(() => {
            loadNotificationsEmpty();
        });

        it('renders "no data" element', () => {
            expect(wrapper.find('.qa-NotificationsDropdown-NoData')).toHaveLength(1);
        });
    });

    describe('when "Mark All As Read" is clicked', () => {
        beforeEach(() => {
            wrapper.find('.qa-NotificationsDropdown-Header-MarkAllAsRead').props().onClick();
        });

        it('marks all notifications as read', () => {
            expect(instance.props.markAllNotificationsAsRead.callCount).toBe(1);
        });
    });

    describe('when "View All" is clicked', () => {
        let setupA;

        beforeEach(() => {
            setupA = (props) => {
                setup(props);
                wrapper.find('.qa-NotificationsDropdown-ViewAll').props().onClick();
            };
            setupA();
        });

        it('calls onNavigate() with "/notifications"', () => {
            expect(instance.props.onNavigate.callCount).toBe(1);
            expect(instance.props.onNavigate.calledWith('/notifications')).toBe(true);
        });

        describe('when onNavigate() returns true', () => {
            beforeEach(() => {
                setupA({
                    onNavigate: () => true,
                });
            });

            it('navigates to "/notifications"', () => {
                expect(instance.props.history.push.callCount).toBe(1);
                expect(instance.props.history.push.calledWith('/notifications')).toBe(true);
            });
        });

        describe('when onNavigate() returns false', () => {
            beforeEach(() => {
                setupA({
                    onNavigate: () => false,
                });
            });

            it('does not navigate to "/notifications"', () => {
                expect(instance.props.history.push.callCount).toBe(0);
            });
        });
    });
});
