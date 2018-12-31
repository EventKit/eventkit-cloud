import { connect } from 'react-redux';
import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import ShareBaseDialog from './ShareBaseDialog';
import GroupsBody from './GroupsBody';
import MembersBody from './MembersBody';
import ShareInfoBody from './ShareInfoBody';
import BaseDialog from '../Dialog/BaseDialog';
import { Permissions, Levels } from '../../utils/permissions';

export interface Props {
    show: boolean;
    onClose: () => void;
    onSave: (perms: Eventkit.Permissions) => void;
    user: Eventkit.User;
    groups: Eventkit.Group[];
    users: Eventkit.User[];
    permissions: Eventkit.Permissions;
    groupsText: any;
    membersText: any;
    canUpdateAdmin: boolean;
    submitButtonLabel: string;
    title: any;
    warnPublic: boolean;
    theme: Eventkit.Theme & Theme;
}

export interface State {
    view: 'groups' | 'members';
    permissions: Eventkit.Permissions;
    showShareInfo: boolean;
    showPublicWarning: boolean;
}

export class DataPackShareDialog extends React.Component<Props, State> {
    static defaultProps = {
        submitButtonLabel: 'SAVE',
        title: 'SHARE',
        groupsText: '',
        membersText: '',
        canUpdateAdmin: false,
        user: null,
        warnPublic: false,
    };

    private permissions: Permissions;
    constructor(props: Props) {
        super(props);
        this.handleSave = this.handleSave.bind(this);
        this.handleUserCheck = this.handleUserCheck.bind(this);
        this.handleGroupCheck = this.handleGroupCheck.bind(this);
        this.handleAdminCheck = this.handleAdminCheck.bind(this);
        this.handleAdminGroupCheck = this.handleAdminGroupCheck.bind(this);
        this.handleCurrentCheck = this.handleCurrentCheck.bind(this);
        this.handlePublicCheck = this.handlePublicCheck.bind(this);
        this.handleGroupCheckAll = this.handleGroupCheckAll.bind(this);
        this.handleUncheckAll = this.handleUncheckAll.bind(this);
        this.handleGroupUncheckAll = this.handleGroupUncheckAll.bind(this);
        this.showShareInfo = this.showShareInfo.bind(this);
        this.hideShareInfo = this.hideShareInfo.bind(this);
        this.showPublicWarning = this.showPublicWarning.bind(this);
        this.hidePublicWarning = this.hidePublicWarning.bind(this);
        this.toggleView = this.toggleView.bind(this);
        this.permissions = new Permissions(this.props.permissions);
        this.state = {
            view: 'groups',
            // Make a copy of the permissions so we can modify it locally
            permissions: this.permissions.getPermissions(),
            showShareInfo: false,
            showPublicWarning: false,
        };
    }

    componentDidUpdate(prevProps: Props) {
        if (!prevProps.show && this.props.show) {
            this.permissions.setPermissions(this.props.permissions);
            this.permissions.setUsername(this.props.user ? this.props.user.user.username : undefined);
            this.permissions.extractCurrentUser();
            this.setState({ permissions: this.permissions.getPermissions() });
        }
    }

    private handleSave() {
        if (this.permissions.isPrivate()) {
            if (this.permissions.getMemberCount() || this.permissions.getGroupCount()) {
                this.permissions.makeShared();
            }
        } else if (this.permissions.isShared()) {
            if (!this.permissions.getMemberCount() && !this.permissions.getGroupCount()) {
                this.permissions.makePrivate();
            }
        } else if (this.props.warnPublic) {
            if (!this.state.showPublicWarning) {
                this.setState({ showPublicWarning: true });
                return;
            }
            this.setState({ showPublicWarning: false });
        }

        if (this.permissions.getUserPermissions()) {
            this.permissions.insertCurrentUser();
        }

        this.props.onSave(this.permissions.getPermissions());
    }

    private handleUserCheck(username: string) {
        if (this.permissions.isPublic()) {
            this.permissions.makeShared();
        }
        if (this.permissions.userHasPermission(username)) {
            this.permissions.removeMemberPermission(username);
        } else {
            this.permissions.setMemberPermission(username, Levels.READ);
        }
        this.setState({ permissions: this.permissions.getPermissions() });
    }

    private handleGroupCheck(groupname: string) {
        if (this.permissions.groupHasPermission(groupname)) {
            this.permissions.removeGroupPermissions(groupname);
        } else {
            this.permissions.setGroupPermission(groupname, Levels.READ);
        }
        this.setState({ permissions: this.permissions.getPermissions() });
    }

    private handleAdminCheck(username: string) {
        if (this.permissions.userHasPermission(username, Levels.ADMIN)) {
            this.permissions.setMemberPermission(username, Levels.READ);
        } else {
            this.permissions.setMemberPermission(username, Levels.ADMIN);
        }
        this.setState({ permissions: this.permissions.getPermissions() });
    }

    private handleAdminGroupCheck(groupname: string) {
        if (this.permissions.groupHasPermission(groupname, Levels.ADMIN)) {
            this.permissions.setGroupPermission(groupname, Levels.READ);
        } else {
            this.permissions.setGroupPermission(groupname, Levels.ADMIN);
        }
        this.setState({ permissions: this.permissions.getPermissions() });
    }

    private handleCurrentCheck() {
        this.props.users.forEach((user) => {
            const { username } = user.user;
            if (!this.permissions.userHasPermission(username)) {
                this.permissions.setMemberPermission(username, Levels.READ);
            }
        });
        this.setState({ permissions: this.permissions.getPermissions() });
    }

