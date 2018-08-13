import PropTypes from 'prop-types';
import React, { Component } from 'react';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import DatePicker from 'material-ui/DatePicker';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import SocialGroup from 'material-ui/svg-icons/social/group';
import Check from 'material-ui/svg-icons/navigation/check';
import Edit from 'material-ui/svg-icons/image/edit';
import Lock from 'material-ui/svg-icons/action/lock-outline';
import moment from 'moment';
import CustomTableRow from '../CustomTableRow';
import DataPackShareDialog from '../DataPackShareDialog/DataPackShareDialog';

export class DataPackStatusTable extends Component {
    constructor(props) {
        super(props);
        this.handleShareDialogOpen = this.handleShareDialogOpen.bind(this);
        this.handleShareDialogClose = this.handleShareDialogClose.bind(this);
        this.handleShareDialogSave = this.handleShareDialogSave.bind(this);
        this.handleDropDownChange = this.handleDropDownChange.bind(this);
        this.state = {
            shareDialogOpen: false,
        };
    }

    handleShareDialogOpen() {
        this.setState({ shareDialogOpen: true });
    }

    handleShareDialogClose() {
        this.setState({ shareDialogOpen: false });
    }

    handleShareDialogSave(permissions) {
        this.props.handlePermissionsChange({ ...permissions });
        this.handleShareDialogClose();
    }

    handleDropDownChange(e, k, value) {
        // update the value in permissions
        // if new value is private, remove all but the logged in user
        const permissions = { ...this.props.permissions, value };
        if (value === 'PRIVATE') {
            permissions.groups = {};
            if (permissions.members[this.props.user.user.username] === 'ADMIN') {
                permissions.members = {};
                permissions.members[this.props.user.user.username] = 'ADMIN';
            } else {
                permissions.members = {};
            }
        }
        this.props.handlePermissionsChange(permissions);
    }

