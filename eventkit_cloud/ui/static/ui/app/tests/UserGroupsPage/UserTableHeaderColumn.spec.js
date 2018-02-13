import React, { PropTypes } from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { TableHeaderColumn } from 'material-ui/Table';
import DropDownMenu from 'material-ui/DropDownMenu';
import { GroupsDropDownMenu } from '../../components/UserGroupsPage/GroupsDropDownMenu';
import { UserTableHeaderColumn } from '../../components/UserGroupsPage/UserTableHeaderColumn';

describe('UserTableHeaderColumn component', () => {
    const muiTheme = getMuiTheme();

    const getProps = () => (
        {
            users: [
                { name: 'user1', username: 'user2' },
                { name: 'user2', username: 'user2' },
            ],
            sortValue: 'user__username',
            handleSortChange: () => {},
            selectedUsers: [{ name: 'user2', username: 'user2' }],
            selectedGroups: ['group1'],
            groups: [
                { name: 'group1', id: 'group1' },
                { name: 'group2', id: 'group2' },
            ],
            groupsLoading: false,
            handleGroupItemClick: () => {},
            handleNewGroupClick: () => {},
        }
    );

    const getWrapper = props => (
        mount(<UserTableHeaderColumn {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    it('should render the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(TableHeaderColumn)).toHaveLength(1);
        expect(wrapper.find(GroupsDropDownMenu)).toHaveLength(1);
        expect(wrapper.find(DropDownMenu)).toHaveLength(1);
    });

    it('should render the selected users options', () => {
        const props = getProps();
        props.selectedUsers = [];
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-UserTableHeaderColumn-IconButton-options')).toHaveLength(0);
        wrapper.setProps({ selectedUsers: [0] });
        expect(wrapper.find('.qa-UserTableHeaderColumn-IconButton-options')).toHaveLength(1);
    });

    it('handleOpen should prevent default and set state', () => {
        const fakeEvent = { preventDefault: sinon.spy(), currentTarget: null };
        const props = getProps();
        const stateSpy = sinon.spy(UserTableHeaderColumn.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleOpen(fakeEvent);
        expect(fakeEvent.preventDefault.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ open: true, popoverAnchor: null })).toBe(true);
        stateSpy.restore();
    });

    it('handleClose should setState', () => {
        const props = getProps();
        const stateSpy = sinon.spy(UserTableHeaderColumn.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleClose();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ open: false })).toBe(true);
        stateSpy.restore();
    });

    it('handleNewGroupClick should call handleClose and handleNewGroupClick', () => {
        const props = getProps();
        props.handleNewGroupClick = sinon.spy();
        const closeSpy = sinon.spy(UserTableHeaderColumn.prototype, 'handleClose');
        const wrapper = getWrapper(props);
        wrapper.instance().handleNewGroupClick();
        expect(closeSpy.calledOnce).toBe(true);
        expect(props.handleNewGroupClick.calledOnce).toBe(true);
        expect(props.handleNewGroupClick.calledWith(props.selectedUsers)).toBe(true);
        closeSpy.restore();
    });
});