    private handlePublicCheck() {
        this.permissions.makePublic();
        this.setState({ permissions: this.permissions.getPermissions() });
    }

    private handleGroupCheckAll() {
        this.props.groups.forEach((group) => {
            const { name } = group;
            if (!this.permissions.groupHasPermission(name)) {
                this.permissions.setGroupPermission(name, Levels.READ);
            }
        });
        this.setState({ permissions: this.permissions.getPermissions() });
    }

    private handleUncheckAll() {
        this.permissions.setMembers({});
        if (this.permissions.isPublic()) {
            this.permissions.makeShared();
        }
        this.setState({ permissions: this.permissions.getPermissions() });
    }

    private handleGroupUncheckAll() {
        this.permissions.setGroups({});
        this.setState({ permissions: this.permissions.getPermissions() });
    }

    private showShareInfo() {
        this.setState({ showShareInfo: true });
    }

    private hideShareInfo() {
        this.setState({ showShareInfo: false });
    }

    private showPublicWarning() {
        this.setState({ showPublicWarning: true });
    }

    private hidePublicWarning() {
        this.setState({ showPublicWarning: false });
    }

    private toggleView() {
        if (this.state.view === 'groups') {
            this.setState({ view: 'members' });
        } else {
            this.setState({ view: 'groups' });
        }
    }

    render() {
        if (!this.props.show) {
            return null;
        }

        const { colors } = this.props.theme.eventkit;

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
                backgroundColor: this.state.view === 'groups' ? colors.primary : colors.secondary,
                boxShadow: 'none',
                color: this.state.view === 'groups' ? colors.white : colors.primary,
            },
            membersButton: {
                flex: '1 1 auto',
                borderRadius: '0px',
                backgroundColor: this.state.view === 'members' ? colors.primary : colors.secondary,
                boxShadow: 'none',
                color: this.state.view === 'members' ? colors.white : colors.primary,
            },
        };

        if (this.state.showShareInfo) {
            return (
                <ShareBaseDialog
                    show={this.props.show}
                    onClose={this.props.onClose}
                    handleSave={this.handleSave}
                    title={this.props.title}
                    submitButtonLabel={this.props.submitButtonLabel}
                    className="qa-DataPackShareDialog"
                >
                    <ShareInfoBody
                        view={this.state.view}
                        onReturn={this.hideShareInfo}
                    />
                </ShareBaseDialog>
            );
        }

        const groupCount: number = Object.keys(this.permissions.getGroups()).length;
        let memberCount: number | string = Object.keys(this.permissions.getMembers()).length;
        if (this.permissions.isPublic()) {
            memberCount = 'ALL';
        }

        return (
            <ShareBaseDialog
                show={this.props.show}
                onClose={this.props.onClose}
                handleSave={this.handleSave}
                title={this.props.title}
                submitButtonLabel={this.props.submitButtonLabel}
                className="qa-DataPackShareDialog"
            >
                <div style={styles.fixedHeader} className="qa-DataPackShareDialog-container">
                    <div
                        className="qa-DataPackShareDialog-headers"
                        style={{ display: 'flex', flexWrap: 'wrap' }}
                    >
                        <Button
                            className="qa-DataPackShareDialog-Button-groups"
                            variant="contained"
                            style={styles.groupsButton}

                            onClick={this.toggleView}
                        >
                            {`GROUPS (${groupCount})`}
                        </Button>
                        <Button
                            className="qa-DataPackShareDialog-Button-members"
                            style={styles.membersButton}
                            onClick={this.toggleView}
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
                {this.state.view === 'groups' ?
                    <GroupsBody
                        selectedGroups={this.state.permissions.groups}
                        groupsText={this.props.groupsText}
                        onGroupCheck={this.handleGroupCheck}
                        onAdminCheck={this.handleAdminGroupCheck}
                        onCheckAll={this.handleGroupCheckAll}
                        onUncheckAll={this.handleGroupUncheckAll}
                        canUpdateAdmin={this.props.canUpdateAdmin}
                        handleShowShareInfo={this.showShareInfo}
                    />
                    :
                    <MembersBody
                        public={this.state.permissions.value === 'PUBLIC'}
                        selectedMembers={this.state.permissions.members}
                        membersText={this.props.membersText}
                        onMemberCheck={this.handleUserCheck}
                        onAdminCheck={this.handleAdminCheck}
                        onCheckCurrent={this.handleCurrentCheck}
                        onCheckAll={this.handlePublicCheck}
                        onUncheckAll={this.handleUncheckAll}
                        canUpdateAdmin={this.props.canUpdateAdmin}
                        handleShowShareInfo={this.showShareInfo}
                    />
                }
                <BaseDialog
                    show={this.state.showPublicWarning}
                    onClose={this.hidePublicWarning}
                    title="SHARE WITH ALL MEMBERS"
                    overlayStyle={{ zIndex: 1501 }}
                    actions={[
                        <Button
                            style={{ margin: '0px' }}
                            variant="contained"
                            color="primary"
                            onClick={this.handleSave}
                            key="save"
                        >
                            SHARE
                        </Button>,
                        <Button
                            style={{ margin: '0px', float: 'left' }}
                            variant="text"
                            color="primary"
                            onClick={this.hidePublicWarning}
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
    }
}

const mapStateToProps = state => (
    {
        groups: state.groups.groups,
        users: state.users.users,
        userCount: state.users.total - 1,
    }
);

export default withTheme()(connect(mapStateToProps)(DataPackShareDialog));
