import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import ShareBaseDialog from './ShareBaseDialog';
import GroupsBody from './GroupsBody';
import MembersBody from './MembersBody';
import ShareInfoBody from './ShareInfoBody';
import BaseDialog from '../Dialog/BaseDialog';
import { Permissions, Levels } from '../../utils/permissions';

export class DataPackShareDialog extends Component {
    constructor(props) {
        super(props);
        this.handleSave = this.handleSave.bind(this);
        this.handleGroupUpdate = this.handleGroupUpdate.bind(this);
        this.handleUserCheck = this.handleUserCheck.bind(this);
        this.handleAdminCheck = this.handleAdminCheck.bind(this);
        this.handleCurrentCheck = this.handleCurrentCheck.bind(this);
        this.handlePublicCheck = this.handlePublicCheck.bind(this);
        this.handleUncheckAll = this.handleUncheckAll.bind(this);
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

    componentDidUpdate(prevProps) {
        if (!prevProps.show && this.props.show) {
            this.permissions.setPermissions(this.props.permissions);
            this.permissions.setUsername(this.props.user ? this.props.user.user.username : undefined);
            this.permissions.extractCurrentUser();
            this.setState({ permissions: this.permissions.getPermissions() });
        }
    }

    handleSave() {
        if (this.permissions.isShared()) {
            if (!this.permissions.getMemberCount() && !this.permissions.getGroupCount()) {
                this.permissions.makePrivate();
            }
        }

        if (this.permissions.getUserPermissions()) {
            this.permissions.insertCurrentUser();
        }

        this.props.onSave(this.permissions.getPermissions());
    }

    handleGroupUpdate(groups) {
        this.permissions.setGroups(groups);
        this.setState({ permissions: this.permissions.getPermissions() });
    }

    handleUserCheck(username) {
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

    handleAdminCheck(username) {
        if (this.permissions.userHasPermission(username, Levels.ADMIN)) {
            this.permissions.setMemberPermission(username, Levels.READ);
        } else {
            this.permissions.setMemberPermission(username, Levels.ADMIN);
        }
        this.setState({ permissions: this.permissions.getPermissions() });
    }

    handleCurrentCheck() {
        this.props.users.forEach((user) => {
            const { username } = user.user;
            if (!this.permissions.userHasPermission(username)) {
                this.permissions.setMemberPermission(username, Levels.READ);
            }
        });
        this.setState({ permissions: this.permissions.getPermissions() });
    }

    handlePublicCheck() {
        this.permissions.makePublic();
        this.setState({ permissions: this.permissions.getPermissions() });
    }

    handleUncheckAll() {
        this.permissions.setMembers({});
        if (this.permissions.isPublic()) {
            this.permissions.makeShared();
        }
        this.setState({ permissions: this.permissions.getPermissions() });
    }

    showShareInfo() {
        this.setState({ showShareInfo: true });
    }

    hideShareInfo() {
        this.setState({ showShareInfo: false });
    }

    showPublicWarning() {
        this.setState({ showPublicWarning: true });
    }

    hidePublicWarning() {
        this.setState({ showPublicWarning: false });
    }

    toggleView() {
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
                position: 'sticky',
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

        let body = null;
        if (this.state.view === 'groups') {
            body = (
                <GroupsBody
                    groups={this.props.groups}
                    members={this.props.users}
                    selectedGroups={this.state.permissions.groups}
                    groupsText={this.props.groupsText}
                    onGroupsUpdate={this.handleGroupUpdate}
                    canUpdateAdmin={this.props.canUpdateAdmin}
                    handleShowShareInfo={this.showShareInfo}
                />
            );
        } else {
            body = (
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
            );
        }

        let groupCount = Object.keys(this.permissions.getGroups()).length;
        if (groupCount === this.props.groups.length && this.props.groups.length !== 0) {
            groupCount = 'ALL';
        }

        let memberCount = Object.keys(this.permissions.getMembers()).length;
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
                {body}
                {this.state.showPublicWarning ?
                    <BaseDialog
                        show
                        onClose={this.hidePublicWarning}
                        title="SHARE WITH ALL MEMBERS"
                        overlayStyle={{ zIndex: 1501 }}
                        actions={[
                            <Button
                                style={{ margin: '0px' }}
                                variant="contained"
                                color="primary"
                                onClick={this.handleSave}
                            >
                                SHARE
                            </Button>,
                            <Button
                                style={{ margin: '0px', float: 'left' }}
                                variant="text"
                                color="primary"
                                label="CONTINUE EDITING"
                                onClick={this.hidePublicWarning}
                            >
                                CONTINUE EDITING
                            </Button>,
                        ]}
                    >
                        Sharing with all members will make this DataPack visible to everyone with an EventKit account.
                        Are you sure you want to share it with everyone?
                    </BaseDialog>
                    :
                    null
                }
            </ShareBaseDialog>
        );
    }
}

DataPackShareDialog.defaultProps = {
    submitButtonLabel: 'SAVE',
    title: 'SHARE',
    groupsText: '',
    membersText: '',
    canUpdateAdmin: false,
    user: null,
    warnPublic: false,
};

DataPackShareDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    user: PropTypes.shape({
        user: PropTypes.object,
        groups: PropTypes.arrayOf(PropTypes.number),
    }),
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    users: PropTypes.arrayOf(PropTypes.shape({
        user: PropTypes.shape({
            username: PropTypes.string,
            first_name: PropTypes.string,
            last_name: PropTypes.string,
            email: PropTypes.string,
            date_joined: PropTypes.string,
            last_login: PropTypes.string,
        }),
        accepted_licenses: PropTypes.object,
        groups: PropTypes.arrayOf(PropTypes.number),
    })).isRequired,
    permissions: PropTypes.shape({
        groups: PropTypes.objectOf(PropTypes.string),
        members: PropTypes.objectOf(PropTypes.string),
    }).isRequired,
    groupsText: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.string,
    ]),
    membersText: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.arrayOf(PropTypes.node),
        PropTypes.string,
    ]),
    canUpdateAdmin: PropTypes.bool,
    submitButtonLabel: PropTypes.string,
    title: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.string,
    ]),
    warnPublic: PropTypes.bool,
    theme: PropTypes.object.isRequired,
};

const mapStateToProps = state => (
    {
        groups: state.groups.groups,
        users: state.users.users,
        userCount: state.users.total - 1,
    }
);

export default withTheme()(connect(mapStateToProps, undefined)(DataPackShareDialog));
