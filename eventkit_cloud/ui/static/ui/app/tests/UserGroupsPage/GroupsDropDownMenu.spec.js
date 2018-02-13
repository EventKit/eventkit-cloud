import React, { PropTypes } from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import CircularProgress from 'material-ui/CircularProgress';
import CheckIcon from 'material-ui/svg-icons/navigation/check';
import { GroupsDropDownMenu } from '../../components/UserGroupsPage/GroupsDropDownMenu';
import { CustomScrollbar } from '../../components/CustomScrollbar';

describe('GroupsDropDownMenu component', () => {
    const muiTheme = getMuiTheme();

    const fakeGroups = [
        {
            id: '1',
            name: 'group1',
            members: ['user1', 'user2'],
            owners: ['user1'],
        },
        {
            id: '2',
            name: 'group2',
            members: ['user1', 'user2'],
            owners: ['user2'],
        },
    ];
    const getProps = () => (
        {
            groups: [...fakeGroups],
            open: true,
            onClose: () => {},
            onMenuItemClick: () => {},
            onNewGroupClick: () => {},
            selectedGroups: ['1'],
            groupsLoading: false,
        }
    );

    const getWrapper = props => (
        // using shallow because the MUI components inside are super weird to test
        shallow(<GroupsDropDownMenu {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should render a popover', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Popover)).toHaveLength(1);
    });

    it('should render a popover', () => {
        const props = getProps();
        props.open = false;
        props.onMenuItemClick = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setProps({ open: true });
        expect(wrapper.find(Menu)).toHaveLength(1);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(MenuItem)).toHaveLength(3);
        wrapper.find('.qa-GroupsDropDownMenu-MenuItem-group').first().props().onTouchTap();
        expect(props.onMenuItemClick.calledOnce).toBe(true);
        expect(props.onMenuItemClick.calledWith(props.groups[0])).toBe(true);
    });

    it('menu items should display check mark if user is in the respective group', () => {
        const props = getProps();
        props.open = false;
        const wrapper = getWrapper(props);
        wrapper.setProps({ open: true });
        expect(wrapper.find('.qa-GroupsDropDownMenu-MenuItem-group')).toHaveLength(2);
        expect(wrapper.find('.qa-GroupsDropDownMenu-MenuItem-group').first().find(CheckIcon)).toHaveLength(1);
        expect(wrapper.find('.qa-GroupsDropDownMenu-MenuItem-group').last().find(CheckIcon)).toHaveLength(0);
    });

    it('should display a loading icon', () => {
        const props = getProps();
        props.open = true;
        props.groupsLoading = true;
        const wrapper = getWrapper(props);
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
    });
});
