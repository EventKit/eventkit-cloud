import React, { PropTypes } from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { Table } from 'material-ui/Table';
import UserTableRowColumn from '../../components/UserGroupsPage/UserTableRowColumn';
import UserTableHeaderColumn from '../../components/UserGroupsPage/UserTableHeaderColumn';
import GroupsDrawer from '../../components/UserGroupsPage/GroupsDrawer';
import CreateGroupDialog from '../../components/UserGroupsPage/CreateGroupDialog';
import LeaveGroupDialog from '../../components/UserGroupsPage/LeaveGroupDialog';
import DeleteGroupDialog from '../../components/UserGroupsPage/DeleteGroupDialog';
import BaseDialog from '../../components/BaseDialog';
import { UserGroupsPage } from '../../components/UserGroupsPage/UserGroupsPage';

describe('UserGroupsPage component', () => {
    const muiTheme = getMuiTheme();

    const getProps = () => (
        {
            user: {
                username: 'user1',
                name: 'user1',
                groups: ['group1', 'group2'],
            },
            groups: {
                groups: [
                    { name: 'group1', id: 'group1', administrators: ['user1'], members: ['user1', 'user2'] },
                    { name: 'group2', id: 'group2', administrators: ['user2'], members: ['user1', 'user2'] },
                    { name: 'group3', id: 'group3', administrators: ['user2'], members: ['user2'] },
                ],
                cancelSource: null,
                fetching: false,
                fetched: false,
                creating: false,
                created: false,
                deleting: false,
                deleted: false,
                adding: false,
                added: false,
                removing: false,
                removed: false,
                error: null,
            },
            users: {
                users: [
                    { name: 'user1', username: 'user1', groups: ['group1', 'group2'] },
                    { name: 'user2', username: 'user2', groups: ['group1', 'group2', 'group3'] },
                    { name: 'user3', username: 'user3', groups: ['group2', 'group3'] },
                ],
                fetching: false,
                fetched: false,
                error: null,
                total: 0,
            },
            getGroups: () => {},
            deleteGroup: () => {},
            createGroup: () => {},
            addUsers: () => {},
            removeUsers: () => {},
            getUsers: () => {},
        }
    );

    const getWrapper = props => (
        mount(<UserGroupsPage {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: PropTypes.object,
            },
        })
    );

    beforeAll(() => {
        sinon.stub(UserGroupsPage.prototype, 'componentDidMount');
    });

    afterAll(() => {
        UserGroupsPage.prototype.componentDidMount.restore();
    });

    it('should render its basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-UserGroupsPage-AppBar')).toHaveLength(1);
        expect(wrapper.find('.qa-UserGroupsPage-RaisedButton-create')).toHaveLength(1);
        expect(wrapper.find('.qa-UserGroupsPage-CustomScrollbar')).toHaveLength(1);
        expect(wrapper.find('.qa-UserGroupsPage-search')).toHaveLength(1);
        expect(wrapper.find(Table)).toHaveLength(2);
        expect(wrapper.find(UserTableHeaderColumn)).toHaveLength(1);
        expect(wrapper.find(UserTableRowColumn)).toHaveLength(3);
        expect(wrapper.find(GroupsDrawer)).toHaveLength(1);
        expect(wrapper.find(CreateGroupDialog)).toHaveLength(1);
        expect(wrapper.find(LeaveGroupDialog)).toHaveLength(1);
        expect(wrapper.find(DeleteGroupDialog)).toHaveLength(1);
        expect(wrapper.find(BaseDialog)).toHaveLength(6);
    });

    it('should give the table header a list of groups that all selected users share', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({
            selectedUsers: [
                props.users.users[0],
                props.users.users[1],
                props.users.users[2],
            ],
        });
        let expectedGroups = [];
        expect(wrapper.find(UserTableHeaderColumn).props().selectedGroups).toEqual(expectedGroups);
        wrapper.setState({
            selectedUsers: [
                props.users.users[0],
                props.users.users[1],
            ],
        });
        expectedGroups = ['group1'];
        expect(wrapper.find(UserTableHeaderColumn).props().selectedGroups).toEqual(expectedGroups);
    });

    it('componentDidMount should call makeUserRequest and getGroups', () => {
        const props = getProps();
        props.getGroups = sinon.spy();
        const makeRequestStub = sinon.stub(UserGroupsPage.prototype, 'makeUserRequest');
        // we stub componentDidMount before all tests, so temporarily undo it
        UserGroupsPage.prototype.componentDidMount.restore();
        const wrapper = getWrapper(props);
        expect(props.getGroups.calledOnce).toBe(true);
        expect(makeRequestStub.calledOnce).toBe(true);
        makeRequestStub.restore();
        // re-stub it since afterAll will restore it when tests are finished
        sinon.stub(UserGroupsPage.prototype, 'componentDidMount');
    });

    it('componentWillReceiveProps should handle users fetched', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({ selectedUsers: [props.users.users[1], props.users.users[2]] });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const nextProps = getProps();
        nextProps.users.fetched = true;
        nextProps.users.users = [nextProps.users.users[0], nextProps.users.users[1]];
        wrapper.setProps(nextProps);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ selectedUsers: [nextProps.users.users[1]] })).toBe(true);
        stateStub.restore();
    });

    it('componentWillReceiveProps should handle added', () => {
        const props = getProps();
        props.getGroups = sinon.spy();
        const makeRequestStub = sinon.stub(UserGroupsPage.prototype, 'makeUserRequest');
        const wrapper = getWrapper(props);
        const groupsCallCount = props.getGroups.callCount;
        const userCallCount = makeRequestStub.callCount;
        wrapper.setProps({ groups: { ...props.groups, added: true } });
        expect(props.getGroups.callCount).toEqual(groupsCallCount + 1);
        expect(makeRequestStub.callCount).toEqual(userCallCount + 1);
        makeRequestStub.restore();
    });

    it('componentWillReceiveProps should handle removed', () => {
        const props = getProps();
        props.getGroups = sinon.spy();
        const makeRequestStub = sinon.stub(UserGroupsPage.prototype, 'makeUserRequest');
        const wrapper = getWrapper(props);
        const groupsCallCount = props.getGroups.callCount;
        const userCallCount = makeRequestStub.callCount;
        wrapper.setProps({ groups: { ...props.groups, removed: true } });
        expect(props.getGroups.callCount).toEqual(groupsCallCount + 1);
        expect(makeRequestStub.callCount).toEqual(userCallCount + 1);
        makeRequestStub.restore();
    });

    it('componentWillReceiveProps should handle created with no users', () => {
        const props = getProps();
        props.getGroups = sinon.spy();
        const makeRequestStub = sinon.stub(UserGroupsPage.prototype, 'makeUserRequest');
        const wrapper = getWrapper(props);
        const groupsCallCount = props.getGroups.callCount;
        const userCallCount = makeRequestStub.callCount;
        wrapper.setProps({ groups: { ...props.groups, created: true } });
        expect(props.getGroups.callCount).toEqual(groupsCallCount + 1);
        expect(makeRequestStub.callCount).toEqual(userCallCount);
        makeRequestStub.restore();
    });

    it('componentWillReceiveProps should handle created with users', () => {
        const props = getProps();
        props.getGroups = sinon.spy();
        const stateSpy = sinon.spy(UserGroupsPage.prototype, 'setState');
        const makeRequestStub = sinon.stub(UserGroupsPage.prototype, 'makeUserRequest');
        const wrapper = getWrapper(props);
        const groupsCallCount = props.getGroups.callCount;
        const userCallCount = makeRequestStub.callCount;
        wrapper.setState({ createUsers: ['user1'] });
        wrapper.setProps({ groups: { ...props.groups, created: true } });
        expect(props.getGroups.callCount).toEqual(groupsCallCount + 1);
        expect(makeRequestStub.callCount).toEqual(userCallCount + 1);
        expect(stateSpy.calledWith({ createUsers: [] }));
        makeRequestStub.restore();
        stateSpy.restore();
    });

    it('componentWillReceiveProps should handle deleted', () => {
        const props = getProps();
        props.getGroups = sinon.spy();
        const stateSpy = sinon.spy(UserGroupsPage.prototype, 'setState');
        const makeRequestStub = sinon.stub(UserGroupsPage.prototype, 'makeUserRequest');
        const wrapper = getWrapper(props);
        const groupsCallCount = props.getGroups.callCount;
        wrapper.setProps({ groups: { ...props.groups, deleted: true } });
        expect(props.getGroups.callCount).toEqual(groupsCallCount + 1);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ drawerSelection: 'all' }, wrapper.instance().makeUserRequest)).toBe(true);
        stateSpy.restore();
        makeRequestStub.restore();
    });

    it('componentWillReceiveProps should handle groups error', () => {
        const props = getProps();
        const showStub = sinon.stub(UserGroupsPage.prototype, 'showErrorDialog');
        const wrapper = getWrapper(props);
        wrapper.setProps({ groups: { ...props.groups, error: 'oh no an error' } });
        expect(showStub.calledOnce).toBe(true);
        expect(showStub.calledWith('oh no an error')).toBe(true);
        showStub.restore();
    });

    it('componentWillReceiveProps should handle users error', () => {
        const props = getProps();
        const showStub = sinon.stub(UserGroupsPage.prototype, 'showErrorDialog');
        const wrapper = getWrapper(props);
        wrapper.setProps({ users: { ...props.users, error: 'oh no an error' } });
        expect(showStub.calledOnce).toBe(true);
        expect(showStub.calledWith('oh no an error')).toBe(true);
        showStub.restore();
    });

    it('onDrawerIconMouseOver should set drawer hover to true', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().onDrawerIconMouseOver();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ drawerIconHover: true })).toBe(true);
        stateStub.restore();
    });

    it('onDrawerIconMouseOut should set drawer hover to false', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().onDrawerIconMouseOut();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ drawerIconHover: false })).toBe(true);
        stateStub.restore();
    });

    it('makeUserRequest should make the defualt request', () => {
        const props = getProps();
        props.getUsers = sinon.spy();
        const wrapper = getWrapper(props);
        const expectedParams = { ordering: 'user__username' };
        wrapper.instance().makeUserRequest();
        expect(props.getUsers.calledOnce).toBe(true);
        expect(props.getUsers.calledWith(expectedParams)).toBe(true);
    });

    it('makeUserRequest should request users with a search param', () => {
        const props = getProps();
        props.getUsers = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setState({ search: 'my-search' });
        const expectedParams = { ordering: 'user__username', search: 'my-search' };
        wrapper.instance().makeUserRequest();
        expect(props.getUsers.calledOnce).toBe(true);
        expect(props.getUsers.calledWith(expectedParams)).toBe(true);
    });

    it('makeUserRequest should request users joined in the past 2 weeks', () => {
        const props = getProps();
        props.getUsers = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setState({ drawerSelection: 'new' });
        const date = new Date();
        date.setDate(date.getDate() - 14);
        const dateString = date.toISOString().substring(0, 10);
        const expectedParams = { ordering: 'user__username', newer_than: dateString };
        wrapper.instance().makeUserRequest();
        expect(props.getUsers.calledOnce).toBe(true);
        expect(props.getUsers.calledWith(expectedParams)).toBe(true);
    });

    it('makeUserRequest should request users not in a group', () => {
        const props = getProps();
        props.getUsers = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setState({ drawerSelection: 'ungrouped' });
        const expectedParams = { ordering: 'user__username', ungrouped: true };
        wrapper.instance().makeUserRequest();
        expect(props.getUsers.calledOnce).toBe(true);
        expect(props.getUsers.calledWith(expectedParams)).toBe(true);
    });

    it('makeUserRequest should request users in a specific group', () => {
        const props = getProps();
        props.getUsers = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setState({ drawerSelection: 'group1' });
        const expectedParams = { ordering: 'user__username', group: 'group1' };
        wrapper.instance().makeUserRequest();
        expect(props.getUsers.calledOnce).toBe(true);
        expect(props.getUsers.calledWith(expectedParams)).toBe(true);
    });

    it('toggleDrawer should change the drawer state and set hover to false', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        const drawerState = wrapper.state().drawerOpen;
        wrapper.instance().toggleDrawer();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ drawerOpen: !drawerState, drawerIconHover: false })).toBe(true);
        stateStub.restore();
    });

    it('handleSelectAll should update state with user indices or with empty array', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        let expectedArray = props.users.users;
        wrapper.instance().handleSelectAll('all');
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ selectedUsers: expectedArray })).toBe(true);
        expectedArray = [];
        wrapper.instance().handleSelectAll();
        expect(stateStub.calledTwice).toBe(true);
        expect(stateStub.calledWith({ selectedUsers: expectedArray })).toBe(true);
        stateStub.restore();
    });

    it('handleIndividualSelect should set state with the selection', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        const selectedUsers = [props.users.users[1]];
        wrapper.instance().handleIndividualSelect([1]);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ selectedUsers })).toBe(true);
        stateStub.restore();
    });

    it('handleSearchKeyDown should set state with search text and make user request', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        const fakeEvent = { key: 'Enter', target: { value: 'search text' } };
        wrapper.instance().handleSearchKeyDown(fakeEvent);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ search: 'search text' }, wrapper.instance().makeUserRequest)).toBe(true);
        stateStub.restore();
    });

    it('handleSearchChange should clear search state if the input is empty', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const value = '';
        wrapper.setState({ search: 'search text' });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleSearchChange({}, value);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ search: '' }, wrapper.instance().makeUserRequest)).toBe(true);
        stateStub.restore();
    });

    it('handleSortChange should update state and makeUserRequest', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        const val = '-user__username';
        wrapper.instance().handleSortChange({}, 0, val);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ sort: val }, wrapper.instance().makeUserRequest)).toBe(true);
        stateStub.restore();
    });

    it('handleCreateOpen shoudl set showCreate to true', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleCreateOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showCreate: true })).toBe(true);
        stateStub.restore();
    });

    it('handleCreateClose should set showCreate to false and input to empty str', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleCreateClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showCreate: false, createInput: '' })).toBe(true);
        stateStub.restore();
    });

    it('handleCreateInput should set createInput state', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        const val = 'create name';
        wrapper.instance().handleCreateInput({}, val);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ createInput: val })).toBe(true);
        stateStub.restore();
    });

    it('handleCreateSave should call createGroup with state values and call create close', () => {
        const props = getProps();
        props.createGroup = sinon.spy();
        const closeStub = sinon.stub(UserGroupsPage.prototype, 'handleCreateClose');
        const wrapper = getWrapper(props);
        wrapper.setState({ createInput: 'input', createUsers: [props.users.users[0]] });
        wrapper.instance().handleCreateSave();
        expect(props.createGroup.calledOnce).toBe(true);
        expect(props.createGroup.calledWith('input', ['user1'])).toBe(true);
        expect(closeStub.calledOnce).toBe(true);
        closeStub.restore();
    });

    it('handleNewGroupClick should set creatUsers state and call create open', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const openStub = sinon.stub(UserGroupsPage.prototype, 'handleCreateOpen');
        const wrapper = getWrapper(props);
        const users = [props.users.users[0]];
        wrapper.instance().handleNewGroupClick(users);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ createUsers: users })).toBe(true);
        expect(openStub.calledOnce).toBe(true);
        openStub.restore();
        stateStub.restore();
    });

    it('handleSingleUserChange should check if the user is being added and call addUsers', () => {
        const props = getProps();
        props.addUsers = sinon.spy();
        const group = props.groups.groups[2];
        const user = props.users.users[0];
        const wrapper = getWrapper(props);
        wrapper.instance().handleSingleUserChange(group, user);
        expect(props.addUsers.calledOnce).toBe(true);
        expect(props.addUsers.calledWith(group, [user.username])).toBe(true);
    });

    it('handleSingleUserChange should check if user is being removed and call removeUsers', () => {
        const props = getProps();
        props.removeUsers = sinon.spy();
        const group = props.groups.groups[0];
        const user = props.users.users[0];
        const wrapper = getWrapper(props);
        wrapper.instance().handleSingleUserChange(group, user);
        expect(props.removeUsers.calledOnce).toBe(true);
        expect(props.removeUsers.calledWith(group, [user.username])).toBe(true);
    });

    it('handleMultiUserChange should return if no users', () => {
        const props = getProps();
        props.removeUsers = sinon.spy();
        props.addUsers = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleMultiUserChange();
        expect(props.removeUsers.called).toBe(false);
        expect(props.addUsers.called).toBe(false);
    });

    it('handleMultiUserChange should remove users', () => {
        const props = getProps();
        props.removeUsers = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setState({ selectedUsers: [props.users.users[1]] });
        wrapper.instance().handleMultiUserChange(props.groups.groups[2]);
        expect(props.removeUsers.calledOnce).toBe(true);
        expect(props.removeUsers.calledWith(props.groups.groups[2], ['user2']));
    });

    it('handleMultiUserChange should add users', () => {
        const props = getProps();
        props.addUsers = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setState({ selectedUsers: [props.users.users[0]] });
        wrapper.instance().handleMultiUserChange(props.groups.groups[2]);
        expect(props.addUsers.calledOnce).toBe(true);
        expect(props.addUsers.calledWith(props.groups.groups[2], ['user1'])).toBe(true);
    });

    it('handleLeaveGroupClick should set targetGroup and call leave open', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const openStub = sinon.stub(UserGroupsPage.prototype, 'handleLeaveOpen');
        const wrapper = getWrapper(props);
        wrapper.instance().handleLeaveGroupClick(props.groups.groups[0]);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ targetGroup: props.groups.groups[0] })).toBe(true);
        expect(openStub.calledOnce).toBe(true);
        openStub.restore();
        stateStub.restore();
    });

    it('handleDeleteGroupClick should set targetGroup and call delete open', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const openStub = sinon.stub(UserGroupsPage.prototype, 'handleDeleteOpen');
        const wrapper = getWrapper(props);
        wrapper.instance().handleDeleteGroupClick(props.groups.groups[0]);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ targetGroup: props.groups.groups[0] })).toBe(true);
        expect(openStub.calledOnce).toBe(true);
        openStub.restore();
        stateStub.restore();
    });

    it('handleLeaveOpen should set showLeave to true', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleLeaveOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showLeave: true })).toBe(true);
        stateStub.restore();
    });

    it('handleLeaveClose should set showLeave to false', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleLeaveClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showLeave: false })).toBe(true);
        stateStub.restore();
    });

    it('handleLeaveClick should call remove user with state/prop values and handleLeaveClose', () => {
        const props = getProps();
        props.removeUsers = sinon.spy();
        const closeStub = sinon.stub(UserGroupsPage.prototype, 'handleLeaveClose');
        const wrapper = getWrapper(props);
        const targetGroup = 'group2';
        const usernames = [props.user.username];
        wrapper.setState({ targetGroup });
        wrapper.instance().handleLeaveClick();
        expect(props.removeUsers.calledOnce).toBe(true);
        expect(props.removeUsers.calledWith(targetGroup, usernames)).toBe(true);
        expect(closeStub.calledOnce).toBe(true);
        closeStub.restore();
    });

    it('handleDeleteOpen should set showDelete to true', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleDeleteOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showDelete: true })).toBe(true);
        stateStub.restore();
    });

    it('handleDeleteClose should set showDelete to false', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleDeleteClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showDelete: false })).toBe(true);
        stateStub.restore();
    });

    it('handleDeleteClick should call deleteGroup and handleDeleteClose', () => {
        const props = getProps();
        props.deleteGroup = sinon.spy();
        const closeStub = sinon.stub(UserGroupsPage.prototype, 'handleDeleteClose');
        const group = props.groups.groups[0];
        const wrapper = getWrapper(props);
        wrapper.setState({ targetGroup: group });
        wrapper.instance().handleDeleteClick();
        expect(props.deleteGroup.calledOnce).toBe(true);
        expect(props.deleteGroup.calledWith(group.id));
        expect(closeStub.calledOnce).toBe(true);
        closeStub.restore();
    });

    it('handleDrawerSelectionChange should ignore path or svg elements', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        const fakeEvent = {
            target: { tagName: 'SVG' },
        };
        const fakeValue = 'something';
        wrapper.instance().handleDrawerSelectionChange(fakeEvent, fakeValue);
        expect(stateStub.called).toBe(false);
        stateStub.restore();
    });

    it('handleDrawerSelectionChange should set state and make user request', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        const fakeEvent = {
            target: { tagName: 'div' },
        };
        const fakeValue = 'new selection';
        wrapper.instance().handleDrawerSelectionChange(fakeEvent, fakeValue);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ drawerSelection: fakeValue }, wrapper.instance().makeUserRequest)).toBe(true);
        stateStub.restore();
    });

    it('showErrorDialog should set state with error message', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        const message = 'oh no an error';
        wrapper.instance().showErrorDialog(message);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ errorMessage: message })).toBe(true);
        stateStub.restore();
    });

    it('hideErrorDialog should set state with empty string', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().hideErrorDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ errorMessage: '' })).toBe(true);
        stateStub.restore();
    });

    it('showSharedInfoDialog should set show to true', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().showSharedInfoDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showSharedInfo: true })).toBe(true);
        stateStub.restore();
    });

    it('hideSharedInfoDialog should set show to false', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().hideSharedInfoDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showSharedInfo: false })).toBe(true);
        stateStub.restore();
    });

    it('showPageInfoDialog should set show to true', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().showPageInfoDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showPageInfo: true })).toBe(true);
        stateStub.restore();
    });

    it('hidePageInfoDialog should set show to false', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().hidePageInfoDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showPageInfo: false })).toBe(true);
        stateStub.restore();
    });
});
