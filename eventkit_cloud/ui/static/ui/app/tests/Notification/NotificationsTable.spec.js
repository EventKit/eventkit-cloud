import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { Checkbox, Table, TableBody, TableHeader, TableHeaderColumn, TableRow } from 'material-ui';
import CheckboxIcon from 'material-ui/svg-icons/toggle/check-box';
import IndeterminateCheckboxIcon from '../../components/icons/IndeterminateIcon';
import NotificationsTable from '../../components/Notification/NotificationsTable';
import NotificationsTableMenu from '../../components/Notification/NotificationsTableMenu';
import NotificationsTableItem from '../../components/Notification/NotificationsTableItem';

const mockNotifications = {
    '1': {
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
    '2': {
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
    function getProps() {
        return {
            notifications: {
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
            markNotificationsAsRead: () => {},
            markNotificationsAsUnread: () => {},
            removeNotifications: () => {},
        };
    }

    function getShallowWrapper(props = getProps()) {
        return shallow(<NotificationsTable {...props} />);
    }

    function elementType(element) {
        return shallow(<div>{element}</div>).childAt(0).type();
    }

    it('should have the correct initial state', () => {
        const wrapper = getShallowWrapper();
        expect(wrapper.state().selected).toEqual({});
    });

    it('should render the basic elements', () => {
        const props = getProps();
        const wrapper = getShallowWrapper(props);
        expect(wrapper.find(Table)).toHaveLength(1);
        expect(wrapper.find(Table).get(0).props.selectable).toBe(false);
        expect(wrapper.find(TableHeader)).toHaveLength(1);
        expect(wrapper.find(TableHeader).get(0).props.displaySelectAll).toBe(false);
        expect(wrapper.find(TableHeader).get(0).props.adjustForCheckbox).toBe(false);
        expect(wrapper.find(TableHeader).find(TableRow)).toHaveLength(1);
        expect(wrapper.find(TableHeader).find(TableRow).find(TableHeaderColumn)).toHaveLength(4);
        expect(wrapper.find(TableHeaderColumn).at(0).find(Checkbox)).toHaveLength(1);
        expect(wrapper.find(TableHeaderColumn).at(1).find('span').text()).toBe('0 Selected');
        expect(wrapper.find(TableHeaderColumn).at(1).find(NotificationsTableMenu)).toHaveLength(1);
        expect(wrapper.find(TableHeaderColumn).at(2).childAt(0).text()).toBe('Date');
        expect(wrapper.find(TableHeaderColumn).at(3).childAt(0).text()).toBe('Options');
        expect(wrapper.find(TableBody)).toHaveLength(1);
        expect(wrapper.find(TableBody).get(0).props.displayRowCheckbox).toBe(false);
        expect(wrapper.find(TableBody).find(NotificationsTableItem)).toHaveLength(props.notificationsArray.length);
    });

    it('should correctly update state when setSelected() is called', () => {
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        expect(instance.state.selected).toEqual({});
        instance.setSelected(mockNotifications['1'], true);
        expect(instance.state.selected).toEqual({
            '1': mockNotifications['1'],
        });
        instance.setSelected(mockNotifications['1'], false);
        expect(instance.state.selected).toEqual({});
    });

    it('should correctly update state when handleSelectAllCheck() is called', () => {
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        expect(instance.state.selected).toEqual({});
        instance.handleSelectAllCheck();
        expect(instance.state.selected).toEqual({
            '1': mockNotifications['1'],
            '2': mockNotifications['2'],
        });
        instance.handleSelectAllCheck();
        expect(instance.state.selected).toEqual({});
        wrapper.setState({
            selected: {
                '1': mockNotifications['1'],
            },
        });
        instance.handleSelectAllCheck();
        expect(instance.state.selected).toEqual({});
    });

    it('should return the correct select all checkbox checked icon', () => {
        const wrapper = getShallowWrapper();
        const instance = wrapper.instance();
        wrapper.setState({
            selected: {
                '1': mockNotifications['1'],
                '2': mockNotifications['2'],
            },
        });
        expect(elementType(instance.getSelectAllCheckedIcon())).toBe(CheckboxIcon);
        wrapper.setState({
            selected: {
                '1': mockNotifications['1'],
            },
        });
        expect(elementType(instance.getSelectAllCheckedIcon())).toBe(IndeterminateCheckboxIcon);
    });

    it('should pass correct props to the select all checkbox', () => {
        const wrapper = getShallowWrapper();
        let checkbox = wrapper.find(TableHeaderColumn).at(0).find(Checkbox).get(0);
        expect(checkbox.props.checked).toBe(false);
        expect(checkbox.props.onCheck).toBe(wrapper.instance().handleSelectAllCheck);
        wrapper.setState({
            selected: {
                '1': mockNotifications['1'],
                '2': mockNotifications['2'],
            },
        });
        checkbox = wrapper.find(TableHeaderColumn).at(0).find(Checkbox).get(0);
        expect(checkbox.props.checked).toBe(true);
        expect(elementType(checkbox.props.checkedIcon)).toBe(CheckboxIcon);
        wrapper.setState({
            selected: {
                '1': mockNotifications['1'],
            },
        });
        checkbox = wrapper.find(TableHeaderColumn).at(0).find(Checkbox).get(0);
        expect(checkbox.props.checked).toBe(true);
        expect(elementType(checkbox.props.checkedIcon)).toBe(IndeterminateCheckboxIcon);
    });

    it('should pass correct props to NotificationsTableMenu', () => {
        const props = {
            ...getProps(),
            onMarkAsRead: () => {},
            onMarkAsUnread: () => {},
            onRemove: () => {},
            onMarkAllAsRead: () => {},
        };
        const wrapper = getShallowWrapper(props);
        wrapper.setState({
            selected: {
                '1': mockNotifications['1'],
                '2': mockNotifications['2'],
            },
        });
        const menu = wrapper.find(NotificationsTableMenu).get(0);
        expect(menu.props.selectedNotifications).toBe(wrapper.state().selected);
        expect(menu.props.onMarkAsRead).toBe(props.onMarkAsRead);
        expect(menu.props.onMarkAsUnread).toBe(props.onMarkAsUnread);
        expect(menu.props.onRemove).toBe(props.onRemove);
        expect(menu.props.onMarkAllAsRead).toBe(props.onMarkAllAsRead);
    });

    it('should pass correct props to NotificationsTableItem', () => {
        const props = {
            ...getProps(),
            onMarkAsRead: () => {},
            onMarkAsUnread: () => {},
            onRemove: () => {},
            onView: () => {},
        };
        const wrapper = getShallowWrapper(props);
        const instance = wrapper.instance();
        wrapper.setState({
            selected: {
                '1': mockNotifications['1'],
            },
        });
        const item = wrapper.find(NotificationsTableItem).get(0);
        expect(item.props.notification).toBe(props.notificationsArray[0]);
        expect(item.props.router).toBe(props.router);
        expect(item.props.isSelected).toBe(true);
        expect(item.props.setSelected).toBe(instance.setSelected);
        expect(item.props.onMarkAsRead).toBe(props.onMarkAsRead);
        expect(item.props.onMarkAsUnread).toBe(props.onMarkAsUnread);
        expect(item.props.onRemove).toBe(props.onRemove);
        expect(item.props.onView).toBe(props.onView);
    });

    it('should remove selected notifications when they disappear from the store', () => {
        const props = getProps();
        const wrapper = getShallowWrapper(props);
        wrapper.setState({
            selected: {
                '1': mockNotifications['1'],
                '2': mockNotifications['2'],
            },
        });
        expect(wrapper.state().selected).toEqual({
            '1': mockNotifications['1'],
            '2': mockNotifications['2'],
        });
        wrapper.setProps({
            notifications: {
                ...props.notifications,
                notifications: {
                    '1': mockNotifications['1'],
                },
            },
        });
        expect(wrapper.state().selected).toEqual({
            '1': mockNotifications['1'],
        });
    });

    it('should show the correct selected count', () => {
        const wrapper = getShallowWrapper();
        wrapper.setState({
            selected: {
                '1': mockNotifications['1'],
                '2': mockNotifications['2'],
            },
        });
        expect(wrapper.find(TableHeaderColumn).at(1).find('span').text()).toBe('2 Selected');
    });
});