import * as React from 'react';
import { createShallow } from '@material-ui/core/test-utils';
import * as sinon from 'sinon';
import { browserHistory } from 'react-router';
import Joyride from 'react-joyride';
import Help from '@material-ui/icons/Help';
import GroupsDrawer from '../../components/UserGroupsPage/GroupsDrawer';
import CreateGroupDialog from '../../components/UserGroupsPage/Dialogs/CreateGroupDialog';
import LeaveGroupDialog from '../../components/UserGroupsPage/Dialogs/LeaveGroupDialog';
import DeleteGroupDialog from '../../components/UserGroupsPage/Dialogs/DeleteGroupDialog';
import BaseDialog from '../../components/Dialog/BaseDialog';
import UserRow from '../../components/UserGroupsPage/UserRow';
import OwnUserRow from '../../components/UserGroupsPage/OwnUserRow';
import UserHeader from '../../components/UserGroupsPage/UserHeader';
import { UserGroupsPage } from '../../components/UserGroupsPage/UserGroupsPage';

describe('UserGroupsPage component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getProps = () => ({
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
        getGroups: sinon.spy(),
        deleteGroup: sinon.spy(),
        createGroup: sinon.spy(),
        updateGroup: sinon.spy(),
        getUsers: sinon.spy(),
        ...(global as any).eventkit_test_props,
        classes: {},
    });

    const config = { USER_GROUPS_PAGE_SIZE: '20' };

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<UserGroupsPage {...props} />, {
            context: { config },
        });
        instance = wrapper.instance();
    };

    let history;
    beforeAll(() => {
        history = sinon.stub(browserHistory, 'push');
    });

    beforeEach(setup);

    afterAll(() => {
        history.restore();
    });

    it('should render its basic components', () => {
        expect(wrapper.find('.qa-UserGroupsPage-Button-create')).toHaveLength(1);
        expect(wrapper.find('.qa-UserGroupsPage-CustomScrollbar')).toHaveLength(1);
        expect(wrapper.find('.qa-UserGroupsPage-search')).toHaveLength(1);
        expect(wrapper.find(UserHeader)).toHaveLength(1);
        expect(wrapper.find(OwnUserRow)).toHaveLength(1);
        expect(wrapper.find(UserRow)).toHaveLength(2);
        expect(wrapper.find(GroupsDrawer)).toHaveLength(1);
        expect(wrapper.find(CreateGroupDialog)).toHaveLength(1);
        expect(wrapper.find(LeaveGroupDialog)).toHaveLength(1);
        expect(wrapper.find(DeleteGroupDialog)).toHaveLength(1);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find(Joyride)).toHaveLength(1);
        expect(wrapper.find(Help)).toHaveLength(1);
    });

    it('componentDidMount should call makeUserRequest, getGroups and joyrideAddSteps', () => {
        const makeRequestStub = sinon.stub(UserGroupsPage.prototype, 'makeUserRequest');
        const joyrideStub = sinon.stub(UserGroupsPage.prototype, 'joyrideAddSteps');
        setup();
        expect(props.getGroups.calledOnce).toBe(true);
        expect(makeRequestStub.calledOnce).toBe(true);
        expect(joyrideStub.calledOnce).toBe(true);
        makeRequestStub.restore();
        joyrideStub.restore();
    });

    it('componentDidUpdate should handle a query change', () => {
        setup({ location: { query: { ordering: 'username', group: '2' } } });
        const requestStub = sinon.stub(instance, 'makeUserRequest');
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

    it('componentDidUpdate should handle users fetched', () => {
        wrapper.setState({ selectedUsers: [props.users.users[1], props.users.users[2]] });
        const stateStub = sinon.stub(instance, 'setState');
        const nextProps = getProps();
        nextProps.users.fetched = true;
        nextProps.users.users = [nextProps.users.users[0], nextProps.users.users[1]];
        wrapper.setProps(nextProps);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ selectedUsers: [nextProps.users.users[1]] })).toBe(true);
        stateStub.restore();
    });

    it('componentDidUpdate should handle updated', () => {
        const makeRequestStub = sinon.stub(instance, 'makeUserRequest');
        const groupsCallCount = props.getGroups.callCount;
        const userCallCount = makeRequestStub.callCount;
        wrapper.setProps({ groups: { ...props.groups, updated: true } });
        expect(props.getGroups.callCount).toEqual(groupsCallCount + 1);
        expect(makeRequestStub.callCount).toEqual(userCallCount + 1);
        makeRequestStub.restore();
    });

    it('componentDidUpdate should handle created with no users', () => {
        const makeRequestStub = sinon.stub(instance, 'makeUserRequest');
        const groupsCallCount = props.getGroups.callCount;
        const userCallCount = makeRequestStub.callCount;
        wrapper.setProps({ groups: { ...props.groups, created: true } });
        expect(props.getGroups.callCount).toEqual(groupsCallCount + 1);
        expect(makeRequestStub.callCount).toEqual(userCallCount);
        makeRequestStub.restore();
    });

    it('componentDidUpdate should handle created with users', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        const makeRequestStub = sinon.stub(instance, 'makeUserRequest');
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

    it('componentDidUpdate should handle deleted', () => {
        setup({ location: { query: { groups: '12' }}});
        const makeRequestStub = sinon.stub(instance, 'makeUserRequest');
        const groupsCallCount = props.getGroups.callCount;
        history.reset();
        wrapper.setProps({ groups: { ...props.groups, deleted: true } });
        expect(props.getGroups.callCount).toEqual(groupsCallCount + 1);
        expect(history.calledOnce).toBe(true);
        expect(history.calledWith({ ...props.location, query: {} }));
        makeRequestStub.restore();
    });

    it('componentDidUpdate should handle groups error', () => {
        const showStub = sinon.stub(instance, 'showErrorDialog');
        wrapper.setProps({ groups: { ...props.groups, error: 'oh no an error' } });
        expect(showStub.calledOnce).toBe(true);
        expect(showStub.calledWith('oh no an error')).toBe(true);
        showStub.restore();
    });

    it('componentDidUpdate should handle users error', () => {
        const showStub = sinon.stub(instance, 'showErrorDialog');
        wrapper.setProps({ users: { ...props.users, error: 'oh no an error' } });
        expect(showStub.calledOnce).toBe(true);
        expect(showStub.calledWith('oh no an error')).toBe(true);
        showStub.restore();
    });

    it('getQueryGroup should return null if there is no query group found', () => {
        setup({ location: { query: { ordering: 'username' }}});
        expect(instance.getQueryGroup()).toBe(null);
    });

    it('getQueryGroup should return the correct group object', () => {
        const location = { query: { ordering: 'username', groups: String(props.groups.groups[0].id) } };
        setup({ location });
        expect(instance.getQueryGroup()).toEqual(props.groups.groups[0]);
    });

    it('getGroupTitle should return "All Members"', () => {
        setup({ location: { query: { ordering: 'username' }}});
        expect(instance.getGroupTitle()).toEqual('All Members');
    });

    it('getGroupTitle should return "No Members Matching Group Found"', () => {
        setup({ location: { query: { groups: 'some group' }}});
        expect(instance.getGroupTitle()).toEqual('No Members Matching Group Found');
    });

    it('getGroupTitle should return the group name', () => {
        setup({ location: { query: { groups: String(props.groups.groups[0]) }}});
        expect(instance.getGroupTitle(props.groups.groups[0]))
            .toEqual(`${props.groups.groups[0].name} Members`);
    });

    it('makeUserRequest should make the default request', () => {
        setup({ location: { query: {} }});
        props.getUsers.reset();
        const expectedParams = {
            ordering: 'username',
            prepend_self: true,
            page_size: instance.pageSize,
        };
        instance.makeUserRequest();
        expect(props.getUsers.calledOnce).toBe(true);
        expect(props.getUsers.calledWith(expectedParams)).toBe(true);
    });

    it('makeUserRequest should request users with a search param', () => {
        setup({ location: { query: { ordering: 'username', search: 'my-search' }}});
        props.getUsers.reset();
        const expectedParams = {
            ordering: 'username',
            search: 'my-search',
            prepend_self: true,
            page_size: instance.pageSize,
        };
        instance.makeUserRequest();
        expect(props.getUsers.calledOnce).toBe(true);
        expect(props.getUsers.calledWith(expectedParams)).toBe(true);
    });

    it('makeUserRequest should request users in a specific group', () => {
        setup({ location: { query: { groups: 2 }}});
        props.getUsers.reset();
        const expectedParams = {
            groups: 2,
            ordering: 'username',
            prepend_self: true,
            page_size: instance.pageSize,
        };
        instance.makeUserRequest();
        expect(props.getUsers.calledOnce).toBe(true);
        expect(props.getUsers.calledWith(expectedParams)).toBe(true);
    });

    it('toggleDrawer should change the drawer state', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const drawerState = wrapper.state().drawerOpen;
        instance.toggleDrawer();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ drawerOpen: !drawerState })).toBe(true);
        stateStub.restore();
    });

    it('handleSelectAll should update state with user indices or with empty array', () => {
        const stateStub = sinon.stub(instance, 'setState');
        let expectedArray = props.users.users.filter(user => user.user.username !== props.user.username);
        instance.handleSelectAll(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ selectedUsers: expectedArray })).toBe(true);
        expectedArray = [];
        instance.handleSelectAll(false);
        expect(stateStub.calledTwice).toBe(true);
        expect(stateStub.calledWith({ selectedUsers: expectedArray })).toBe(true);
        stateStub.restore();
    });

    it('handleUserSelect should remove the user from selection', () => {
        const selection = props.users.users;
        wrapper.setState({ selectedUsers: selection });
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleUserSelect(props.users.users[0]);
        const [, ...expectedUsers] = props.users.users;
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ selectedUsers: expectedUsers })).toBe(true);
        stateStub.restore();
    });

    it('handleUserSelect should add the user to the selection', () => {
        const selection = props.users.users;
        wrapper.setState({ selectedUsers: selection });
        const stateStub = sinon.stub(instance, 'setState');
        const newUser = { user: { username: 'new' } };
        instance.handleUserSelect(newUser);
        const expectedUsers = [...selection, newUser];
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ selectedUsers: expectedUsers }));
    });

    it('handleSearchKeyDown should set query with search text', () => {
        history.reset();
        const fakeEvent = { key: 'Enter', target: { value: 'search text' } };
        instance.handleSearchKeyDown(fakeEvent);
        expect(history.calledOnce).toBe(true);
        expect(history.calledWith({
            ...props.location,
            query: { ...props.location.query, search: 'search text' },
        })).toBe(true);
    });

    it('handleSearchChange should clear search query if the input is empty', () => {
        setup({ location: { query: { ordering: 'admin', search: 'search text' }}});
        history.reset();
        const value = '';
        instance.handleSearchChange({ target: { value } });
        expect(history.calledOnce).toBe(true);
        expect(history.calledWith({
            ...props.location,
            query: { ordering: 'admin', page_size: instance.pageSize },
        })).toBe(true);
    });

    it('handleOrderingChange should update the ordering query', () => {
        history.reset();
        const val = '-username';
        instance.handleOrderingChange(val);
        expect(history.calledOnce).toBe(true);
        expect(history.calledWith({
            ...props.location,
            query: { ...props.location.query, ordering: val },
        }));
    });

    it('handleCreateOpen shoudl set showCreate to true', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleCreateOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showCreate: true })).toBe(true);
        stateStub.restore();
    });

    it('handleCreateClose should set showCreate to false and input to empty str', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleCreateClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showCreate: false, createInput: '' })).toBe(true);
        stateStub.restore();
    });

    it('handleCreateInput should set createInput state', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const val = 'create name';
        instance.handleCreateInput({ target: { value: val } });
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ createInput: val })).toBe(true);
        stateStub.restore();
    });

    it('handleCreateSave should call createGroup with state values and call create close', () => {
        const closeStub = sinon.stub(instance, 'handleCreateClose');
        wrapper.setState({ createInput: 'input', createUsers: [props.users.users[0]] });
        instance.handleCreateSave();
        expect(props.createGroup.calledOnce).toBe(true);
        expect(props.createGroup.calledWith('input', ['user_one'])).toBe(true);
        expect(closeStub.calledOnce).toBe(true);
        closeStub.restore();
    });

    it('handleRenameOpen should set open and the targetGroup', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const group = { id: 1 };
        instance.handleRenameOpen(group);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showRename: true, targetGroup: group }));
        stateStub.restore();
    });

    it('handleRenameClose should set closed and clear input and target group', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleRenameClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showRename: false, renameInput: '', targetGroup: null }));
        stateStub.restore();
    });

    it('handleRenameInput should set the input state', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleRenameInput({ target: { value: 'test' } });
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ renameInput: 'test' })).toBe(true);
        stateStub.restore();
    });

    it('handleRenameSave should call updateGroup and renameClose', () => {
        const closeStub = sinon.stub(instance, 'handleRenameClose');
        const group = { id: 1 };
        const input = 'test input';
        wrapper.setState({ targetGroup: group, renameInput: input });
        instance.handleRenameSave();
        expect(props.updateGroup.calledOnce).toBe(true);
        expect(props.updateGroup.calledWith(group.id, { name: input })).toBe(true);
        expect(closeStub.calledOnce).toBe(true);
        closeStub.restore();
    });

    it('handleNewGroup should set creatUsers state and call create open', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const openStub = sinon.stub(instance, 'handleCreateOpen');
        const users = [props.users.users[0]];
        instance.handleNewGroup(users);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ createUsers: users })).toBe(true);
        expect(openStub.calledOnce).toBe(true);
        openStub.restore();
        stateStub.restore();
    });

    it('handleAddUsers should set state and show Add dialog', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const openStub = sinon.stub(instance, 'showAddUsersDialog');
        const { users } = props.users;
        instance.handleAddUsers(users);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ addUsers: users })).toBe(true);
        expect(openStub.calledOnce).toBe(true);
    });

    it('handleLeaveGroupClick should set targetGroup and call leave open', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const openStub = sinon.stub(instance, 'handleLeaveOpen');
        instance.handleLeaveGroupClick(props.groups.groups[0]);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ targetGroup: props.groups.groups[0] })).toBe(true);
        expect(openStub.calledOnce).toBe(true);
        openStub.restore();
        stateStub.restore();
    });

    it('handleDeleteGroupClick should set targetGroup and call delete open', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const openStub = sinon.stub(instance, 'handleDeleteOpen');
        instance.handleDeleteGroupClick(props.groups.groups[0]);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ targetGroup: props.groups.groups[0] })).toBe(true);
        expect(openStub.calledOnce).toBe(true);
        openStub.restore();
        stateStub.restore();
    });

    it('handleLeaveOpen should set showLeave to true', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleLeaveOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showLeave: true })).toBe(true);
        stateStub.restore();
    });

    it('handleLeaveClose should set showLeave to false', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleLeaveClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showLeave: false })).toBe(true);
        stateStub.restore();
    });

    it('handleLeaveClick should call updateGroup and leaveClose', () => {
        const closeStub = sinon.stub(instance, 'handleLeaveClose');
        const targetGroup = props.groups.groups[0];
        wrapper.setState({ targetGroup });
        instance.handleLeaveClick();
        expect(props.updateGroup.calledOnce).toBe(true);
        expect(props.updateGroup.calledWith(targetGroup.id)).toBe(true);
        expect(closeStub.calledOnce).toBe(true);
        closeStub.restore();
    });

    it('handleDeleteOpen should set showDelete to true', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleDeleteOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showDelete: true })).toBe(true);
        stateStub.restore();
    });

    it('handleDeleteClose should set showDelete to false', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleDeleteClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showDelete: false })).toBe(true);
        stateStub.restore();
    });

    it('handleDeleteClick should call deleteGroup and handleDeleteClose', () => {
        const closeStub = sinon.stub(instance, 'handleDeleteClose');
        const group = props.groups.groups[0];
        wrapper.setState({ targetGroup: group });
        instance.handleDeleteClick();
        expect(props.deleteGroup.calledOnce).toBe(true);
        expect(props.deleteGroup.calledWith(group.id));
        expect(closeStub.calledOnce).toBe(true);
        closeStub.restore();
    });

    it('handleDrawerSelectionChange should clear the group query', () => {
        setup({ location: { query: { groups: '12' }}});
        history.reset();
        const fakeValue = 'all';
        instance.handleDrawerSelectionChange(fakeValue);
        expect(history.calledOnce).toBe(true);
        expect(history.calledWith({
            ...props.location,
            query: {},
        }));
    });

    it('handleDrawerSelectionChange should set the group query', () => {
        history.reset();
        const fakeValue = '12';
        instance.handleDrawerSelectionChange(fakeValue);
        expect(history.calledOnce).toBe(true);
        expect(history.calledWith({
            ...props.location,
            query: { ...props.location.query, groups: fakeValue },
        }));
    });

    it('handleMakeAdmin should add the user to group admins and call updateGroup', () => {
        sinon.stub(instance, 'getQueryGroup').returns(props.groups.groups[0]);
        const newUser = { user: { username: 'new user' } };
        const groupId = props.groups.groups[0].id;
        const expectedAdmins = [...props.groups.groups[0].administrators, newUser.user.username];
        instance.handleMakeAdmin(newUser);
        expect(props.updateGroup.calledOnce).toBe(true);
        expect(props.updateGroup.calledWith(groupId, { administrators: expectedAdmins })).toBe(true);
    });

    it('handleDemoteAdmin should remove the user from the group admins and call updateGroup', () => {
        const groups = { ...props.groups };
        groups.groups[0].administrators.push('new user');
        setup({ groups });
        sinon.stub(instance, 'getQueryGroup').returns(props.groups.groups[0]);
        const newUser = { user: { username: 'new user' } };
        const groupId = props.groups.groups[0].id;
        const expectedAdmins = [...props.groups.groups[0].administrators];
        expectedAdmins.splice(-1, 1);
        instance.handleDemoteAdmin(newUser);
        expect(props.updateGroup.calledOnce).toBe(true);
        expect(props.updateGroup.calledWith(groupId, { administrators: expectedAdmins })).toBe(true);
    });

    it('handleRemoveUser should not updateGroup if no queryGroup is found', () => {
        instance.handleRemoveUser();
        expect(props.updateGroup.called).toBe(false);
    });

    it('handleRemoveUser should update the group with user removed', () => {
        props.location.query = { groups: '1' };
        setup({ location: { query: { groups: '1' }}});
        const user = props.users.users[0];
        instance.handleRemoveUser(user);
        expect(props.updateGroup.calledOnce).toBe(true);
        expect(props.updateGroup.calledWith(1)).toBe(true);
    });

    it('handleBatchRemoveUser should not update group if no query group is found', () => {
        instance.handleBatchRemoveUser();
        expect(props.updateGroup.called).toBe(false);
    });

    it('handleBatchRemoveUser should remove users and updateGroup', () => {
        const p = getProps();
        const group = {
            id: 12,
            name: 'twelve',
            members: ['1', '2', '3'],
            administrators: ['1', '2', '3'],
        };
        p.location.query = { groups: '12' };
        p.groups.groups.push(group);
        setup(p);
        const users = [
            { user: { username: '1' } },
            { user: { username: '2' } },
        ];
        instance.handleBatchRemoveUser(users);
        expect(props.updateGroup.calledOnce).toBe(true);
        expect(props.updateGroup.calledWith(group.id, {
            members: ['3'],
            administrators: ['3'],
        })).toBe(true);
    });

    it('handleBatchAdminRights should not updateGroup if there is no queryGroup', () => {
        instance.handleBatchAdminRights();
        expect(props.updateGroup.called).toBe(false);
    });

    it('handleBatchAdminRights should update group with new admins', () => {
        props.location.query = { groups: String(props.groups.groups[0].id) };
        const users = [
            { user: { username: '1' } },
            { user: { username: '2' } },
        ];
        setup({ location: { query: { groups: String(props.groups.groups[0].id )}}});
        instance.handleBatchAdminRights(users);
        const expectedAdmins = [...props.groups.groups[0].administrators, '1', '2'];
        expect(props.updateGroup.calledOnce).toBe(true);
        expect(props.updateGroup.calledWith(props.groups.groups[0].id, {
            administrators: expectedAdmins,
        })).toBe(true);
    });

    it('handleBatchAdminRighs should update group with removed admins', () => {
        const users = [{ user: { username: 'user_one' } }];
        setup({ location: { query: { groups: String(props.groups.groups[0].id )}}});
        instance.handleBatchAdminRights(users);
        expect(props.updateGroup.calledOnce).toBe(true);
        expect(props.updateGroup.calledWith(props.groups.groups[0].id, { administrators: [] })).toBe(true);
    });

    it('handleAddUsersSave should hide the dialog and update each group with new members', () => {
        const groups = [
            { id: 0, members: [] },
            { id: 1, members: [] },
        ];
        const users = [
            { user: { username: '1' } },
            { user: { username: '2' } },
        ];
        const hideStub = sinon.stub(instance, 'hideAddUsersDialog');
        instance.handleAddUsersSave(groups, users);
        expect(hideStub.calledOnce).toBe(true);
        expect(props.updateGroup.calledTwice).toBe(true);
        expect(props.updateGroup.calledWith(groups[0].id, { members: ['1', '2'] })).toBe(true);
        expect(props.updateGroup.calledWith(groups[1].id, { members: ['1', '2'] })).toBe(true);
        hideStub.restore();
    });

    it('showAddUsersDialog should set state true', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.showAddUsersDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showAddUsers: true })).toBe(true);
    });

    it('hideAddUsersDialog should set state false', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.hideAddUsersDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showAddUsers: false })).toBe(true);
    });

    it('showErrorDialog should set state with errors', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const message = { errors: [{ detail: 'an error' }] };
        instance.showErrorDialog(message);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ errors: message.errors })).toBe(true);
        stateStub.restore();
    });

    it('hideErrorDialog should set state with empty string', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.hideErrorDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ errors: [] })).toBe(true);
        stateStub.restore();
    });

    it('showAdministratorInfoDialog should set show to true', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.showAdministratorInfoDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showAdministratorInfo: true })).toBe(true);
        stateStub.restore();
    });

    it('hideAdministratorInfoDialog should set show to false', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.hideAdministratorInfoDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showAdministratorInfo: false })).toBe(true);
        stateStub.restore();
    });

    it('showMemberInfoDialog should set show to true', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.showMemberInfoDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showMemberInfo: true })).toBe(true);
        stateStub.restore();
    });

    it('hideMemberInfoDialog should set show to false', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.hideMemberInfoDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showMemberInfo: false })).toBe(true);
        stateStub.restore();
    });

    it('showOtherInfoDialog should set show to true', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.showOtherInfoDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showOtherInfo: true })).toBe(true);
        stateStub.restore();
    });

    it('hideOtherInfoDialog should set show to false', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.hideOtherInfoDialog();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showOtherInfo: false })).toBe(true);
        stateStub.restore();
    });

    it('joyrideAddSteps should set state for steps in tour', () => {
        const steps = [{
            title: 'Welcome to the Account Settings Page',
            text: 'Example text',
            selector: '.qa-PageHeader',
            position: 'top',
            style: {},
            isFixed: true,
        }];
        const stateSpy = sinon.stub(instance, 'setState');
        instance.joyrideAddSteps(steps);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ steps }));
        stateSpy.restore();
    });

    it('handleJoyride should set state', () => {
        const stateSpy = sinon.stub(instance, 'setState');
        instance.handleJoyride();
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
        const stateSpy = sinon.stub(instance, 'setState');
        instance.callback(callbackData);
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
        wrapper.setProps({ width: 'sm' });
        wrapper.setState({ drawerOpen: false });
        const toggleStub = sinon.stub(instance, 'toggleDrawer').returns(Promise.resolve(true));
        instance.callback(data);
        expect(toggleStub.calledOnce).toBe(true);
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
        const scrollStub = sinon.stub();
        instance.scrollbar = { scrollToTop: scrollStub };
        instance.callback(data);
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
        wrapper.setProps({ width: 'sm' });
        const toggleStub = sinon.stub(instance, 'toggleDrawer');
        const stateStub = sinon.stub(instance, 'setState');
        instance.callback(data);
        expect(toggleStub.calledOnce).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ stepIndex: 3 }));
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
        const selectStub = sinon.stub(instance, 'handleSelectAll');
        instance.callback(data);
        expect(selectStub.calledOnce).toBe(true);
        expect(selectStub.calledWith(true)).toBe(true);
    });

    it('callback should toggle drawer again', () => {
        const data = {
            action: 'next',
            index: 2,
            step: {
                selector: '.qa-UserHeader-options',
            },
            type: 'step:after',
        };
        const toggleStub = sinon.stub(instance, 'toggleDrawer').returns(Promise.resolve(true));
        instance.callback(data);
        expect(toggleStub.calledOnce).toBe(true);
        toggleStub.restore();
    });
});
