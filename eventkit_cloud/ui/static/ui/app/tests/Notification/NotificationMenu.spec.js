import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { IconMenu } from 'material-ui';
import OpenInNewIcon from 'material-ui/svg-icons/action/open-in-new';
import FlagIcon from 'material-ui/svg-icons/content/flag';
import CloseIcon from 'material-ui/svg-icons/navigation/close';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import { getNotificationViewPath } from '../../utils/notificationUtils';
import { NotificationMenu } from '../../components/Notification/NotificationMenu';

describe('NotificationMenu component', () => {
    let wrapper, instance;

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
        };
    }

    function setup(propsOverride = {}) {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = shallow(<NotificationMenu { ...props } />);
        instance = wrapper.instance();

        const handleMenuItemClick = instance.handleMenuItemClick;
        instance.handleMenuItemClick = sinon.stub().callsFake(() => {
            handleMenuItemClick({ stopPropagation: () => {} });
        });
    }

    function wrapShallow(element) {
        return shallow(<div>{element}</div>).childAt(0);
    }

    beforeEach(setup);

    it('renders IconMenu', () => {
        expect(wrapper.find(IconMenu)).toHaveLength(1);
    });

    it('renders IconButton with MoreVertIcon', () => {
        const iconMenu = wrapper.find(IconMenu);
        const iconButton = wrapShallow(iconMenu.props().iconButtonElement);
        expect(iconButton.find(MoreVertIcon)).toHaveLength(1);
    });

    it('renders Remove menu item', () => {
        expect(wrapper.find('.qa-NotificationMenu-MenuItem-Remove')).toHaveLength(1);
    });

    it('renders CloseIcon in Remove menu item', () => {
        const removeMenuItem = wrapper.find('.qa-NotificationMenu-MenuItem-Remove');
        expect(removeMenuItem.props().leftIcon).toEqual(<CloseIcon />);
    });

    describe('initial state', () => {
        it('does not set IconMenu "open" prop', () => {
            expect(wrapper.find(IconMenu).props().open).toBe(null);
        });
    });

    describe('when notification is unread', () => {
        let markAsReadMenuItem;
        beforeEach(() => {
            const props = defaultProps();
            props.notification.unread = true;
            setup(props);
            markAsReadMenuItem = wrapper.find('.qa-NotificationMenu-MenuItem-MarkAsRead');
        });

        it('renders Mark As Read menu item with FlagIcon', () => {
            expect(markAsReadMenuItem).toHaveLength(1);
        });

        it('renders FlagIcon in Mark As Read menu item', () => {
            expect(markAsReadMenuItem.props().leftIcon).toEqual(<FlagIcon />);
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
            expect(markAsUnreadMenuItem.props().leftIcon).toEqual(<FlagIcon />);
        });

        it('does not render Mark As Read menu item', () => {
            expect(wrapper.find('.qa-NotificationMenu-MenuItem-MarkAsRead')).toHaveLength(0);
        });
    });

    describe('when Mark As Read menu item is clicked', () => {
        beforeEach(() => {
            const props = defaultProps();
            props.notification.unread = true;
            setup(props);
            instance.componentDidUpdate = sinon.stub();
            wrapper.find('.qa-NotificationMenu-MenuItem-MarkAsRead').props().onClick();
        });

        it('force closes menu', () => {
            expect(wrapper.state().forceClose).toBe(true);
        });

        it('calls onMarkAsRead() with notification', () => {
            expect(instance.props.onMarkAsRead.callCount).toBe(1);
            expect(instance.props.onMarkAsRead.calledWith(instance.props.notification)).toBe(true);
        });

        describe('when onMarkAsRead() returns true', () => {
            beforeEach(() => {
                setup({
                    onMarkAsRead: () => true,
                });
                wrapper.find('.qa-NotificationMenu-MenuItem-MarkAsRead').props().onClick();
            });

            it('marks notification as read', () => {
                expect(instance.props.markNotificationsAsRead.callCount).toBe(1);
                expect(instance.props.markNotificationsAsRead.calledWith([instance.props.notification])).toBe(true);
            });
        });

        describe('when onMarkAsRead() returns false', () => {
            beforeEach(() => {
                setup({
                    onMarkAsRead: () => false,
                });
                wrapper.find('.qa-NotificationMenu-MenuItem-MarkAsRead').props().onClick();
            });

            it('does not mark notifications as read', () => {
                expect(instance.props.markNotificationsAsRead.callCount).toBe(0);
            });
        });
    });

    describe('when Mark As Unread menu item is clicked', () => {
        beforeEach(() => {
            const props = defaultProps();
            props.notification.unread = false;
            setup(props);
            instance.componentDidUpdate = sinon.stub();
            wrapper.find('.qa-NotificationMenu-MenuItem-MarkAsUnread').props().onClick();
        });

        it('force closes menu', () => {
            expect(wrapper.state().forceClose).toBe(true);
        });

        it('calls onMarkAsUnread() with notification', () => {
            expect(instance.props.onMarkAsUnread.callCount).toBe(1);
            expect(instance.props.onMarkAsUnread.calledWith(instance.props.notification)).toBe(true);
        });

        describe('when onMarkAsUnread() returns true', () => {
            beforeEach(() => {
                const props = defaultProps();
                props.notification.unread = false;
                props.onMarkAsUnread = () => true;
                setup(props);
                wrapper.find('.qa-NotificationMenu-MenuItem-MarkAsUnread').props().onClick();
            });

            it('marks notification as unread', () => {
                expect(instance.props.markNotificationsAsUnread.callCount).toBe(1);
                expect(instance.props.markNotificationsAsUnread.calledWith([instance.props.notification])).toBe(true);
            });
        });

        describe('when onMarkAsUnread() returns false', () => {
            beforeEach(() => {
                const props = defaultProps();
                props.notification.unread = false;
                props.onMarkAsUnread = () => false;
                setup(props);
                wrapper.find('.qa-NotificationMenu-MenuItem-MarkAsUnread').props().onClick();
            });

            it('does not mark notifications as unread', () => {
                expect(instance.props.markNotificationsAsUnread.callCount).toBe(0);
            });
        });
    });

    describe('when View menu item is clicked', () => {
        beforeEach(() => {
            instance.componentDidUpdate = sinon.stub();
            wrapper.find('.qa-NotificationMenu-MenuItem-View').props().onClick();
        });

        it('force closes menu', () => {
            expect(wrapper.state().forceClose).toBe(true);
        });

        it('calls onView() with notification and view path', () => {
            const viewPath = getNotificationViewPath(instance.props.notification);
            expect(instance.props.onView.callCount).toBe(1);
            expect(instance.props.onView.calledWith(instance.props.notification, viewPath)).toBe(true);
        });

        describe('when onView() returns true', () => {
            beforeEach(() => {
                setup({
                    onView: () => true,
                });
                wrapper.find('.qa-NotificationMenu-MenuItem-View').props().onClick();
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
                setup({
                    onView: () => false,
                });
                wrapper.find('.qa-NotificationMenu-MenuItem-View').props().onClick();
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
        beforeEach(() => {
            instance.componentDidUpdate = sinon.stub();
            wrapper.find('.qa-NotificationMenu-MenuItem-Remove').props().onClick();
        });

        it('force closes menu', () => {
            expect(wrapper.state().forceClose).toBe(true);
        });

        it('calls onRemove() with notification', () => {
            expect(instance.props.onRemove.callCount).toBe(1);
            expect(instance.props.onRemove.calledWith(instance.props.notification)).toBe(true);
        });

        describe('when onRemove() returns true', () => {
            beforeEach(() => {
                setup({
                    onRemove: () => true,
                });
                wrapper.find('.qa-NotificationMenu-MenuItem-Remove').props().onClick();
            });

            it('removes notification', () => {
                expect(instance.props.removeNotifications.callCount).toBe(1);
                expect(instance.props.removeNotifications.calledWith([instance.props.notification])).toBe(true);
            });
        });

        describe('when onRemove() returns false', () => {
            beforeEach(() => {
                setup({
                    onRemove: () => false,
                });
                wrapper.find('.qa-NotificationMenu-MenuItem-Remove').props().onClick();
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
            expect(viewMenuItem.props().leftIcon).toEqual(<OpenInNewIcon />);
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

    describe('when forceClose is set to true', () => {
        let componentDidUpdateStub;
        beforeEach(() => {
            componentDidUpdateStub = sinon.stub(NotificationMenu.prototype, 'componentDidUpdate');
            wrapper.setState({
                forceClose: true,
            });
        });

        afterEach(() => {
            if (componentDidUpdateStub.restore) {
                componentDidUpdateStub.restore();
            }
        });

        it('sets IconMenu "open" prop to false', () => {
            expect(wrapper.find(IconMenu).props().open).toBe(false);
        });

        it('resets forceClose to false in componentDidUpdate()', () => {
            componentDidUpdateStub.restore();
            instance.componentDidUpdate();
            expect(wrapper.state().forceClose).toBe(false);
        });
    });

    describe('when forceClose is set to false', () => {
        beforeEach(() => {
            wrapper.setState({
                forceClose: false,
            });
        });

        it('does not set menu "open" prop', () => {
            expect(wrapper.find(IconMenu).props().open).toBe(null);
        });
    });
});