    render() {
        const styles = {
            textField: {
                fontSize: '14px',
                height: '36px',
                width: '0px',
                display: 'inlineBlock',
            },
            dropDown: {
                height: '24px',
                margin: '0px 5px 0px 0px',
                lineHeight: '24px',
                flex: '0 0 auto',
            },
            icon: {
                height: '24px',
                width: '24px',
                padding: '0px',
                fill: '#4498c0',
                position: 'relative',
                top: '0px',
                right: '0px',
                verticalAlign: 'top',
            },
            label: {
                lineHeight: '24px',
                height: '24px',
                color: '#8b9396',
                paddingLeft: '0px',
                fontSize: '14px',
                fontWeight: 600,
                paddingRight: '0px',
                display: 'inline-block',
            },
            list: {
                paddingTop: '10px',
                paddingBottom: '10px',
                display: 'inlineBlock',
            },
            underline: {
                display: 'none',
                marginLeft: '0px',
            },
            tableRowInfoIcon: {
                marginLeft: '10px',
                height: '18px',
                width: '18px',
                cursor: 'pointer',
                display: 'inlineBlock',
                fill: '#4598bf',
                verticalAlign: 'middle',
            },
            checkIcon: {
                fill: '#8b9396',
                height: '24px',
                verticalAlign: 'middle',
            },
            permissionsIcon: {
                fill: '#8b9396',
                height: '24px',
                verticalAlign: 'middle',
                marginRight: '5px',
            },
        };

        const checkIcon = <Check style={styles.checkIcon} />;
        const permissionsIcons = {
            private: <Lock style={styles.permissionsIcon} />,
            members: <SocialGroup style={styles.permissionsIcon} />,
            privateCheck: this.props.permissions.value === 'PRIVATE' ? checkIcon : null,
            membersCheck: this.props.permissions.value !== 'PRIVATE' ? checkIcon : null,
        };

        const expiration = moment(this.props.expiration).format('M/D/YY');

        let expirationData = expiration;
        let permissionData = <div>{permissionsIcons.members}Shared</div>;

        if (this.props.adminPermissions) {
            expirationData = (
                <div>
                    {expiration}
                    <DatePicker
                        ref={(instance) => { this.dp = instance; }}
                        style={{ height: '0px', display: '-webkit-inline-box', width: '0px' }}
                        autoOk
                        minDate={this.props.minDate}
                        maxDate={this.props.maxDate}
                        id="datePicker"
                        onChange={this.props.handleExpirationChange}
                        textFieldStyle={styles.textField}
                        underlineStyle={{ display: 'none' }}
                        disabled
                    />
                    <Edit
                        onClick={() => { this.dp.focus(); }}
                        style={styles.tableRowInfoIcon}
                    />
                </div>
            );

            let membersAndGroups = null;
            if (this.props.permissions.value !== 'PRIVATE') {
                const groupCount = Object.keys(this.props.permissions.groups).length;
                let memberCount = Object.keys(this.props.permissions.members).length;
                if (this.props.permissions.members[this.props.user.user.username] !== undefined) {
                    memberCount -= 1;
                }

                let groupText = '';
                if (groupCount === 0) {
                    groupText = 'No Groups';
                } else if (groupCount === this.props.groups.length) {
                    groupText = 'All Groups';
                } else if (groupCount === 1) {
                    groupText = '1 Group';
                } else {
                    groupText = `${groupCount} Groups`;
                }

                let memberText = '';
                if (memberCount === 0) {
                    memberText = 'No Members';
                } else if (memberCount === this.props.members.length) {
                    memberText = 'All Members';
                } else if (memberCount === 1) {
                    memberText = '1 Member';
                } else {
                    memberText = `${memberCount} Members`;
                }

                membersAndGroups = (
                    <EnhancedButton
                        className="qa-DataPackStatusTable-MembersAndGroups-button"
                        key="membersAndGroupsButton"
                        onClick={this.handleShareDialogOpen}
                        style={{ color: '#4598bf', textDecoration: 'underline', padding: '0px 5px' }}
                        disabled={!this.props.adminPermissions}
                    >
                        {memberText} / {groupText}
                    </EnhancedButton>
                );
            }

            permissionData = [
                <DropDownMenu
                    key="permissionsMenu"
                    className="qa-DataPackStatusTable-DropDownMenu-published"
                    value={this.props.permissions.value}
                    onChange={this.handleDropDownChange}
                    style={styles.dropDown}
                    labelStyle={styles.label}
                    iconStyle={styles.icon}
                    listStyle={styles.list}
                    selectedMenuItemStyle={{ color: '#8b9396' }}
                    underlineStyle={styles.underline}
                >
                    <MenuItem
                        value="PRIVATE"
                        className="qa-DataPackStatusTable-MenuItem-permissionPrivate"
                        rightIcon={permissionsIcons.privateCheck}
                        primaryText={
                            <div>
                                {permissionsIcons.private}
                                Private
                            </div>
                        }
                        style={{ color: '#8b9396' }}
                    />
                    <MenuItem
                        value={this.props.permissions.value === 'PUBLIC' ? 'PUBLIC' : 'SHARED'}
                        className="qa-DataPackStatusTable-MenuItem-permissionMembers"
                        rightIcon={permissionsIcons.membersCheck}
                        primaryText={
                            <div>
                                {permissionsIcons.members}
                                Share
                            </div>
                        }
                        style={{ color: '#8b9396' }}
                    />
                </DropDownMenu>,
                membersAndGroups,
            ];
        }

        return (
            <div>
                <CustomTableRow
                    className="qa-DataPackTableRow-Export"
                    title="Export"
                    data={this.props.status}
                    titleStyle={{ backgroundColor: this.props.statusColor }}
                    dataStyle={{
                        backgroundColor: this.props.statusColor,
                        color: this.props.statusFontColor,
                    }}
                />
                <CustomTableRow
                    title="Expires"
                    data={expirationData}
                />
                <CustomTableRow
                    title="Permissions"
                    dataStyle={{ flexWrap: 'wrap' }}
                    data={permissionData}
                />
                <DataPackShareDialog
                    show={this.state.shareDialogOpen}
                    user={this.props.user}
                    onClose={this.handleShareDialogClose}
                    onSave={this.handleShareDialogSave}
                    groups={this.props.groups}
                    members={this.props.members}
                    permissions={this.props.permissions}
                    groupsText="You may share view and edit rights with groups exclusively.
                     Group sharing is managed separately from member sharing"
                    membersText="You may share view and edit rights with members exclusively.
                     Member sharing is managed separately from group sharing"
                    canUpdateAdmin
                    warnPublic
                />
            </div>
        );
    }
}

DataPackStatusTable.defaultProps = {
    minDate: null,
    maxDate: null,
    statusColor: null,
    statusFontColor: null,
    adminPermissions: false,
};

DataPackStatusTable.propTypes = {
    status: PropTypes.string.isRequired,
    expiration: PropTypes.string.isRequired,
    permissions: PropTypes.shape({
        value: PropTypes.oneOf([
            'PUBLIC',
            'PRIVATE',
            'SHARED',
        ]),
        groups: PropTypes.objectOf(PropTypes.string),
        members: PropTypes.objectOf(PropTypes.string),
    }).isRequired,
    minDate: PropTypes.instanceOf(Date),
    maxDate: PropTypes.instanceOf(Date),
    handleExpirationChange: PropTypes.func.isRequired,
    handlePermissionsChange: PropTypes.func.isRequired,
    statusColor: PropTypes.string,
    statusFontColor: PropTypes.string,
    members: PropTypes.arrayOf(PropTypes.shape({
        user: PropTypes.shape({
            username: PropTypes.string,
            first_name: PropTypes.string,
            last_name: PropTypes.string,
            email: PropTypes.string,
        }),
        groups: PropTypes.arrayOf(PropTypes.number),
    })).isRequired,
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    adminPermissions: PropTypes.bool,
    user: PropTypes.shape({
        user: PropTypes.object,
        groups: PropTypes.arrayOf(PropTypes.number),
    }).isRequired,
};

export default DataPackStatusTable;
