export const Levels = {
    ADMIN: 'ADMIN' as Eventkit.Permissions.Level,
    READ: 'READ' as Eventkit.Permissions.Level,
};

export const Visibility = {
    PRIVATE: 'PRIVATE' as Eventkit.Permissions.Visibility,
    PUBLIC: 'PUBLIC' as Eventkit.Permissions.Visibility,
    SHARED: 'SHARED' as Eventkit.Permissions.Visibility,
};

export const DefaultPermissions: Eventkit.Permissions = {
    value: Visibility.PRIVATE,
    groups: {},
    members: {},
};

export class Permissions {
    private permissions: Eventkit.Permissions;
    private username: string;
    private userPermissions?: { [s: string]: Eventkit.Permissions.Level };

    constructor(permissions?: Eventkit.Permissions, currentUsername?: string) {
        this.permissions = permissions || DefaultPermissions;
        this.username = currentUsername;
    }

    public setPermissions(perms: Eventkit.Permissions) {
        this.permissions = perms;
    }

    public setUsername(username: string) {
        this.username = username;
    }

    public setMembers(members: Eventkit.Permissions.Members) {
        this.permissions = {
            ...this.permissions,
            members,
        };
    }

    public setGroups(groups: Eventkit.Permissions.Groups) {
        this.permissions = {
            ...this.permissions,
            groups,
        };
    }

    public setMemberPermission(member: string, level: Eventkit.Permissions.Level) {
        this.permissions.members[member] = level;
    }

    public removeMemberPermission(member: string) {
        this.permissions.members[member] = undefined;
        delete this.permissions.members[member];
    }

    public setGroupPermission(group: string, level: Eventkit.Permissions.Level) {
        this.permissions.groups[group] = level;
    }

    public removeGroupPermissions(group: string) {
        this.permissions.groups[group] = undefined;
        delete this.permissions.groups[group];
    }

    public getPermissions(): Eventkit.Permissions {
        return {
            value: this.permissions.value,
            members: { ...this.permissions.members },
            groups: { ...this.permissions.groups },
        };
    }

    public getUserPermissions() {
        return this.userPermissions;
    }

    public getMembers() {
        return { ...this.permissions.members };
    }

    public getMemberCount() {
        return Object.keys(this.permissions.members).length;
    }

    public getGroups() {
        return { ...this.permissions.groups };
    }

    public getGroupCount() {
        return Object.keys(this.permissions.groups).length;
    }

    public getVisibility(): Eventkit.Permissions.Visibility {
        return this.permissions.value;
    }

    public isPublic(): boolean {
        return this.getVisibility() === Visibility.PUBLIC;
    }

    public isPrivate(): boolean {
        return this.getVisibility() === Visibility.PRIVATE;
    }

    public isShared(): boolean {
        return this.getVisibility() === Visibility.SHARED;
    }

    public extractCurrentUser(): boolean {
        if (!this.username) {
            return;
        }
        const { members } = this.permissions;
        const newMembers = {};
        Object.keys(members).forEach((member) => {
            if (member === this.username) {
                this.userPermissions = { [this.username]: members[this.username] };
            } else {
                newMembers[member] = members[member];
            }
        });
        this.setMembers(newMembers);
    }

    public insertCurrentUser() {
        if (!this.username || !this.userPermissions) {
            return;
        }
        const { members } = this.permissions;
        members[this.username] = this.userPermissions[this.username];
    }

    public makePublic() {
        // If making it public we retain only admin members and remove all others
        const admins = {};
        Object.keys(this.permissions.members).forEach((member) => {
            if (this.permissions.members[member] === Levels.ADMIN) {
                admins[member] = Levels.ADMIN;
            }
        });
        const newPermissions = {
            ...this.permissions,
            value: Visibility.PUBLIC,
            members: admins,
        };
        this.permissions = newPermissions;
    }

    public makePrivate() {
        const newPermissions = {
            value: Visibility.PRIVATE,
            members: {},
            groups: {},
        };
        this.permissions = newPermissions;
    }

    public makeShared(usernames = [], groupnames = []) {
        usernames.forEach((username) => {
            if (!this.userHasPermission(username)) {
                this.setMemberPermission(username, Levels.READ);
            }
        });

        groupnames.forEach((group) => {
            if (!this.groupHasPermission(group)) {
                this.setGroupPermission(group, Levels.READ);
            }
        });

        const newPermissions = {
            value: Visibility.SHARED,
            members: this.getMembers(),
            groups: this.getGroups(),
        };
        this.permissions = newPermissions;
    }

    public groupHasPermission(groupname: string, level?: Eventkit.Permissions.Level): boolean {
        if (level) {
            return this.permissions.groups[groupname] === level;
        }
        return this.permissions.groups[groupname] !== undefined;
    }

    public groupsHavePermissions(groupnames: string[]): boolean {
        return groupnames.every(groupname => this.groupHasPermission(groupname));
    }

    public userHasPermission(username: string, level?: Eventkit.Permissions.Level): boolean {
        if (level) {
            return this.permissions.members[username] === level;
        }
        return this.permissions.members[username] !== undefined;
    }

    public usersHavePermissions(usernames: string[]): boolean {
        return usernames.every(username => this.userHasPermission(username));
    }
}
