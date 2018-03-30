import React, { Component, PropTypes } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import ShareBaseDialog from './ShareBaseDialog';
import GroupsBody from './GroupsBody';
import MembersBody from './MembersBody';
import ShareInfoBody from './ShareInfoBody';

export class DataPackShareDialog extends Component {
    constructor(props) {
        super(props);
        this.handleSave = this.handleSave.bind(this);
        this.handleGroupUpdate = this.handleGroupUpdate.bind(this);
        this.handleMemberUpdate = this.handleMemberUpdate.bind(this);
        this.showShareInfo = this.showShareInfo.bind(this);
        this.hideShareInfo = this.hideShareInfo.bind(this);
        this.toggleView = this.toggleView.bind(this);
        this.forceUpdate = this.forceUpdate.bind(this);
        const permissions = this.getSplitPermissions(this.props.user, this.props.permissions);
        this.state = {
            view: 'groups',
            // Make a copy of the permissions so we can modify it locally
            // we split out permission the user should not see
            // they will get added back in onSave
            unusedPermissions: permissions[1],
            permissions: permissions[0],
            showShareInfo: false,
        };
    }

    getSplitPermissions(user, permissions) {
        const { username } = user.user;
        const unused = {
            groups: {},
            members: {},
        };
        const used = { ...permissions };
        // if the current user is in the permission we dont want keep them in the member permissions
        if (used.members[username] !== undefined) {
            unused.members[username] = used.members[username];
            used.members[username] = null;
            delete used.members[username];
        }
        // if the user is not in a group we dont want to keep it in the group permissions
        Object.keys(used.groups).forEach((key) => {
            if (!this.props.groups.find(g => g.name === key)) {
                unused.groups[key] = used.groups[key];
                used.groups[key] = null;
                delete used.groups[key];
            }
        });
        console.log({ ...used });
        console.log({ ...unused });
        return [used, unused];
    }

    getCombinedGroups() {
        const permissions = {
            value: this.state.permissions.value,
            groups: { ...this.state.unusedPermissions.groups, ...this.state.permissions.groups },
            members: { ...this.state.unusedPermissions.members, ...this.state.permissions.members },
        };
        return permissions;
    }

    handleSave() {
        const permissions = this.getCombinedGroups();
        console.log(permissions);
        if (Object.keys(permissions.members).length || Object.keys(permissions.groups).length) {
            permissions.value = 'SHARED';
            if (Object.keys(permissions.members).length === this.props.members.length) {
                permissions.value = 'PUBLIC';
            }
        } else {
            permissions.value = 'PRIVATE';
        }
        this.props.onSave(permissions);
    }

    handleGroupUpdate(groups) {
        const permissions = { ...this.state.permissions };
        permissions.groups = groups;
        this.setState({ permissions });
    }

    handleMemberUpdate(members) {
        const permissions = { ...this.state.permissions };
        permissions.members = members;
        this.setState({ permissions });
    }

    showShareInfo() {
        this.setState({ showShareInfo: true });
    }

    hideShareInfo() {
        this.setState({ showShareInfo: false });
    }

    toggleView() {
        if (this.state.view === 'groups') {
            this.setState({ view: 'members' });
        } else {
            this.setState({ view: 'groups' });
        }
    }

    render() {
        const styles = {
            fixedHeader: {
                position: 'sticky',
                top: 0,
                left: 0,
                backgroundColor: '#fff',
                zIndex: 15,
                padding: '0px 10px',
            },
            groupsButton: {
                flex: '1 1 auto',
                borderRadius: '0px',
                backgroundColor: this.state.view === 'groups' ? '#4598bf' : 'whitesmoke',
                boxShadow: 'none',
            },
            membersButton: {
                flex: '1 1 auto',
                borderRadius: '0px',
                backgroundColor: this.state.view === 'members' ? '#4598bf' : 'whitesmoke',
                boxShadow: 'none',
            },
            textField: {
                fontSize: '14px',
                backgroundColor: 'whitesmoke',
                height: '36px',
                lineHeight: '36px',
                margin: '10px 0px',
            },
            characterLimit: {
                bottom: '0px',
                height: '100%',
                display: 'flex',
                transform: 'none',
                alignItems: 'center',
                fontSize: '14px',
            },
        };

        let body = null;
        if (this.state.showShareInfo) {
            body = (
                <ShareInfoBody
                    view={this.state.view}
                    onReturn={this.hideShareInfo}
                />
            );
        } else if (this.state.view === 'groups') {
            body = (
                <GroupsBody
                    groups={this.props.groups}
                    members={this.props.members}
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
                    members={this.props.members}
                    selectedMembers={this.state.permissions.members}
                    membersText={this.props.membersText}
                    onMembersUpdate={this.handleMemberUpdate}
                    canUpdateAdmin={this.props.canUpdateAdmin}
                    handleShowShareInfo={this.showShareInfo}
                />
            );
        }

        let groupCount = Object.keys(this.state.permissions.groups).length;
        if (groupCount === this.props.groups.length) {
            groupCount = 'ALL';
        }

        let memberCount = Object.keys(this.state.permissions.members).length;
        if (memberCount === this.props.members.length) {
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
                        <RaisedButton
                            className="qa-DataPackShareDialog-RaisedButton-groups"
                            label={`GROUPS (${groupCount})`}
                            style={styles.groupsButton}
                            labelColor={this.state.view === 'groups' ? '#fff' : '#4598bf'}
                            backgroundColor={this.state.view === 'groups' ? '#4598bf' : 'whitesmoke'}
                            onClick={this.toggleView}
                        />
                        <RaisedButton
                            className="qa-DataPackShareDialog-RaisedButton-members"
                            label={`MEMBERS (${memberCount})`}
                            style={styles.membersButton}
                            labelColor={this.state.view === 'members' ? '#fff' : '#4598bf'}
                            backgroundColor={this.state.view === 'members' ? '#4598bf' : 'whitesmoke'}
                            onClick={this.toggleView}
                        />
                        <div
                            className="qa-DataPackShareDialog-buttonUnderline"
                            style={{
                                height: '2px',
                                width: '100%',
                                backgroundColor: '#4598bf',
                                flex: '0 0 auto',
                            }}
                        />
                    </div>
                </div>
                {body}
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
};

DataPackShareDialog.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    user: PropTypes.shape({
        user: PropTypes.object,
        groups: PropTypes.arrayOf(PropTypes.number),
    }).isRequired,
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    members: PropTypes.arrayOf(PropTypes.shape({
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
};

export default DataPackShareDialog;
