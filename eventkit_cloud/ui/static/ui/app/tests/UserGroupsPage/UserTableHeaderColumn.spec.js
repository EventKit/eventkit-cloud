import React, { PropTypes } from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { TableHeaderColumn } from 'material-ui/Table';
import IconMenu from 'material-ui/IconMenu';
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
            selectedGroups: [1],
            groups: [
                { name: 'group1', id: 1 },
                { name: 'group2', id: 2 },
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
        expect(wrapper.find(IconMenu)).toHaveLength(1);
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
        const stateStub = sinon.stub(UserTableHeaderColumn.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleOpen(fakeEvent);
        expect(fakeEvent.preventDefault.calledOnce).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ open: true, popoverAnchor: null })).toBe(true);
        stateStub.restore();
    });

    it('handleClose should setState', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserTableHeaderColumn.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ open: false })).toBe(true);
        stateStub.restore();
    });

    it('handleGroupItemClick should call handleClose and props.handleGroupItemClick', () => {
        const props = getProps();
        props.handleGroupItemClick = sinon.spy();
        const closeStub = sinon.stub(UserTableHeaderColumn.prototype, 'handleClose');
        const wrapper = getWrapper(props);
        const group = { id: 1 };
        wrapper.instance().handleGroupItemClick(group);
        expect(closeStub.calledOnce).toBe(true);
        expect(props.handleGroupItemClick.calledOnce).toBe(true);
        expect(props.handleGroupItemClick.calledWith(group)).toBe(true);
        closeStub.restore();
    });

    it('handleNewGroupClick should call handleClose and handleNewGroupClick', () => {
        const props = getProps();
        props.handleNewGroupClick = sinon.spy();
        const closeStub = sinon.stub(UserTableHeaderColumn.prototype, 'handleClose');
        const wrapper = getWrapper(props);
        wrapper.instance().handleNewGroupClick();
        expect(closeStub.calledOnce).toBe(true);
        expect(props.handleNewGroupClick.calledOnce).toBe(true);
        expect(props.handleNewGroupClick.calledWith(props.selectedUsers)).toBe(true);
        closeStub.restore();
    });
});
