import React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import sinon from 'sinon';
import values from 'lodash/values';
import { NotificationsTableMenu } from '../../components/Notification/NotificationsTableMenu';

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

describe('NotificationsTableMenu component', () => {
    let wrapper;
    let instance;
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    function defaultProps() {
        return {
            selectedNotifications: mockNotifications,
            router: {
                push: sinon.spy(),
            },
            onView: sinon.spy(),
            onMarkAsRead: sinon.spy(),
            onMarkAsUnread: sinon.spy(),
            onRemove: sinon.spy(),
            onMarkAllAsRead: sinon.spy(),
            markNotificationsAsRead: sinon.spy(),
            markNotificationsAsUnread: sinon.spy(),
            removeNotifications: sinon.spy(),
            markAllNotificationsAsRead: sinon.spy(),
            ...global.eventkit_test_props,
        };
    }

    function setup(propsOverride = {}) {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = shallow(<NotificationsTableMenu {...props} />);
        instance = wrapper.instance();
    }

    beforeEach(setup);

    describe('when no notifications are selected', () => {
        beforeEach(() => {
            wrapper.setProps({
                selectedNotifications: {},
            });
        });

        it('renders "Mark All As Read" menu item', () => {
            expect(wrapper.find('.qa-NotificationsTableMenu-MarkAllAsRead')).toHaveLength(1);
        });
    });

    describe('when notifications are selected', () => {
        beforeEach(() => {
            wrapper.setProps({
                selectedNotifications: {
                    1: mockNotifications['1'],
                    2: mockNotifications['2'],
                },
            });
        });

        describe('and all of them are unread', () => {
            beforeEach(() => {
                wrapper.setProps({
                    selectedNotifications: {
                        1: {
                            ...mockNotifications['1'],
                            unread: true,
                        },
                        2: {
                            ...mockNotifications['2'],
                            unread: true,
                        },
                    },
                });
            });

            it('renders "Mark As Read" menu item', () => {
                expect(wrapper.find('.qa-NotificationsTableMenu-MarkAsRead')).toHaveLength(1);
            });

            it('does not render "Mark As Unread" menu item', () => {
                expect(wrapper.find('.qa-NotificationsTableMenu-MarkAsUnread')).toHaveLength(0);
            });
        });

        describe('and all of them are not unread', () => {
            beforeEach(() => {
                wrapper.setProps({
                    selectedNotifications: {
                        1: {
                            ...mockNotifications['1'],
                            unread: false,
                        },
                        2: {
                            ...mockNotifications['2'],
                            unread: false,
                        },
                    },
                });
            });

            it('does not render "Mark As Read" menu item', () => {
                expect(wrapper.find('.qa-NotificationsTableMenu-MarkAsRead')).toHaveLength(0);
            });

            it('renders "Mark As Unread" menu item', () => {
                expect(wrapper.find('.qa-NotificationsTableMenu-MarkAsUnread')).toHaveLength(1);
            });
        });
    });

    describe('when "Mark As Read" menu item is clicked', () => {
        let setupA;

        beforeEach(() => {
            setupA = (props) => {
                setup({
                    selectedNotifications: {
                        1: {
                            ...mockNotifications['1'],
                            unread: true,
                        },
                    },
                    ...props,
                });
                wrapper.find('.qa-NotificationsTableMenu-MarkAsRead').props().onClick();
            };
            setupA();
        });

        it('calls onMarkAsRead() with selected notifications', () => {
            expect(instance.props.onMarkAsRead.callCount).toBe(1);
            expect(instance.props.onMarkAsRead.calledWith(values(instance.props.selectedNotifications))).toBe(true);
        });

        describe('and onMarkAsRead() returns true', () => {
            beforeEach(() => {
                setupA({
                    onMarkAsRead: () => true,
                });
            });

            it('marks selected notification as read', () => {
                expect(instance.props.markNotificationsAsRead.callCount).toBe(1);
                expect(instance.props.markNotificationsAsRead.calledWith(values(instance.props.selectedNotifications))).toBe(true);
            });
        });

        describe('and onMarkAsRead() returns false', () => {
            beforeEach(() => {
                setupA({
                    onMarkAsRead: () => false,
                });
            });

            it('does not mark selected notifications as read', () => {
                expect(instance.props.markNotificationsAsRead.callCount).toBe(0);
            });
        });
    });

    describe('when "Mark As Unread" menu item is clicked', () => {
        let setupA;

        beforeEach(() => {
            setupA = (props) => {
                setup({
                    selectedNotifications: {
                        1: {
                            ...mockNotifications['1'],
                            unread: false,
                        },
                    },
                    ...props,
                });
                wrapper.find('.qa-NotificationsTableMenu-MarkAsUnread').props().onClick();
            };
            setupA();
        });

        it('calls onMarkAsUnread() with selected notifications', () => {
            expect(instance.props.onMarkAsUnread.callCount).toBe(1);
            expect(instance.props.onMarkAsUnread.calledWith(values(instance.props.selectedNotifications))).toBe(true);
        });

        describe('and onMarkAsUnread() returns true', () => {
            beforeEach(() => {
                setupA({
                    onMarkAsUnread: () => true,
                });
            });

            it('marks selected notification as unread', () => {
                expect(instance.props.markNotificationsAsUnread.callCount).toBe(1);
                expect(instance.props.markNotificationsAsUnread.calledWith(values(instance.props.selectedNotifications))).toBe(true);
            });
        });

        describe('and onMarkAsUnread() returns false', () => {
            beforeEach(() => {
                setupA({
                    onMarkAsUnread: () => false,
                });
                wrapper.find('.qa-NotificationsTableMenu-MarkAsUnread').props().onClick();
            });

            it('does not mark selected notifications as unread', () => {
                expect(instance.props.markNotificationsAsUnread.callCount).toBe(0);
            });
        });
    });

    describe('when "Remove" menu item is clicked', () => {
        let setupA;

        beforeEach(() => {
            setupA = (props) => {
                setup(props);
                wrapper.find('.qa-NotificationsTableMenu-Remove').props().onClick();
            };
            setupA();
        });

        it('calls onRemove() with selected notifications', () => {
            expect(instance.props.onRemove.callCount).toBe(1);
            expect(instance.props.onRemove.calledWith(values(instance.props.selectedNotifications))).toBe(true);
        });

        describe('and onRemove() returns true', () => {
            beforeEach(() => {
                setupA({
                    onRemove: () => true,
                });
            });

            it('removes selected notifications', () => {
                expect(instance.props.removeNotifications.callCount).toBe(1);
                expect(instance.props.removeNotifications.calledWith(values(instance.props.selectedNotifications))).toBe(true);
            });
        });

        describe('and onRemove() returns false', () => {
            beforeEach(() => {
                setupA({
                    onRemove: () => false,
                });
            });

            it('does not remove selected notification', () => {
                expect(instance.props.removeNotifications.callCount).toBe(0);
            });
        });
    });

    describe('when "Mark All As Read" menu item is clicked', () => {
        let setupA;

        beforeEach(() => {
            setupA = (props) => {
                setup(props);
                wrapper.find('.qa-NotificationsTableMenu-MarkAllAsRead').props().onClick();
            };
            setupA();
        });

        it('calls onMarkAllAsRead()', () => {
            expect(instance.props.onMarkAllAsRead.callCount).toBe(1);
        });

        describe('and onMarkAllAsRead() returns true', () => {
            beforeEach(() => {
                setupA({
                    onMarkAllAsRead: () => true,
                });
            });

            it('marks all notifications as read', () => {
                expect(instance.props.markAllNotificationsAsRead.callCount).toBe(1);
            });
        });

        describe('and onMarkAllAsRead() returns false', () => {
            beforeEach(() => {
                setupA({
                    onMarkAllAsRead: () => false,
                });
            });

            it('does not mark all notifications as read', () => {
                expect(instance.props.markAllNotificationsAsRead.callCount).toBe(0);
            });
        });
    });
});
