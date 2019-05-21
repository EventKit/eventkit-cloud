import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import Button from '@material-ui/core/Button';
import ShareBaseDialog from '../../components/DataPackShareDialog/ShareBaseDialog';
import GroupsBody from '../../components/DataPackShareDialog/GroupsBody';
import MembersBody from '../../components/DataPackShareDialog/MembersBody';
import ShareInfoBody from '../../components/DataPackShareDialog/ShareInfoBody';
import { DataPackShareDialog, Props } from '../../components/DataPackShareDialog/DataPackShareDialog';
import { Permissions, Levels } from '../../utils/permissions';

describe('DataPackPage component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const getPermissions = (): Props['permissions'] => ({
        value: 'PRIVATE',
        members: {},
        groups: {},
    });

    const getProps = () => ({
        show: true,
        onClose: sinon.spy(),
        onSave: sinon.spy(),
        groups: [
            {
                id: 1,
                name: 'group_one',
                members: ['user_one', 'user_two', 'user_three'],
                administrators: ['user_one'],
            }, {
                id: 2,
                name: 'group_two',
                members: ['user_one', 'user_two'],
                administrators: ['user_one'],
            }, {
                id: 3,
                name: 'group_three',
                members: ['user_one', 'user_two'],
                administrators: ['user_three'],
            },
        ],
        users: [
            {
                user: {
                    username: 'user_one',
                    firt_name: 'user',
                    last_name: 'one',
                    email: 'user_one@email.com',
                },
                groups: [1, 2, 3],
            },
            {
                user: {
                    username: 'user_two',
                    first_name: 'user',
                    last_name: 'two',
                    email: 'user_two@email.com',
                },
                groups: [1, 2, 3],
            },
            {
                user: {
                    username: 'user_three',
                    first_name: 'user',
                    last_name: 'three',
                    email: 'user_three@email.com',
                },
                groups: [1],
            },
        ],
        permissions: getPermissions(),
        user: {
            user: { username: 'admin' },
            groups: [],
        },
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;

    const setup = (params = {}, options = {}) => {
        props = { ...getProps(), ...params };
        wrapper = shallow(<DataPackShareDialog {...props} />, options);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render null if not open', () => {
        setup({ show: false });
        expect(wrapper.get(0)).toBe(null);
    });

    it('should render all the basic components', () => {
        const header = shallow(wrapper.find(ShareBaseDialog).props().children[0]);
        expect(header.find(Button)).toHaveLength(2);
        expect(wrapper.find(GroupsBody)).toHaveLength(1);
    });

    it('should display the ShareInfoBody', () => {
        wrapper.setState({ showShareInfo: true });
        expect(wrapper.find(ShareInfoBody)).toHaveLength(1);
    });

    it('should display the MembersBody', () => {
        wrapper.setState({ view: 'members' });
        expect(wrapper.find(MembersBody)).toHaveLength(1);
    });

    it('should display the selected count on the header buttons', () => {
        const header = shallow(wrapper.find(ShareBaseDialog).props().children[0]);
        expect(header.find('.qa-DataPackShareDialog-Button-groups').html()).toContain('GROUPS (0)');
        expect(header.find('.qa-DataPackShareDialog-Button-members').html()).toContain('MEMBERS (0)');
    });

    it('should display numbers as the selected count on the header buttons', () => {
        const p = getProps();
        p.user.groups = [1, 2, 3];
        p.permissions.groups = { group_one: '', group_two: '', group_three: '' };
        p.permissions.members = { user_one: '', user_two: '', user_three: '' };
        setup(p);
        const header = shallow(wrapper.find(ShareBaseDialog).props().children[0]);
        expect(header.find('.qa-DataPackShareDialog-Button-groups').html()).toContain('GROUPS (3)');
        expect(header.find('.qa-DataPackShareDialog-Button-members').html()).toContain('MEMBERS (3)');
    });

    it('componentDidUpdate should configure permissions and update state', () => {
        const permissions = getPermissions();
        permissions.members = {
            [props.user.user.username]: Levels.ADMIN,
            user_one: Levels.READ,
            user_two: Levels.READ,
        };
        setup({ show: false });
        const updateSpy = sinon.spy(instance, 'componentDidUpdate');
        const stateStub = sinon.stub(instance, 'setState');
        wrapper.setProps({ permissions, show: true });
        expect(updateSpy.calledOnce).toBe(true);
        expect(stateStub.calledOnce).toBe(true);
    });

    it('handleSave do nothing but call props.onSave with permissions', () => {
        const permissions = new Permissions(getPermissions());
        instance.handleSave();
        expect(props.onSave.calledOnce).toBe(true);
        expect(props.onSave.calledWith(permissions.getPermissions())).toBe(true);
    });

    it('handleSave should make set permissions to shared before calling onSave', () => {
        const members = { user_one: 'READ', user_two: 'READ' };
        const expected = { value: 'SHARED', members, groups: {} };
        expect(instance.permissions.isPrivate()).toBe(true);
        instance.permissions.setMembers(members);
        instance.handleSave();
        expect(props.onSave.calledOnce).toBe(true);
        expect(props.onSave.calledWith(expected)).toBe(true);
    });

    it('handleSave should set permissions to private before calling onSave', () => {
        instance.permissions.makeShared();
        const expected = getPermissions();
        expect(instance.permissions.isShared()).toBe(true);
        instance.handleSave();
        expect(props.onSave.calledOnce).toBe(true);
        expect(props.onSave.calledWith(expected)).toBe(true);
    });

    it('handleSave should show publicWarning and not call onSave', () => {
        setup({ warnPublic: true });
        const stateStub = sinon.stub(instance, 'setState');
        instance.permissions.makePublic();
        instance.handleSave();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showPublicWarning: true })).toBe(true);
        expect(props.onSave.callCount).toEqual(0);
    });

    it('handleSave should hide publicWarning and call onSave', () => {
        setup({ warnPublic: true });
        instance.permissions.makePublic();
        wrapper.setState({ showPublicWarning: true });
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleSave();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showPublicWarning: false }));
        expect(props.onSave.calledOnce).toBe(true);
    });

    it('handleSave should re-add the current user to the permissions', () => {
        const permissions = {
            value: 'SHARED',
            members: {
                admin: Levels.ADMIN,
                user_one: Levels.READ,
            },
            groups: {},
        };
        setup({ permissions });
        instance.permissions.setUsername('admin');
        instance.permissions.extractCurrentUser();
        expect(instance.permissions.getMembers()).toEqual({ user_one: Levels.READ });
        instance.handleSave();
        expect(props.onSave.calledOnce).toBe(true);
        expect(props.onSave.calledWith(permissions)).toBe(true);
    });

    it('handleUserCheck should set permissions to shared and give user read permission then setState', () => {
        instance.permissions.makePublic();
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleUserCheck('user_one');
        const expected = {
            value: 'SHARED',
            members: { user_one: Levels.READ },
            groups: {},
        };
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ permissions: expected })).toBe(true);
    });

    it('handleUserCheck should remove user permission', () => {
        instance.permissions.setMemberPermission('user_one', Levels.READ);
        expect(instance.permissions.getMembers()).toEqual({ user_one: Levels.READ });
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleUserCheck('user_one');
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ permissions: getPermissions() })).toBe(true);
    });

    it('handleGroupCheck should give group read permission then setState', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleGroupCheck('group_one');
        const expected = {
            value: 'PRIVATE',
            groups: { group_one: Levels.READ },
            members: {},
        };
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ permissions: expected })).toBe(true);
    });

    it('handleGroupCheck should remove group permission', () => {
        instance.permissions.setGroupPermission('group_one', Levels.READ);
        expect(instance.permissions.getGroups()).toEqual({ group_one: Levels.READ });
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleGroupCheck('group_one');
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ permissions: getPermissions() })).toBe(true);
    });

    //
    it('handleAdminCheck should give user ADMIN permission then setState', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleAdminCheck('user_one');
        const expected = {
            value: 'PRIVATE',
            members: { user_one: Levels.ADMIN },
            groups: {},
        };
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ permissions: expected })).toBe(true);
    });

    it('handleAdminCheck should remove user ADMIN permission', () => {
        instance.permissions.setMemberPermission('user_one', Levels.ADMIN);
        expect(instance.permissions.getMembers()).toEqual({ user_one: Levels.ADMIN });
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleAdminCheck('user_one');
        const expected = {
            value: 'PRIVATE',
            members: { user_one: Levels.READ },
            groups: {},
        };
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ permissions: expected })).toBe(true);
    });

    it('handleAdminGroupCheck should give group ADMIN permission then setState', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleAdminGroupCheck('group_one');
        const expected = {
            value: 'PRIVATE',
            groups: { group_one: Levels.ADMIN },
            members: {},
        };
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ permissions: expected })).toBe(true);
    });

    it('handleAdminGroupCheck should remove group ADMIN permission', () => {
        instance.permissions.setGroupPermission('group_one', Levels.ADMIN);
        expect(instance.permissions.getGroups()).toEqual({ group_one: Levels.ADMIN });
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleAdminGroupCheck('group_one');
        const expected = {
            value: 'PRIVATE',
            groups: { group_one: Levels.READ },
            members: {},
        };
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ permissions: expected })).toBe(true);
    });

    it('handleCurrentCheck should give all users permissions and update state', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const members = {};
        props.users.forEach((user) => { members[user.user.username] = Levels.READ; });
        const expected = {
            value: 'PRIVATE',
            members,
            groups: {},
        };
        instance.handleCurrentCheck();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ permissions: expected })).toBe(true);
    });

    it('handlePublicCheck should set permissions to public and update state', () => {
        const stateStub = sinon.stub(instance, 'setState');
        expect(instance.permissions.isPublic()).toBe(false);
        instance.handlePublicCheck();
        const expected = {
            value: 'PUBLIC',
            members: {},
            groups: {},
        };
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ permissions: expected })).toBe(true);
    });

    it('handleGroupCheckAll should add all groups to permissions and update state', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const groups = {};
        props.groups.forEach((group) => { groups[group.name] = Levels.READ; });
        const expected = {
            value: 'PRIVATE',
            members: {},
            groups,
        };
        instance.handleGroupCheckAll();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ permissions: expected })).toBe(true);
    });

    it('handleUnCheckAll should clear members and makeShare then update state', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.permissions.makePublic();
        instance.handleUncheckAll();
        const expected = {
            value: 'SHARED',
            members: {},
            groups: {},
        };
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ permissions: expected })).toBe(true);
    });

    it('handleGroupUncheckAll should clear group permissions', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.permissions.setGroups({ group_one: Levels.READ });
        expect(instance.permissions.getGroupCount()).toEqual(1);
        instance.handleGroupUncheckAll();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ permissions: getPermissions() })).toBe(true);
    });

    it('showShareInfo should set show to true', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.showShareInfo();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showShareInfo: true })).toBe(true);
        stateStub.restore();
    });

    it('hideShareInfo should set show to false', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.hideShareInfo();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showShareInfo: false })).toBe(true);
        stateStub.restore();
    });

    it('showPublicWarning should set show to true', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.showPublicWarning();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showPublicWarning: true })).toBe(true);
        stateStub.restore();
    });

    it('hidePublicWarning should set show to false', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.hidePublicWarning();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showPublicWarning: false })).toBe(true);
        stateStub.restore();
    });

    it('toggleView should set passed in view', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.toggleView('members');
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ view: 'members' }));
        stateStub.restore();
    });

    it('toggleView should set opposite view', () => {
        expect(wrapper.state().view).toEqual('groups');
        const stateStub = sinon.stub(instance, 'setState');
        instance.toggleView();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ view: 'members' })).toBe(true);
        stateStub.restore();
    });

    it('toggleView should set opposite view', () => {
        wrapper.setState({ view: 'members' });
        const stateStub = sinon.stub(instance, 'setState');
        instance.toggleView();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ view: 'groups' })).toBe(true);
        stateStub.restore();
    });
});
