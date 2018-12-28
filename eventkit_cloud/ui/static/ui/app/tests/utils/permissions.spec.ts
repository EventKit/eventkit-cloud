import * as utils from '../../utils/permissions';

describe('Permissions class', () => {
    let permissions;
    const setup = () => {
        permissions = new utils.Permissions();
    };

    beforeEach(setup);

    it('removeMemberPermissions should remove the permissions for a single member', () => {
        const users = {
            one: utils.Levels.READ,
            two: utils.Levels.READ,
        };
        permissions.setMembers(users);
        expect(permissions.getMemberCount()).toEqual(2);
        permissions.removeMemberPermission('one');
        expect(permissions.getMemberCount()).toEqual(1);
    });

    it('removeGroupPermissions should remove the permissions for a single group', () => {
        const groups = {
            one: utils.Levels.READ,
            two: utils.Levels.READ,
        };
        permissions.setGroups(groups);
        expect(permissions.getGroupCount()).toEqual(2);
        permissions.removeGroupPermissions('one');
        expect(permissions.getGroupCount()).toEqual(1);
    });

    it('getUserPermissions should return user permissions if they have be set', () => {
        expect(permissions.getUserPermissions()).toEqual(undefined);
        permissions.setMembers({ admin: utils.Levels.ADMIN });
        permissions.setUsername('admin');
        permissions.extractCurrentUser();
        expect(permissions.getUserPermissions()).toEqual({ admin: utils.Levels.ADMIN });
    });

    it('isPublic should return true or false for the permission value', () => {
        expect(permissions.isPublic()).toBe(false);
        permissions.makePublic();
        expect(permissions.isPublic()).toBe(true);
    });

    it('insertCurrentUser should do nothing if there is no user', () => {
        expect(permissions.getMemberCount()).toEqual(0);
        permissions.insertCurrentUser();
        expect(permissions.getMemberCount()).toEqual(0);
    });

    it('extractCurrentUser should do nothing if there is no username set', () => {
        const users = {
            one: utils.Levels.ADMIN,
            two: utils.Levels.READ,
        };
        permissions.setMembers({ ...users, admin: utils.Levels.ADMIN });
        expect(permissions.getMemberCount()).toEqual(3);
        permissions.extractCurrentUser();
        expect(permissions.getMemberCount()).toEqual(3);
    });

    it('extractCurrentUser should remove user from members and leave other members as is', () => {
        const users = {
            one: utils.Levels.ADMIN,
            two: utils.Levels.READ,
        };
        permissions.setMembers({ ...users, admin: utils.Levels.ADMIN });
        permissions.setUsername('admin');
        expect(permissions.getMemberCount()).toEqual(3);
        permissions.extractCurrentUser();
        expect(permissions.getMemberCount()).toEqual(2);
    });

    it('insertCurrentUser should add the user to members', () => {
        const p = {
            value: 'SHARED',
            members: {
                admin: utils.Levels.ADMIN,
            },
            groups: {},
        };
        permissions.setPermissions(p);
        permissions.setUsername('admin');
        permissions.extractCurrentUser();
        expect(permissions.getMemberCount()).toEqual(0);
        permissions.insertCurrentUser();
        expect(permissions.getMemberCount()).toEqual(1);
    });

    it('makePublic should clear non-admin users and set value to PUBLIC', () => {
        const p = {
            value: 'SHARED',
            members: {
                one: utils.Levels.ADMIN,
                two: utils.Levels.READ,
            },
            groups: {},
        };
        permissions.setPermissions(p);
        expect(permissions.isShared()).toBe(true);
        permissions.makePublic();
        const expected = {
            value: 'PUBLIC',
            members: {
                one: utils.Levels.ADMIN,
            },
            groups: {},
        };
        expect(permissions.getPermissions()).toEqual(expected);
    });

    it('makePrivate should clear groups and members and set value to PRIVATE', () => {
        const p = {
            value: 'SHARED',
            groups: { one: utils.Levels.ADMIN },
            members: { one: utils.Levels.ADMIN },
        };
        permissions.setPermissions(p);
        expect(permissions.isShared()).toBe(true);
        permissions.makePrivate();
        expect(permissions.isPrivate()).toBe(true);
        expect(permissions.getGroupCount()).toEqual(0);
        expect(permissions.getMemberCount()).toEqual(0);
    });

    it('makeShared should add users and groups to permissions', () => {
        expect(permissions.getPermissions()).toEqual({
            value: 'PRIVATE',
            members: {},
            groups: {},
        });

        const users = ['one', 'two'];
        const groups = ['one', 'two'];
        permissions.makeShared(users, groups);
        const expected = {
            value: 'SHARED',
            members: { one: utils.Levels.READ, two: utils.Levels.READ },
            groups: { one: utils.Levels.READ, two: utils.Levels.READ },
        };
        expect(permissions.getPermissions()).toEqual(expected);
    });

    it('groupHasPermission should return true or false for a specified level', () => {
        const group = { one: utils.Levels.ADMIN };
        permissions.setGroups(group);
        expect(permissions.groupHasPermission('one', utils.Levels.READ)).toBe(false);
        expect(permissions.groupHasPermission('one', utils.Levels.ADMIN)).toBe(true);
    });

    it('groupsHavePermissions should return true', () => {
        const groups = {
            one: utils.Levels.READ,
            two: utils.Levels.ADMIN,
        };
        permissions.setGroups(groups);
        expect(permissions.groupsHavePermissions(Object.keys(groups))).toBe(true);
    });

    it('groupsHavePermissions should return false', () => {
        const groups = {
            one: undefined,
            two: utils.Levels.ADMIN,
        };
        permissions.setGroups(groups);
        expect(permissions.groupsHavePermissions(Object.keys(groups))).toBe(false);
    });

    it('userHasPermission should return true or false for a specified level', () => {
        const user = { one: utils.Levels.ADMIN };
        permissions.setMembers(user);
        expect(permissions.userHasPermission('one', utils.Levels.READ)).toBe(false);
        expect(permissions.userHasPermission('one', utils.Levels.ADMIN)).toBe(true);
    });

    it('usersHavePermissions should return true', () => {
        const users = {
            one: utils.Levels.READ,
            two: utils.Levels.ADMIN,
        };
        permissions.setMembers(users);
        expect(permissions.usersHavePermissions(Object.keys(users))).toBe(true);
    });

    it('usersHavePermissions should return false', () => {
        const users = {
            one: undefined,
            two: utils.Levels.READ,
        };
        permissions.setMembers(users);
        expect(permissions.usersHavePermissions(Object.keys(users))).toBe(false);
    });
});
