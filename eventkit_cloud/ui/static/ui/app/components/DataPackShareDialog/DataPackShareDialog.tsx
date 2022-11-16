import {connect} from 'react-redux';
import {useEffect, useState, useRef, createRef, RefObject} from 'react';
import {withTheme, Theme} from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import ShareBaseDialog from './ShareBaseDialog';
import GroupsBody from './GroupsBody';
import MembersBody from './MembersBody';
import ShareInfoBody from './ShareInfoBody';
import BaseDialog from '../Dialog/BaseDialog';
import {Permissions, Levels} from '../../utils/permissions';

export interface Props {
    job?: Eventkit.Job;
    show: boolean;
    onClose: () => void;
    onSave: (perms: Eventkit.Permissions) => void;
    user?: Eventkit.User;
    groups: Eventkit.Group[];
    users: Eventkit.User[];
    permissions: Eventkit.Permissions;
    permissionState: Eventkit.Store.UpdatePermissions;
    groupsText?: any;
    membersText?: any;
    canUpdateAdmin?: boolean;
    submitButtonLabel?: string;
    title?: any;
    warnPublic?: boolean;
    theme: Eventkit.Theme & Theme;
}

export type PermissionsView = 'groups' | 'members';

export interface State {
    view: PermissionsView;
    permissions: Eventkit.Permissions;
    showShareInfo: boolean;
    showPublicWarning: boolean;
}

