/* eslint prefer-destructuring: 0 */
import React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import sinon from 'sinon';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import FlagIcon from '@material-ui/icons/Flag';
import CloseIcon from '@material-ui/icons/Close';
import { getNotificationViewPath } from '../../utils/notificationUtils';
import IconMenu from '../../components/common/IconMenu';
import { NotificationMenu } from '../../components/Notification/NotificationMenu';

describe('NotificationMenu component', () => {
    let wrapper;
    let instance;
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    function defaultProps() {
        return {
            notification: {
                id: '1',
                verb: 'run_completed',
                actor: {
                    details: {
                        job: {
                            name: 'Test',
                        },
                    },
                },
                timestamp: '2018-05-04T17:32:04.716806Z',
                unread: true,
            },
            router: {
                push: sinon.spy(),
            },
            onView: sinon.spy(),
            onMarkAsRead: sinon.spy(),
            onMarkAsUnread: sinon.spy(),
            onRemove: sinon.spy(),
            markNotificationsAsRead: sinon.spy(),
            markNotificationsAsUnread: sinon.spy(),
            removeNotifications: sinon.spy(),
            ...global.eventkit_test_props,
        };
    }

    function setup(propsOverride = {}) {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = shallow(<NotificationMenu {...props} />);
        instance = wrapper.instance();

        const handleMenuItemClick = instance.handleMenuItemClick;
        instance.handleMenuItemClick = sinon.stub().callsFake(() => {
            handleMenuItemClick({ stopPropagation: () => {} });
        });
    }

    beforeEach(setup);

    it('renders IconMenu', () => {
        expect(wrapper.find(IconMenu)).toHaveLength(1);
    });

    it('renders Remove menu item', () => {
        expect(wrapper.find('.qa-NotificationMenu-MenuItem-Remove')).toHaveLength(1);
    });

    it('renders CloseIcon in Remove menu item', () => {
        const removeMenuItem = wrapper.find('.qa-NotificationMenu-MenuItem-Remove');
        expect(removeMenuItem.find(CloseIcon)).toHaveLength(1);
    });


    describe('when notification is unread', () => {
        let markAsReadMenuItem;

        beforeEach(() => {
            const props = defaultProps();
            props.notification.unread = true;
            setup(props);
            markAsReadMenuItem = wrapper.find('.qa-NotificationMenu-MenuItem-MarkAsRead');
        });

        it('renders Mark As Read menu item', () => {
            expect(markAsReadMenuItem).toHaveLength(1);
        });

        it('renders FlagIcon in Mark As Read menu item', () => {
            expect(markAsReadMenuItem.find(FlagIcon)).toHaveLength(1);
        });

        it('does not render Mark As Unread menu item', () => {
            expect(wrapper.find('.qa-NotificationMenu-MenuItem-MarkAsUnread')).toHaveLength(0);
        });
    });

    describe('when notification is not unread', () => {
        let markAsUnreadMenuItem;

        beforeEach(() => {
            const props = defaultProps();
            props.notification.unread = false;
            setup(props);
            markAsUnreadMenuItem = wrapper.find('.qa-NotificationMenu-MenuItem-MarkAsUnread');
        });

        it('renders Mark As Unread menu item', () => {
            expect(markAsUnreadMenuItem).toHaveLength(1);
        });

        it('renders FlagIcon in Mark As Unread menu item', () => {
            expect(markAsUnreadMenuItem.find(FlagIcon)).toHaveLength(1);
        });

        it('does not render Mark As Read menu item', () => {
            expect(wrapper.find('.qa-NotificationMenu-MenuItem-MarkAsRead')).toHaveLength(0);
        });
    });

    describe('when Mark As Read menu item is clicked', () => {
        let setupA;

        beforeEach(() => {
            setupA = (props) => {
                setup({
                    notification: {
                        ...instance.props.notification,
                        unread: true,
                    },
                    ...props,
                });
                instance.componentDidUpdate = sinon.stub();
                wrapper.find('.qa-NotificationMenu-MenuItem-MarkAsRead').props().onClick();
            };
            setupA();
        });

        it('calls onMarkAsRead() with notification', () => {
            expect(instance.props.onMarkAsRead.callCount).toBe(1);
            expect(instance.props.onMarkAsRead.calledWith(instance.props.notification)).toBe(true);
        });

        describe('when onMarkAsRead() returns true', () => {
            beforeEach(() => {
                setupA({
                    onMarkAsRead: () => true,
                });
            });

            it('marks notification as read', () => {
                expect(instance.props.markNotificationsAsRead.callCount).toBe(1);
                expect(instance.props.markNotificationsAsRead.calledWith([instance.props.notification])).toBe(true);
            });
        });

        describe('when onMarkAsRead() returns false', () => {
            beforeEach(() => {
                setupA({
                    onMarkAsRead: () => false,
                });
            });

            it('does not mark notifications as read', () => {
                expect(instance.props.markNotificationsAsRead.callCount).toBe(0);
            });
        });
    });

    describe('when Mark As Unread menu item is clicked', () => {
        let setupA;

        beforeEach(() => {
            setupA = (props) => {
                setup({
                    notification: {
                        ...instance.props.notification,
                        unread: false,
                    },
                    ...props,
                });
                instance.componentDidUpdate = sinon.stub();
                wrapper.find('.qa-NotificationMenu-MenuItem-MarkAsUnread').props().onClick();
            };
            setupA();
        });

        it('calls onMarkAsUnread() with notification', () => {
            expect(instance.props.onMarkAsUnread.callCount).toBe(1);
            expect(instance.props.onMarkAsUnread.calledWith(instance.props.notification)).toBe(true);
        });

        describe('when onMarkAsUnread() returns true', () => {
            beforeEach(() => {
                setupA({
                    onMarkAsUnread: () => true,
                });
            });

            it('marks notification as unread', () => {
                expect(instance.props.markNotificationsAsUnread.callCount).toBe(1);
                expect(instance.props.markNotificationsAsUnread.calledWith([instance.props.notification])).toBe(true);
            });
        });

        describe('when onMarkAsUnread() returns false', () => {
            beforeEach(() => {
                setupA({
                    onMarkAsUnread: () => false,
                });
            });

            it('does not mark notifications as unread', () => {
                expect(instance.props.markNotificationsAsUnread.callCount).toBe(0);
            });
        });
    });

    describe('when View menu item is clicked', () => {
        let setupA;

        beforeEach(() => {
            setupA = (props) => {
                setup(props);
                instance.componentDidUpdate = sinon.stub();
                wrapper.find('.qa-NotificationMenu-MenuItem-View').props().onClick();
            };
            setupA();
        });

        it('calls onView() with notification and view path', () => {
            const viewPath = getNotificationViewPath(instance.props.notification);
            expect(instance.props.onView.callCount).toBe(1);
            expect(instance.props.onView.calledWith(instance.props.notification, viewPath)).toBe(true);
        });

        describe('when onView() returns true', () => {
            beforeEach(() => {
                setupA({
                    onView: () => true,
                });
            });

            it('navigates to view path', () => {
                const viewPath = getNotificationViewPath(instance.props.notification);
                expect(instance.props.router.push.callCount).toBe(1);
                expect(instance.props.router.push.calledWith(viewPath)).toBe(true);
            });

            it('marks notification as read', () => {
                expect(instance.props.markNotificationsAsRead.callCount).toBe(1);
                expect(instance.props.markNotificationsAsRead.calledWith([instance.props.notification])).toBe(true);
            });
        });

        describe('when onView() return false', () => {
            beforeEach(() => {
                setupA({
                    onView: () => false,
                });
            });

            it('does not navigate to view path', () => {
                expect(instance.props.router.push.callCount).toBe(0);
            });

            it('does not mark notification as read', () => {
                expect(instance.props.markNotificationsAsRead.callCount).toBe(0);
            });
        });
    });

    describe('when Remove menu item is clicked', () => {
        let setupA;

        beforeEach(() => {
            setupA = (props) => {
                setup(props);
                instance.componentDidUpdate = sinon.stub();
                wrapper.find('.qa-NotificationMenu-MenuItem-Remove').props().onClick();
            };
            setupA();
        });

        it('calls onRemove() with notification', () => {
            expect(instance.props.onRemove.callCount).toBe(1);
            expect(instance.props.onRemove.calledWith(instance.props.notification)).toBe(true);
        });

        describe('when onRemove() returns true', () => {
            beforeEach(() => {
                setupA({
                    onRemove: () => true,
                });
            });

            it('removes notification', () => {
                expect(instance.props.removeNotifications.callCount).toBe(1);
                expect(instance.props.removeNotifications.calledWith([instance.props.notification])).toBe(true);
            });
        });

        describe('when onRemove() returns false', () => {
            beforeEach(() => {
                setupA({
                    onRemove: () => false,
                });
            });

            it('does not remove notification', () => {
                expect(instance.props.removeNotifications.callCount).toBe(0);
            });
        });
    });

    describe('when view path exists', () => {
        let viewMenuItem;

        beforeEach(() => {
            viewMenuItem = wrapper.find('.qa-NotificationMenu-MenuItem-View');
        });

        it('renders View menu item', () => {
            expect(viewMenuItem).toHaveLength(1);
        });

        it('renders OpenInNewIcon in View menu item', () => {
            expect(viewMenuItem.find(OpenInNewIcon)).toHaveLength(1);
        });
    });

    describe('when view path does not exist', () => {
        beforeEach(() => {
            const props = defaultProps();
            props.notification.verb = 'some_unhandled_verb';
            setup(props);
        });

        it('does not render View menu item', () => {
            expect(wrapper.find('.qa-NotificationMenu-MenuItem-View')).toHaveLength(0);
        });
    });
});
