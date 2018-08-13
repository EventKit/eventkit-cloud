import PropTypes from 'prop-types';
import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { browserHistory } from 'react-router';
import Joyride from 'react-joyride';
import Help from 'material-ui/svg-icons/action/help';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import GroupsDrawer from '../../components/UserGroupsPage/GroupsDrawer';
import CreateGroupDialog from '../../components/UserGroupsPage/Dialogs/CreateGroupDialog';
import LeaveGroupDialog from '../../components/UserGroupsPage/Dialogs/LeaveGroupDialog';
import DeleteGroupDialog from '../../components/UserGroupsPage/Dialogs/DeleteGroupDialog';
import BaseDialog from '../../components/Dialog/BaseDialog';
import UserRow from '../../components/UserGroupsPage/UserRow';
import OwnUserRow from '../../components/UserGroupsPage/OwnUserRow';
import UserHeader from '../../components/UserGroupsPage/UserHeader';
import { UserGroupsPage } from '../../components/UserGroupsPage/UserGroupsPage';
import * as viewport from '../../utils/viewport';

describe('UserGroupsPage component', () => {
    const muiTheme = getMuiTheme();

    const getProps = () => (
        {
            location: {
                query: { ordering: 'admin' },
            },
            user: {
                username: 'user_one',
                first_name: 'user',
                last_name: 'one',
                email: 'user.one@email.com',
            },
            groups: {
                groups: [
                    {
                        name: 'group1',
                        id: 1,
                        administrators: ['user_one'],
                        members: ['user_one', 'user_two'],
                    },
                    {
                        name: 'group2',
                        id: 2,
                        administrators: ['user_two'],
                        members: ['user_one', 'user_two'],
                    },
                    {
                        name: 'group3',
                        id: 3,
                        administrators: ['user_two'],
                        members: ['user_two'],
                    },
                ],
                cancelSource: null,
                fetching: false,
                fetched: false,
                creating: false,
                created: false,
                deleting: false,
                deleted: false,
                updating: false,
                updated: false,
                error: null,
            },
            users: {
                users: [
                    {
                        user: {
                            username: 'user_one',
                            first_name: 'user',
                            last_name: 'one',
                            email: 'user.one@email.com',
                        },
                        groups: [1, 2],
                    },
                    {
                        user: {
                            username: 'user_two',
                            first_name: 'user',
                            last_name: 'two',
                            email: 'user.two@email.com',
                        },
                        groups: [1, 2, 3],
                    },
                    {
                        user: {
                            username: 'user_three',
                            first_name: 'user',
                            last_name: 'three',
                            email: 'user.three@email.com',
                        },
                        groups: [2, 3],
                    },
                ],
                fetching: false,
                fetched: false,
                error: null,
                total: 0,
            },
            getGroups: () => {},
            deleteGroup: () => {},
            createGroup: () => {},
            updateGroup: () => {},
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
        sinon.stub(browserHistory, 'push');
    });

    afterAll(() => {
        UserGroupsPage.prototype.componentDidMount.restore();
        browserHistory.push.restore();
    });

    it('should render its basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-UserGroupsPage-AppBar').hostNodes()).toHaveLength(1);
        expect(wrapper.find('.qa-UserGroupsPage-RaisedButton-create').hostNodes()).toHaveLength(1);
        expect(wrapper.find('.qa-UserGroupsPage-CustomScrollbar').hostNodes()).toHaveLength(1);
        expect(wrapper.find('.qa-UserGroupsPage-search').hostNodes()).toHaveLength(1);
        expect(wrapper.find(UserHeader)).toHaveLength(1);
        expect(wrapper.find(OwnUserRow)).toHaveLength(1);
        expect(wrapper.find(UserRow)).toHaveLength(2);
        expect(wrapper.find(GroupsDrawer)).toHaveLength(1);
        expect(wrapper.find(CreateGroupDialog)).toHaveLength(1);
        expect(wrapper.find(LeaveGroupDialog)).toHaveLength(1);
        expect(wrapper.find(DeleteGroupDialog)).toHaveLength(1);
        expect(wrapper.find(BaseDialog)).toHaveLength(6);
        expect(wrapper.find(Joyride)).toHaveLength(1);
        expect(wrapper.find(Help)).toHaveLength(1);
    });

    it('componentDidMount should call makeUserRequest, getGroups and joyrideAddSteps', () => {
        const props = getProps();
        props.getGroups = sinon.spy();
        const makeRequestStub = sinon.stub(UserGroupsPage.prototype, 'makeUserRequest');
        const joyrideStub = sinon.stub(UserGroupsPage.prototype, 'joyrideAddSteps');
        // we stub componentDidMount before all tests, so temporarily undo it
        UserGroupsPage.prototype.componentDidMount.restore();
        getWrapper(props);
        expect(props.getGroups.calledOnce).toBe(true);
        expect(makeRequestStub.calledOnce).toBe(true);
        expect(joyrideStub.calledOnce).toBe(true);
        makeRequestStub.restore();
        joyrideStub.restore();
        // re-stub it since afterAll will restore it when tests are finished
        sinon.stub(UserGroupsPage.prototype, 'componentDidMount');
    });

    it('componentWillReceiveProps should handle a query change', () => {
        const props = getProps();
        props.location.query = { ordering: 'username', group: '2' };
        const requestStub = sinon.stub(UserGroupsPage.prototype, 'makeUserRequest');
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        nextProps.location.query = { ordering: 'username', group: '1' };
        wrapper.setProps(nextProps);
        expect(requestStub.calledOnce).toBe(true);
        expect(requestStub.calledWith(nextProps.location.query)).toBe(true);
        const lastProps = getProps();
        lastProps.location.query = { ordering: 'username' };
        wrapper.setProps(lastProps);
        expect(requestStub.calledTwice).toBe(true);
        expect(requestStub.calledWith(lastProps.location.query)).toBe(true);
        requestStub.restore();
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

    it('componentWillReceiveProps should handle updated', () => {
        const props = getProps();
        props.getGroups = sinon.spy();
        const makeRequestStub = sinon.stub(UserGroupsPage.prototype, 'makeUserRequest');
        const wrapper = getWrapper(props);
        const groupsCallCount = props.getGroups.callCount;
        const userCallCount = makeRequestStub.callCount;
        wrapper.setProps({ groups: { ...props.groups, updated: true } });
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
        wrapper.setState({ createUsers: ['user_one'] });
        wrapper.setProps({ groups: { ...props.groups, created: true } });
        expect(props.getGroups.callCount).toEqual(groupsCallCount + 1);
        expect(makeRequestStub.callCount).toEqual(userCallCount + 1);
        expect(stateSpy.calledWith({ createUsers: [] }));
        makeRequestStub.restore();
        stateSpy.restore();
    });

    it('componentWillReceiveProps should handle deleted', () => {
        const props = getProps();
        props.location.query = { groups: '12' };
        props.getGroups = sinon.spy();
        const makeRequestStub = sinon.stub(UserGroupsPage.prototype, 'makeUserRequest');
        const wrapper = getWrapper(props);
        browserHistory.push.reset();
        const groupsCallCount = props.getGroups.callCount;
        wrapper.setProps({ groups: { ...props.groups, deleted: true } });
        expect(props.getGroups.callCount).toEqual(groupsCallCount + 1);
        expect(browserHistory.push.calledOnce).toBe(true);
        expect(browserHistory.push.calledWith({ ...props.location, query: {} }));
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

    it('getQueryGroup should return null if there is no query group found', () => {
        const props = getProps();
        props.location.query = { ordering: 'username' };
        const wrapper = getWrapper(props);
        expect(wrapper.instance().getQueryGroup()).toBe(null);
    });

    it('getQueryGroup should return the correct group object', () => {
        const props = getProps();
        props.location.query = { ordering: 'username', groups: String(props.groups.groups[0].id) };
        const wrapper = getWrapper(props);
        expect(wrapper.instance().getQueryGroup()).toEqual(props.groups.groups[0]);
    });

    it('getGroupTitle should return "All Members"', () => {
        const props = getProps();
        props.location.query = { ordering: 'username' };
        const wrapper = getWrapper(props);
        expect(wrapper.instance().getGroupTitle()).toEqual('All Members');
    });

    it('getGroupTitle should return "No Members Matching Group Found"', () => {
        const props = getProps();
        props.location.query = { groups: 'some group' };
        const wrapper = getWrapper(props);
        expect(wrapper.instance().getGroupTitle()).toEqual('No Members Matching Group Found');
    });

    it('getGroupTitle should return the group name', () => {
        const props = getProps();
        props.location.query = { groups: String(props.groups.groups[0]) };
        const wrapper = getWrapper(props);
        expect(wrapper.instance().getGroupTitle(props.groups.groups[0]))
            .toEqual(`${props.groups.groups[0].name} Members`);
    });

    it('makeUserRequest should make the default request', () => {
        const props = getProps();
        props.location.query = {};
        props.getUsers = sinon.spy();
        const wrapper = getWrapper(props);
        const expectedParams = { ordering: 'username' };
        wrapper.instance().makeUserRequest();
        expect(props.getUsers.calledOnce).toBe(true);
        expect(props.getUsers.calledWith(expectedParams)).toBe(true);
    });

    it('makeUserRequest should request users with a search param', () => {
        const props = getProps();
        props.location.query = { ordering: 'username', search: 'my-search' };
        props.getUsers = sinon.spy();
        const wrapper = getWrapper(props);
        const expectedParams = { ordering: 'username', search: 'my-search' };
        wrapper.instance().makeUserRequest();
        expect(props.getUsers.calledOnce).toBe(true);
        expect(props.getUsers.calledWith(expectedParams)).toBe(true);
    });

    it('makeUserRequest should request users in a specific group', () => {
        const props = getProps();
        props.location.query = { groups: 2 };
        props.getUsers = sinon.spy();
        const wrapper = getWrapper(props);
        const expectedParams = { groups: 2, ordering: 'username' };
        wrapper.instance().makeUserRequest();
        expect(props.getUsers.calledOnce).toBe(true);
        expect(props.getUsers.calledWith(expectedParams)).toBe(true);
    });

    it('toggleDrawer should change the drawer state', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        const drawerState = wrapper.state().drawerOpen;
        wrapper.instance().toggleDrawer();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ drawerOpen: !drawerState })).toBe(true);
        stateStub.restore();
    });

    it('handleSelectAll should update state with user indices or with empty array', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        let expectedArray = props.users.users.filter(user => user.user.username !== props.user.username);
        wrapper.instance().handleSelectAll(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ selectedUsers: expectedArray })).toBe(true);
        expectedArray = [];
        wrapper.instance().handleSelectAll(false);
        expect(stateStub.calledTwice).toBe(true);
        expect(stateStub.calledWith({ selectedUsers: expectedArray })).toBe(true);
        stateStub.restore();
    });

    it('handleUserSelect should remove the user from selection', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const selection = props.users.users;
        wrapper.setState({ selectedUsers: selection });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleUserSelect(props.users.users[0]);
        const [, ...expectedUsers] = props.users.users;
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ selectedUsers: expectedUsers })).toBe(true);
        stateStub.restore();
    });

    it('handleUserSelect should add the user to the selection', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const selection = props.users.users;
        wrapper.setState({ selectedUsers: selection });
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const newUser = { user: { username: 'new' } };
        wrapper.instance().handleUserSelect(newUser);
        const expectedUsers = [...selection, newUser];
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ selectedUsers: expectedUsers }));
    });

    it('handleSearchKeyDown should set query with search text', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        browserHistory.push.reset();
        const fakeEvent = { key: 'Enter', target: { value: 'search text' } };
        wrapper.instance().handleSearchKeyDown(fakeEvent);
        expect(browserHistory.push.calledOnce).toBe(true);
        expect(browserHistory.push.calledWith({
            ...props.location,
            query: { ...props.location.query, search: 'search text' },
        })).toBe(true);
    });

    it('handleSearchChange should clear search query if the input is empty', () => {
        const props = getProps();
        props.location.query = { ordering: 'admin', search: 'search text' };
        const wrapper = getWrapper(props);
        browserHistory.push.reset();
        const value = '';
        wrapper.instance().handleSearchChange({}, value);
        expect(browserHistory.push.calledOnce).toBe(true);
        expect(browserHistory.push.calledWith({
            ...props.location,
            query: { ordering: 'admin' },
        })).toBe(true);
    });

    it('handleOrderingChange should update the ordering query', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        browserHistory.push.reset();
        const val = '-username';
        wrapper.instance().handleOrderingChange({}, val);
        expect(browserHistory.push.calledOnce).toBe(true);
        expect(browserHistory.push.calledWith({
            ...props.location,
            query: { ...props.location.query, ordering: val },
        }));
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
        expect(props.createGroup.calledWith('input', ['user_one'])).toBe(true);
        expect(closeStub.calledOnce).toBe(true);
        closeStub.restore();
    });

    it('handleRenameOpen should set open and the targetGroup', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        const group = { id: 1 };
        wrapper.instance().handleRenameOpen(group);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showRename: true, targetGroup: group }));
        stateStub.restore();
    });

    it('handleRenameClose should set closed and clear input and target group', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleRenameClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showRename: false, renameInput: '', targetGroup: null }));
        stateStub.restore();
    });

    it('handleRenameInput should set the input state', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().handleRenameInput({}, 'test');
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ renameInput: 'test' })).toBe(true);
        stateStub.restore();
    });

    it('handleRenameSave should call updateGroup and renameClose', () => {
        const props = getProps();
        props.updateGroup = sinon.spy();
        const closeStub = sinon.stub(UserGroupsPage.prototype, 'handleRenameClose');
        const group = { id: 1 };
        const input = 'test input';
        const wrapper = getWrapper(props);
        wrapper.setState({ targetGroup: group, renameInput: input });
        wrapper.instance().handleRenameSave();
        expect(props.updateGroup.calledOnce).toBe(true);
        expect(props.updateGroup.calledWith(group.id, { name: input })).toBe(true);
        expect(closeStub.calledOnce).toBe(true);
        closeStub.restore();
    });

    it('handleNewGroup should set creatUsers state and call create open', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const openStub = sinon.stub(UserGroupsPage.prototype, 'handleCreateOpen');
        const wrapper = getWrapper(props);
        const users = [props.users.users[0]];
        wrapper.instance().handleNewGroup(users);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ createUsers: users })).toBe(true);
        expect(openStub.calledOnce).toBe(true);
        openStub.restore();
        stateStub.restore();
    });

    it('handleAddUsers should set state and show Add dialog', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const openStub = sinon.stub(wrapper.instance(), 'showAddUsersDialog');
        const { users } = props.users;
        wrapper.instance().handleAddUsers(users);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ addUsers: users })).toBe(true);
        expect(openStub.calledOnce).toBe(true);
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

    it('handleLeaveClick should call updateGroup and leaveClose', () => {
        const props = getProps();
        props.updateGroup = sinon.spy();
        const closeStub = sinon.stub(UserGroupsPage.prototype, 'handleLeaveClose');
        const wrapper = getWrapper(props);
        const targetGroup = props.groups.groups[0];
        wrapper.setState({ targetGroup });
        wrapper.instance().handleLeaveClick();
        expect(props.updateGroup.calledOnce).toBe(true);
        expect(props.updateGroup.calledWith(targetGroup.id)).toBe(true);
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
        const wrapper = getWrapper(props);
        browserHistory.push.reset();
        const fakeEvent = {
            target: { tagName: 'SVG' },
        };
        const fakeValue = 'something';
        wrapper.instance().handleDrawerSelectionChange(fakeEvent, fakeValue);
        expect(browserHistory.push.called).toBe(false);
    });

    it('handleDrawerSelectionChange should clear the group query', () => {
        const props = getProps();
        props.location.query = { groups: '12' };
        const wrapper = getWrapper(props);
        browserHistory.push.reset();
        const fakeEvent = {
            target: { tagName: 'div' },
        };
        const fakeValue = 'all';
        wrapper.instance().handleDrawerSelectionChange(fakeEvent, fakeValue);
        expect(browserHistory.push.calledOnce).toBe(true);
        expect(browserHistory.push.calledWith({
            ...props.location,
            query: {},
        }));
    });

    it('handleDrawerSelectionChange should set the group query', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        browserHistory.push.reset();
        const fakeEvent = {
            target: { tagName: 'div' },
        };
        const fakeValue = '12';
        wrapper.instance().handleDrawerSelectionChange(fakeEvent, fakeValue);
        expect(browserHistory.push.calledOnce).toBe(true);
        expect(browserHistory.push.calledWith({
            ...props.location,
            query: { ...props.location.query, groups: fakeValue },
        }));
    });

    it('handleMakeAdmin should add the user to group admins and call updateGroup', () => {
        const props = getProps();
        props.updateGroup = sinon.spy();
        const wrapper = getWrapper(props);
        sinon.stub(wrapper.instance(), 'getQueryGroup').returns(props.groups.groups[0]);
        const newUser = { user: { username: 'new user' } };
        const groupId = props.groups.groups[0].id;
        const expectedAdmins = [...props.groups.groups[0].administrators, newUser.user.username];
        wrapper.instance().handleMakeAdmin(newUser);
        expect(props.updateGroup.calledOnce).toBe(true);
        expect(props.updateGroup.calledWith(groupId, { administrators: expectedAdmins })).toBe(true);
    });

    it('handleDemoteAdmin should remove the user from the group admins and call updateGroup', () => {
        const props = getProps();
        props.groups.groups[0].administrators.push('new user');
        props.updateGroup = sinon.spy();
        const wrapper = getWrapper(props);
        sinon.stub(wrapper.instance(), 'getQueryGroup').returns(props.groups.groups[0]);
        const newUser = { user: { username: 'new user' } };
        const groupId = props.groups.groups[0].id;
        const expectedAdmins = [...props.groups.groups[0].administrators];
        expectedAdmins.splice(-1, 1);
        wrapper.instance().handleDemoteAdmin(newUser);
        expect(props.updateGroup.calledOnce).toBe(true);
        expect(props.updateGroup.calledWith(groupId, { administrators: expectedAdmins })).toBe(true);
    });

    it('handleRemoveUser should not updateGroup if no queryGroup is found', () => {
        const props = getProps();
        props.updateGroup = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleRemoveUser();
        expect(props.updateGroup.called).toBe(false);
    });

    it('handleRemoveUser should update the group with user removed', () => {
        const props = getProps();
        props.location.query = { groups: '1' };
        props.updateGroup = sinon.spy();
        const wrapper = getWrapper(props);
        const user = props.users.users[0];
        wrapper.instance().handleRemoveUser(user);
        expect(props.updateGroup.calledOnce).toBe(true);
        expect(props.updateGroup.calledWith(1)).toBe(true);
    });

    it('handleBatchRemoveUser should not update group if no query group is found', () => {
        const props = getProps();
        props.updateGroup = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleBatchRemoveUser();
        expect(props.updateGroup.called).toBe(false);
    });

    it('handleBatchRemoveUser should remove users and updateGroup', () => {
        const props = getProps();
        const group = {
            id: 12,
            name: 'twelve',
            members: ['1', '2', '3'],
            administrators: ['1', '2', '3'],
        };
        props.location.query = { groups: '12' };
        props.groups.groups.push(group);
        props.updateGroup = sinon.spy();
        const wrapper = getWrapper(props);
        const users = [
            { user: { username: '1' } },
            { user: { username: '2' } },
        ];
        wrapper.instance().handleBatchRemoveUser(users);
        expect(props.updateGroup.calledOnce).toBe(true);
        expect(props.updateGroup.calledWith(group.id, {
            members: ['3'],
            administrators: ['3'],
        })).toBe(true);
    });

    it('handleBatchAdminRights should not updateGroup if there is no queryGroup', () => {
        const props = getProps();
        props.updateGroup = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().handleBatchAdminRights();
        expect(props.updateGroup.called).toBe(false);
    });

    it('handleBatchAdminRights should update group with new admins', () => {
        const props = getProps();
        props.updateGroup = sinon.spy();
        props.location.query = { groups: String(props.groups.groups[0].id) };
        const users = [
            { user: { username: '1' } },
            { user: { username: '2' } },
        ];
        const wrapper = getWrapper(props);
        wrapper.instance().handleBatchAdminRights(users);
        const expectedAdmins = [...props.groups.groups[0].administrators, '1', '2'];
        expect(props.updateGroup.calledOnce).toBe(true);
        expect(props.updateGroup.calledWith(props.groups.groups[0].id, {
            administrators: expectedAdmins,
        })).toBe(true);
    });

    it('handleBatchAdminRighs should update group with removed admins', () => {
        const props = getProps();
        props.updateGroup = sinon.spy();
        props.location.query = { groups: String(props.groups.groups[0].id) };
        const users = [{ user: { username: 'user_one' } }];
        const wrapper = getWrapper(props);
        wrapper.instance().handleBatchAdminRights(users);
        expect(props.updateGroup.calledOnce).toBe(true);
        expect(props.updateGroup.calledWith(props.groups.groups[0].id, { administrators: [] })).toBe(true);
    });

    it('handleAddUsersSave should hide the dialog and update each group with new members', () => {
        const props = getProps();
        props.updateGroup = sinon.spy();
        const groups = [
            { id: 0, members: [] },
            { id: 1, members: [] },
        ];
        const users = [
            { user: { username: '1' } },
            { user: { username: '2' } },
        ];
        const wrapper = getWrapper(props);
        const hideStub = sinon.stub(wrapper.instance(), 'hideAddUsersDialog');
        wrapper.instance().handleAddUsersSave(groups, users);
        expect(hideStub.calledOnce).toBe(true);
        expect(props.updateGroup.calledTwice).toBe(true);
        expect(props.updateGroup.calledWith(groups[0].id, { members: ['1', '2'] })).toBe(true);
        expect(props.updateGroup.calledWith(groups[1].id, { members: ['1', '2'] })).toBe(true);
        hideStub.restore();
    });

    it('showAddUsersDialog should set state true', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().showAddUsersDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showAddUsers: true })).toBe(true);
    });

    it('hideAddUsersDialog should set state false', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().hideAddUsersDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showAddUsers: false })).toBe(true);
    });

    it('showErrorDialog should set state with errors', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        const message = { errors: [{ detail: 'an error' }] };
        wrapper.instance().showErrorDialog(message);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ errors: message.errors })).toBe(true);
        stateStub.restore();
    });

    it('hideErrorDialog should set state with empty string', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().hideErrorDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ errors: [] })).toBe(true);
        stateStub.restore();
    });

    it('showAdministratorInfoDialog should set show to true', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().showAdministratorInfoDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showAdministratorInfo: true })).toBe(true);
        stateStub.restore();
    });

    it('hideAdministratorInfoDialog should set show to false', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().hideAdministratorInfoDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showAdministratorInfo: false })).toBe(true);
        stateStub.restore();
    });

    it('showMemberInfoDialog should set show to true', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().showMemberInfoDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showMemberInfo: true })).toBe(true);
        stateStub.restore();
    });

    it('hideMemberInfoDialog should set show to false', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().hideMemberInfoDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showMemberInfo: false })).toBe(true);
        stateStub.restore();
    });

    it('showOtherInfoDialog should set show to true', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().showOtherInfoDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showOtherInfo: true })).toBe(true);
        stateStub.restore();
    });

    it('hideOtherInfoDialog should set show to false', () => {
        const props = getProps();
        const stateStub = sinon.stub(UserGroupsPage.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().hideOtherInfoDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showOtherInfo: false })).toBe(true);
        stateStub.restore();
    });

    it('joyrideAddSteps should set state for steps in tour', () => {
        const steps = [{
            title: 'Welcome to the Account Settings Page',
            text: 'Example text',
            selector: '.qa-Account-AppBar',
            position: 'top',
            style: {},
            isFixed: true,
        }];
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = sinon.stub(UserGroupsPage.prototype, 'setState');
        wrapper.instance().joyrideAddSteps(steps);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ steps }));
        stateSpy.restore();
    });

    it('handleJoyride should set state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = sinon.stub(UserGroupsPage.prototype, 'setState');
        wrapper.instance().handleJoyride();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ isRunning: false }));
        stateSpy.restore();
    });

    it('callback function should stop tour if close is clicked', () => {
        const callbackData = {
            action: 'close',
            index: 2,
            step: {
                position: 'bottom',
                selector: '.qa-Application-MenuItem-create',
                style: {},
                text: 'Or to create your own DataPack.',
                title: 'Navigate Application',
            },
            type: 'step:before',
        };
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = sinon.stub(UserGroupsPage.prototype, 'setState');
        wrapper.instance().callback(callbackData);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ isRunning: false }));
        stateSpy.restore();
    });

    it('callback function should toggle drawer', () => {
        const data = {
            action: 'next',
            index: 2,
            step: {
                selector: '.qa-GroupsDrawer-addGroup',
            },
            type: 'step:fake',
        };
        const viewStub = sinon.stub(viewport, 'isViewportS').returns(true);
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.setState({ drawerOpen: false });
        const toggleStub = sinon.stub(wrapper.instance(), 'toggleDrawer').returns(Promise.resolve(true));
        wrapper.instance().callback(data);
        expect(viewStub.called).toBe(true);
        expect(toggleStub.calledOnce).toBe(true);
        viewStub.restore();
        toggleStub.restore();
    });

    it('callback should scroll to top', () => {
        const data = {
            action: 'next',
            index: 2,
            step: {
                selector: '.qa-GroupsDrawer-groupsHeading',
            },
            type: 'step:before',
        };
        const props = getProps();
        const wrapper = getWrapper(props);
        const scrollStub = sinon.stub(wrapper.instance().scrollbar, 'scrollToTop');
        wrapper.instance().callback(data);
        expect(scrollStub.calledOnce).toBe(true);
    });

    it('callback should toggleDrawer and setState', () => {
        const data = {
            action: 'next',
            index: 2,
            step: {
                selector: '.qa-GroupsDrawer-groupsHeading',
            },
            type: 'step:after',
        };
        const viewStub = sinon.stub(viewport, 'isViewportS').returns(true);
        const props = getProps();
        const wrapper = getWrapper(props);
        const toggleStub = sinon.stub(wrapper.instance(), 'toggleDrawer');
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().callback(data);
        expect(viewStub.called).toBe(true);
        expect(toggleStub.calledOnce).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ stepIndex: 3 }));
        viewStub.restore();
    });

    it('callback should selectAll', () => {
        const data = {
            action: 'next',
            index: 2,
            step: {
                selector: '.qa-UserHeader-checkbox',
            },
            type: 'tooltip:before',
        };
        const props = getProps();
        const wrapper = getWrapper(props);
        const selectStub = sinon.stub(wrapper.instance(), 'handleSelectAll');
        wrapper.instance().callback(data);
        expect(selectStub.calledOnce).toBe(true);
        expect(selectStub.calledWith(true)).toBe(true);
    });

    it('callback should toggle drawer again', () => {
        const data = {
            action: 'next',
            index: 2,
            step: {
                selector: '.qa-UserHeader-IconButton-options',
            },
            type: 'step:after',
        };
        const props = getProps();
        const wrapper = getWrapper(props);
        const toggleStub = sinon.stub(wrapper.instance(), 'toggleDrawer').returns(Promise.resolve(true));
        wrapper.instance().callback(data);
        expect(toggleStub.calledOnce).toBe(true);
        toggleStub.restore();
    });
});
