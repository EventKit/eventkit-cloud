/* eslint prefer-destructuring: 0 */
import React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import sinon from 'sinon';
import TableCell from '@material-ui/core/TableCell';
import CheckboxIcon from '@material-ui/icons/CheckBox';
import IndeterminateCheckboxIcon from '../../components/icons/IndeterminateIcon';
import { NotificationsTable } from '../../components/Notification/NotificationsTable';
import NotificationsTableMenu from '../../components/Notification/NotificationsTableMenu';
import NotificationsTableItem from '../../components/Notification/NotificationsTableItem';

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

describe('NotificationsTable component', () => {
    let wrapper;
    let instance;
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    function defaultProps() {
        return {
            notificationsData: {
                fetched: false,
                notifications: mockNotifications,
                notificationsSorted: [
                    mockNotifications['1'],
                    mockNotifications['2'],
                ],
            },
            notificationsArray: [
                mockNotifications['1'],
                mockNotifications['2'],
            ],
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
            ...global.eventkit_test_props,
        };
    }

    function setup(propsOverride = {}) {
        const props = {
            ...defaultProps(),
            ...propsOverride,
        };
        wrapper = shallow(<NotificationsTable {...props} />);
        instance = wrapper.instance();
    }

    beforeEach(setup);

    it('renders notifications', () => {
        const tableItems = wrapper.find(NotificationsTableItem);
        expect(tableItems).not.toHaveLength(0);
        expect(tableItems).toHaveLength(instance.props.notificationsArray.length);
        instance.props.notificationsArray.forEach((notification, i) => {
            expect(tableItems.at(i).props().notification).toBe(notification);
        });
    });

    it('shows the current selected count', () => {
        wrapper.setState({
            selected: {
                1: mockNotifications['1'],
                2: mockNotifications['2'],
            },
        });

        expect(wrapper.find(TableCell).at(1).find('span').text()).toBe('2 Selected');
    });

    it('passes correct props to NotificationsTableMenu', () => {
        wrapper.setState({
            selected: {
                1: mockNotifications['1'],
                2: mockNotifications['2'],
            },
        });
        const tableMenu = wrapper.find(NotificationsTableMenu);
        expect(Object.keys(tableMenu.props()).length).toBe(6);
        expect(tableMenu.props().allSelected).toBe(true);
        expect(tableMenu.props().selectedNotifications).toBe(wrapper.state().selected);
        expect(tableMenu.props().onMarkAsRead).toBe(instance.props.onMarkAsRead);
        expect(tableMenu.props().onMarkAsUnread).toBe(instance.props.onMarkAsUnread);
        expect(tableMenu.props().onRemove).toBe(instance.props.onRemove);
        expect(tableMenu.props().onMarkAllAsRead).toBe(instance.props.onMarkAllAsRead);
    });

    it('passes correct props to NotificationsTableItem', () => {
        wrapper.setState({
            selected: {
                1: mockNotifications['1'],
            },
        });
        const tableItem = wrapper.find(NotificationsTableItem).at(0);
        expect(Object.keys(tableItem.props()).length).toBe(9);
        expect(tableItem.props().notification).toBe(instance.props.notificationsArray[0]);
        expect(tableItem.props().router).toBe(instance.props.router);
        expect(tableItem.props().isSelected).toBe(true);
        expect(tableItem.props().setSelected).toBe(instance.setSelected);
        expect(tableItem.props().onMarkAsRead).toBe(instance.props.onMarkAsRead);
        expect(tableItem.props().onMarkAsUnread).toBe(instance.props.onMarkAsUnread);
        expect(tableItem.props().onRemove).toBe(instance.props.onRemove);
        expect(tableItem.props().onView).toBe(instance.props.onView);
    });

    describe('when notification checkbox is clicked', () => {
        let notification;
        let wasSelected;

        beforeEach(() => {
            notification = instance.props.notificationsArray[0];
            wasSelected = instance.isSelected(notification);
            wrapper.find(NotificationsTableItem).at(0).props().setSelected(notification, !wasSelected);
        });

        it('updates selected state', () => {
            expect(instance.isSelected(notification)).toBe(!wasSelected);
        });
    });

    describe('when no notifications are selected', () => {
        let selectAllCheckbox;

        beforeEach(() => {
            wrapper.setState({
                selected: {},
            });
            selectAllCheckbox = wrapper.find('.qa-NotificationsTable-SelectAllCheckbox');
        });

        it('sets "Select All" checked prop to false', () => {
            expect(selectAllCheckbox.props().checked).toBe(false);
        });

        it('unselects all notifications', () => {
            instance.props.notificationsArray.forEach((notification, i) => {
                const tableItem = wrapper.find(NotificationsTableItem).at(i);
                expect(tableItem.props().isSelected).toBe(false);
            });
        });

        describe('then "Select All" checkbox is clicked', () => {
            beforeEach(() => {
                selectAllCheckbox.props().onChange();
            });

            it('updates "selected" state', () => {
                const selected = {};
                instance.props.notificationsArray.forEach((notification) => {
                    selected[notification.id] = notification;
                });
                expect(instance.state.selected).toEqual(selected);
            });

            it('selects all notifications', () => {
                instance.props.notificationsArray.forEach((notification) => {
                    expect(instance.isSelected(notification)).toBe(true);
                });
            });
        });
    });

    describe('when all notifications are selected', () => {
        let selectAllCheckbox;

        beforeEach(() => {
            const selected = {};
            instance.props.notificationsArray.forEach((notification) => {
                selected[notification.id] = notification;
            });
            wrapper.setState({
                selected,
            });
            selectAllCheckbox = wrapper.find('.qa-NotificationsTable-SelectAllCheckbox');
        });

        it('sets "Select All" checked prop to true', () => {
            expect(selectAllCheckbox.props().checked).toBe(true);
        });

        it('sets "Select All" checkedIcon prop to CheckboxIcon', () => {
            expect(selectAllCheckbox.props().checkedIcon).toEqual(<CheckboxIcon />);
        });

        it('selects all notification table items', () => {
            instance.props.notificationsArray.forEach((notification, i) => {
                const tableItem = wrapper.find(NotificationsTableItem).at(i);
                expect(tableItem.props().isSelected).toBe(true);
            });
        });

        describe('then "Select All" checkbox is clicked', () => {
            beforeEach(() => {
                selectAllCheckbox.props().onChange();
            });

            it('updates "selected" state', () => {
                expect(instance.state.selected).toEqual({});
            });

            it('deselects all notifications', () => {
                wrapper.update();
                instance.props.notificationsArray.forEach((notification, i) => {
                    const tableItem = wrapper.find(NotificationsTableItem).at(i);
                    expect(tableItem.props().isSelected).toBe(false);
                });
            });
        });
    });

    describe('when some (but not all) notifications are selected', () => {
        let selectAllCheckbox;

        beforeEach(() => {
            wrapper.setState({
                selected: {
                    1: mockNotifications['1'],
                },
            });
            selectAllCheckbox = wrapper.find('.qa-NotificationsTable-SelectAllCheckbox');
        });

        it('sets "Select All" checked prop to true', () => {
            expect(selectAllCheckbox.props().checked).toBe(true);
        });

        it('sets "Select All" checkedIcon prop to IndeterminateCheckboxIcon', () => {
            expect(selectAllCheckbox.props().checkedIcon).toEqual(<IndeterminateCheckboxIcon />);
        });

        describe('then "Select All" checkbox is clicked', () => {
            beforeEach(() => {
                selectAllCheckbox.props().onChange();
            });

            it('updates "selected" state', () => {
                expect(instance.state.selected).toEqual({});
            });

            it('deselects all notifications', () => {
                wrapper.update();
                instance.props.notificationsArray.forEach((notification, i) => {
                    const tableItem = wrapper.find(NotificationsTableItem).at(i);
                    expect(tableItem.props().isSelected).toBe(false);
                });
            });
        });
    });

    describe('when notifications disappear from the store', () => {
        beforeEach(() => {
            wrapper.setState({
                selected: {
                    1: mockNotifications['1'],
                    2: mockNotifications['2'],
                },
            });
            wrapper.setProps({
                notificationsData: {
                    ...instance.props.notificationsData,
                    notifications: {
                        1: mockNotifications['1'],
                    },
                },
            });
        });

        it('updates "selected" state', () => {
            expect(wrapper.state().selected).toEqual({
                1: mockNotifications['1'],
            });
        });
    });
});