export const DataPackShareDialog = (props: Props) => {
    const submitButtonLabel = props.submitButtonLabel ?? 'SAVE';
    const title = props.title ?? 'SHARE';
    const groupsText = props.groupsText ?? '';
    const membersText = props.membersText ?? '';
    const canUpdateAdmin = props.canUpdateAdmin ?? false;
    const user = props.user ?? null;
    const warnPublic = props.warnPublic ?? false;
    let refPerms: RefObject<Permissions> = useRef<Permissions>(new Permissions(props.permissions));

    const getCurrentRefVal = () => {
        return refPerms.current;
    }

    const [view, setView] = useState('groups');
    const [permissions, setPermissions] = useState(null);
    const [showShareInfo, setShowShareInfo] = useState(false);
    const [showPublicWarning, setShowPublicWarning] = useState(false);

    const handleSave = () => {
        const localPermissions = getCurrentRefVal();
        if (localPermissions.isPrivate()) {
            if (localPermissions.getMemberCount() || localPermissions.getGroupCount()) {
                localPermissions.makeShared();
            }
        } else if (localPermissions.isShared()) {
            if (!localPermissions.getMemberCount() && !localPermissions.getGroupCount()) {
                localPermissions.makePrivate();
            }
        } else if (warnPublic) {
            if (!showPublicWarning) {
                setShowPublicWarning(true);
                return;
            }
            setShowPublicWarning(false);
        }

        if (localPermissions.getUserPermissions()) {
            localPermissions.insertCurrentUser();
        }

        props.onSave(localPermissions.getPermissions());
    };

    const handleUserCheck = (username: string) => {
        const localPermissions = getCurrentRefVal();
        if (localPermissions.isPublic()) {
            localPermissions.makeShared();
        }
        if (localPermissions.userHasPermission(username)) {
            localPermissions.removeMemberPermission(username);
        } else {
            localPermissions.setMemberPermission(username, Levels.READ);
        }
        setPermissions(localPermissions.getPermissions());
    };

    const handleGroupCheck = (groupname: string) => {
        const localPermissions = getCurrentRefVal();
        if (localPermissions.groupHasPermission(groupname)) {
            localPermissions.removeGroupPermissions(groupname);
        } else {
            localPermissions.setGroupPermission(groupname, Levels.READ);
        }
        setPermissions(localPermissions.getPermissions());
    };

    const handleAdminCheck = (username: string) => {
        const localPermissions = getCurrentRefVal();
        if (localPermissions.userHasPermission(username, Levels.ADMIN)) {
            localPermissions.setMemberPermission(username, Levels.READ);
        } else {
            localPermissions.setMemberPermission(username, Levels.ADMIN);
        }
        setPermissions(localPermissions.getPermissions());
    };

    const handleAdminGroupCheck = (groupname: string) => {
        const localPermissions = getCurrentRefVal();
        if (localPermissions.groupHasPermission(groupname, Levels.ADMIN)) {
            localPermissions.setGroupPermission(groupname, Levels.READ);
        } else {
            localPermissions.setGroupPermission(groupname, Levels.ADMIN);
        }
        setPermissions(localPermissions.getPermissions());
    };

    const handleCurrentCheck = () => {
        const localPermissions = getCurrentRefVal();
        props.users.forEach((user) => {
            const {username} = user.user;
            if (!localPermissions.userHasPermission(username)) {
                localPermissions.setMemberPermission(username, Levels.READ);
            }
        });
        setPermissions(localPermissions.getPermissions());
    };

    const handlePublicCheck = () => {
        const localPermissions = getCurrentRefVal();
        localPermissions.makePublic();
        setPermissions(localPermissions.getPermissions());
    };

    const handleGroupCheckAll = () => {
        const localPermissions = getCurrentRefVal();
        props.groups.forEach((group) => {
            const {name} = group;
            if (!localPermissions.groupHasPermission(name)) {
                localPermissions.setGroupPermission(name, Levels.READ);
            }
        });
        setPermissions(localPermissions.getPermissions());
    };

    const handleUncheckAll = () => {
        const localPermissions = getCurrentRefVal();
        // Retain permissions for users with administrative privileges.
        props.users.forEach((user) => {
            const {username} = user.user;
            if (!localPermissions.userHasPermission(username, Levels.ADMIN)) {
                localPermissions.removeMemberPermission(username);
            }
        });
        if (localPermissions.isPublic()) {
            localPermissions.makeShared();
        }
        setPermissions(localPermissions.getPermissions());
    };

    const handleGroupUncheckAll = () => {
        const localPermissions = getCurrentRefVal();
        // Retain permissions for groups with administrative privileges.
        props.groups.forEach((group) => {
            const {name} = group;
            if (!localPermissions.groupHasPermission(name, Levels.ADMIN)) {
                localPermissions.removeGroupPermissions(name);
            }
        });
        setPermissions(localPermissions.getPermissions());
    };

    const showInfo = () => {
        setShowShareInfo(true);
    };

    const hideInfo = () => {
        setShowShareInfo(false);
    };

    const hideWarning = () => {
        setShowPublicWarning(false);
    };

    const toggleView = () => {
        if (view === 'groups') {
            setView('members');
        } else {
            setView('groups');
        }
    };

    const renderSharedPermissions = () => {
        if (view === 'groups') {
            return (
                <GroupsBody
                    view={view}
                    job={props.job}
                    selectedGroups={permissions?.groups}
                    groupsText={groupsText}
                    onGroupCheck={handleGroupCheck}
                    onAdminCheck={handleAdminGroupCheck}
                    onCheckAll={handleGroupCheckAll}
                    onUncheckAll={handleGroupUncheckAll}
                    canUpdateAdmin={canUpdateAdmin}
                    handleShowShareInfo={showInfo}
                />
            );
        } else {
            return (
                <MembersBody
                    view={view as PermissionsView}
                    job={props.job}
                    public={permissions?.value === 'PUBLIC'}
                    selectedMembers={permissions?.members}
                    membersText={membersText}
                    onMemberCheck={handleUserCheck}
                    onAdminCheck={handleAdminCheck}
                    onCheckCurrent={handleCurrentCheck}
                    onCheckAll={handlePublicCheck}
                    onUncheckAll={handleUncheckAll}
                    canUpdateAdmin={canUpdateAdmin}
                    handleShowShareInfo={showInfo}
                />
            );
        }
    }

    useEffect(() => {
        // Anything in here is fired on component mount.
        setPermissions(refPerms.current.getPermissions());
    }, []);

    if (!props.show) {
        return null;
    }

    const {colors} = props.theme.eventkit;

    const styles = {
        fixedHeader: {
            position: 'sticky' as 'sticky',
            top: 0,
            left: 0,
            backgroundColor: colors.white,
            zIndex: 15,
            padding: '0px 10px',
        },
        groupsButton: {
            flex: '1 1 auto',
            borderRadius: '0px',
            backgroundColor: view === 'groups' ? colors.primary : colors.secondary,
            boxShadow: 'none',
            color: view === 'groups' ? colors.white : colors.primary,
        },
        membersButton: {
            flex: '1 1 auto',
            borderRadius: '0px',
            backgroundColor: view === 'members' ? colors.primary : colors.secondary,
            boxShadow: 'none',
            color: view === 'members' ? colors.white : colors.primary,
        },
    };

    if (showShareInfo) {
        return (
            <ShareBaseDialog
                show={props.show}
                onClose={props.onClose}
                handleSave={handleSave}
                title={title}
                submitButtonLabel={submitButtonLabel}
                className="qa-DataPackShareDialog"
            >
                <ShareInfoBody
                    view={view as PermissionsView}
                    onReturn={hideInfo}
                />
            </ShareBaseDialog>
        );
    }

    const localPermissions = getCurrentRefVal();
    const groupCount: number = Object.keys(localPermissions.getGroups()).length;
    let memberCount: number | string = Object.keys(localPermissions.getMembers()).length;
    if (localPermissions.isPublic()) {
        memberCount = 'ALL';
    }

    return (
        <ShareBaseDialog
            show={props.show}
            onClose={props.onClose}
            handleSave={handleSave}
            title={title}
            submitButtonLabel={submitButtonLabel}
            className="qa-DataPackShareDialog"
        >
            <div style={styles.fixedHeader} className="qa-DataPackShareDialog-container">
                <div
                    className="qa-DataPackShareDialog-headers"
                    style={{display: 'flex', flexWrap: 'wrap'}}
                >
                    <Button
                        className="qa-DataPackShareDialog-Button-groups"
                        variant="contained"
                        style={styles.groupsButton}
                        data-testid={'groupsToggle'}
                        onClick={toggleView}
                    >
                        {`GROUPS (${groupCount})`}
                    </Button>
                    <Button
                        className="qa-DataPackShareDialog-Button-members"
                        style={styles.membersButton}
                        data-testid={'membersToggle'}
                        onClick={toggleView}
                    >
                        {`MEMBERS (${memberCount})`}
                    </Button>
                    <div
                        className="qa-DataPackShareDialog-buttonUnderline"
                        style={{
                            height: '2px',
                            width: '100%',
                            backgroundColor: colors.primary,
                            flex: '0 0 auto',
                        }}
                    />
                </div>
            </div>
            {props.job && renderSharedPermissions()}
            <BaseDialog
                show={showPublicWarning}
                onClose={hideWarning}
                title="SHARE WITH ALL MEMBERS"
                overlayStyle={{zIndex: 1501}}
                actions={[
                    <Button
                        data-testid={'publicSave'}
                        style={{margin: '0px'}}
                        variant="contained"
                        color="primary"
                        onClick={handleSave}
                        key="save"
                    >
                        SHARE
                    </Button>,
                    <Button
                        style={{margin: '0px', float: 'left'}}
                        variant="text"
                        color="primary"
                        onClick={hideWarning}
                        key="edit"
                    >
                        CONTINUE EDITING
                    </Button>,
                ]}
            >
                Sharing with all members will make this DataPack visible to everyone with an EventKit account.
                Are you sure you want to share it with everyone?
            </BaseDialog>
        </ShareBaseDialog>
    );
};

const mapStateToProps = state => (
    {
        groups: state.groups.groups,
        users: state.users.users,
        userCount: state.users.total - 1,
        permissionState: state.updatePermission,
    }
);

export default withTheme(connect(mapStateToProps)(DataPackShareDialog));
