import React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import sinon from 'sinon';
import moment from 'moment';
import TableRow from '@material-ui/core/TableRow';
import { getNotificationViewPath } from '../../utils/notificationUtils';
import { NotificationsTableItem } from '../../components/Notification/NotificationsTableItem';

describe('NotificationsTableItem component', () => {
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
            isSelected: true,
            router: {
                push: sinon.spy(),
            },
            onView: sinon.spy(),
            onMarkAsRead: sinon.spy(),
            onMarkAsUnread: sinon.spy(),
            onRemove: sinon.spy(),
            setSelected: sinon.spy(),
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
        wrapper = shallow(<NotificationsTableItem {...props} />);
        instance = wrapper.instance();
    }

    beforeEach(() => {
        window.resizeTo(1920, 1080);
        setup();
    });

    it('sets the checkbox "checked" prop to its "isSelected" prop', () => {
        const checkbox = wrapper.find('.qa-NotificationsTableItem-Checkbox');
        expect(checkbox.props().checked).toBe(instance.props.isSelected);
    });

    it('formats date correctly', () => {
        const date = wrapper.find('.qa-NotificationsTableItem-TableCell-Date');
        expect(date.childAt(0).text()).toBe(moment(instance.props.notification.timestamp).format('M/D/YY'));
        expect(date.childAt(1).text()).toBe(moment(instance.props.notification.timestamp).format('h:mma'));
    });

    describe('when checkbox is clicked', () => {
        let isChecked;

        beforeEach(() => {
            const checkbox = wrapper.find('.qa-NotificationsTableItem-Checkbox');
            isChecked = !checkbox.props().checked;
            const e = { stopPropagation: () => {} };
            checkbox.props().onChange(e, isChecked);
        });

        it('calls setSelected() with notification and isChecked', () => {
            expect(instance.props.setSelected.callCount).toBe(1);
            expect(instance.props.setSelected.calledWith(instance.props.notification, isChecked));
        });
    });

    describe('when "View" button is clicked', () => {
        let setupA;

        beforeEach(() => {
            setupA = (props) => {
                setup(props);
                wrapper.find('.qa-NotificationsTableItem-ActionButtons-View').props().onClick();
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

    describe('when "Mark As Read" button is clicked', () => {
        let setupA;

        beforeEach(() => {
            setupA = (props) => {
                setup(props);
                wrapper.find('.qa-NotificationsTableItem-ActionButtons-MarkAsRead').props().onClick();
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

    describe('when "Mark As Unread" button is clicked', () => {
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
                wrapper.find('.qa-NotificationsTableItem-ActionButtons-MarkAsUnread').props().onClick();
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

    describe('when "Remove" button is clicked', () => {
        let setupA;

        beforeEach(() => {
            setupA = (props) => {
                setup(props);
                wrapper.find('.qa-NotificationsTableItem-ActionButtons-Remove').props().onClick();
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

    describe('above a window width of 1279', () => {
        it('renders action buttons', () => {
            expect(wrapper.find('.qa-NotificationsTableItem-ActionButtons')).toHaveLength(1);
        });

        it('does not render action menu', () => {
            expect(wrapper.find('.qa-NotificationsTableItem-ActionMenu')).toHaveLength(0);
        });
    });

    describe('below a window width of 1280', () => {
        beforeEach(() => {
            setup();
            wrapper.setProps({ width: 'sm' });
        });

        it('does not render buttons', () => {
            expect(wrapper.find('.qa-NotificationsTableItem-ActionButtons')).toHaveLength(0);
        });

        it('renders menu', () => {
            expect(wrapper.find('.qa-NotificationsTableItem-ActionMenu')).toHaveLength(1);
        });

        it('passes correct props to action menu', () => {
            const actionMenu = wrapper.find('.qa-NotificationsTableItem-ActionMenu');
            expect(actionMenu.props().notification).toBe(instance.props.notification);
            expect(actionMenu.props().router).toBe(instance.props.router);
            expect(actionMenu.props().onMarkAsRead).toBe(instance.props.onMarkAsRead);
            expect(actionMenu.props().onMarkAsUnread).toBe(instance.props.onMarkAsUnread);
            expect(actionMenu.props().onRemove).toBe(instance.props.onRemove);
            expect(actionMenu.props().onView).toBe(instance.props.onView);
        });
    });

    describe('when notification is unread', () => {
        beforeEach(() => {
            wrapper.setProps({
                notification: {
                    ...instance.props.notification,
                    unread: true,
                },
            });
        });

        it('renders a non-white background color', () => {
            expect(wrapper.find(TableRow).at(0).props().style.backgroundColor).not.toBe('#fff');
        });
    });

    describe('when notification is not unread', () => {
        beforeEach(() => {
            wrapper.setProps({
                notification: {
                    ...instance.props.notification,
                    unread: false,
                },
            });
        });

        it('renders a white background color', () => {
            expect(wrapper.find(TableRow).at(0).props().style.backgroundColor).toBe('#fff');
        });
    });
});
