import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import ButtonBase from '@material-ui/core/ButtonBase';
import Popover from '@material-ui/core/Popover';
import SocialGroup from '@material-ui/icons/Group';
import Check from '@material-ui/icons/Check';
import Edit from '@material-ui/icons/Edit';
import Lock from '@material-ui/icons/LockOutlined';
import moment from 'moment';
import DayPicker from 'react-day-picker';
import 'react-day-picker/lib/style.css';
import DropDownMenu from '../common/DropDownMenu';
import CustomTableRow from '../CustomTableRow';
import DataPackShareDialog from '../DataPackShareDialog/DataPackShareDialog';

export class DataPackStatusTable extends Component {
    constructor(props) {
        super(props);
        this.handleShareDialogOpen = this.handleShareDialogOpen.bind(this);
        this.handleShareDialogClose = this.handleShareDialogClose.bind(this);
        this.handleShareDialogSave = this.handleShareDialogSave.bind(this);
        this.handleDropDownChange = this.handleDropDownChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleDayClick = this.handleDayClick.bind(this);
        this.state = {
            shareDialogOpen: false,
            anchor: null,
        };
    }

    handleDayClick(date) {
        this.handleClose();
        this.props.handleExpirationChange(date);
    }

    handleClick(e) {
        this.setState({ anchor: e.currentTarget });
    }

    handleClose() {
        this.setState({ anchor: null });
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

    handleDropDownChange(value) {
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
        const { colors } = this.props.theme.eventkit;

        const styles = {
            textField: {
                fontSize: '14px',
                height: '36px',
                width: '0px',
            },
            dropDown: {
                height: '24px',
                margin: '0px 5px 0px 0px',
                lineHeight: '24px',
                flex: '0 0 auto',
                color: colors.text_primary,
                backgroundColor: 'transparent',
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'capitalize',
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
                fill: colors.primary,
                verticalAlign: 'middle',
            },
            checkIcon: {
                fill: colors.text_primary,
                height: '24px',
                verticalAlign: 'middle',
                marginLeft: '30px',
            },
            permissionsIcon: {
                fill: colors.text_primary,
                height: '24px',
                verticalAlign: 'middle',
                marginRight: '5px',
            },
            item: {
                color: colors.text_primary,
                fontSize: '14px',
                padding: '6px 16px',
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
                    <Edit
                        onClick={this.handleClick}
                        style={styles.tableRowInfoIcon}
                    />
                    <Popover
                        className="qa-DataPackStatusTable-Popover"
                        open={Boolean(this.state.anchor)}
                        anchorEl={this.state.anchor}
                        onClose={this.handleClose}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                        }}
                    >
                        <style>{'.DayPicker-Day { width: 34px; } .DayPicker { font-size: 14px; } '}</style>
                        <DayPicker
                            onDayClick={this.handleDayClick}
                            selectedDays={new Date(this.props.expiration)}
                            month={new Date(this.props.expiration)}
                            modifiers={{ disabled: { before: this.props.minDate, after: this.props.maxDate } }}
                            modifiersStyles={{ selected: { backgroundColor: colors.primary } }}
                            className="qa-DataPackStatusTable-DayPicker"
                        />
                    </Popover>
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
                    <ButtonBase
                        className="qa-DataPackStatusTable-MembersAndGroups-button"
                        key="membersAndGroupsButton"
                        onClick={this.handleShareDialogOpen}
                        style={{ color: colors.primary, textDecoration: 'underline', padding: '0px 5px' }}
                        disabled={!this.props.adminPermissions}
                    >
                        {memberText} / {groupText}
                    </ButtonBase>
                );
            }

            permissionData = [
                <DropDownMenu
                    key="permissionsMenu"
                    className="qa-DataPackStatusTable-DropDownMenu-published"
                    value={this.props.permissions.value !== 'PRIVATE' ?
                        <span>{permissionsIcons.members} Share</span>
                        :
                        <span>{permissionsIcons.private} Private</span>
                    }
                    style={styles.dropDown}
                    underlineStyle={styles.underline}
                >
                    <MenuItem
                        key="private"
                        className="qa-DataPackStatusTable-MenuItem-permissionPrivate"
                        style={styles.item}
                        onClick={() => this.handleDropDownChange('PRIVATE')}
                    >
                        <div>
                            {permissionsIcons.private}
                            Private
                            {permissionsIcons.privateCheck}
                        </div>
                    </MenuItem>
                    <MenuItem
                        key="members"
                        className="qa-DataPackStatusTable-MenuItem-permissionMembers"
                        style={styles.item}
                        onClick={() => this.handleDropDownChange(this.props.permissions.value === 'PUBLIC' ? 'PUBLIC' : 'SHARED')}
                    >
                        <div>
                            {permissionsIcons.members}
                            Share
                            {permissionsIcons.membersCheck}
                        </div>
                    </MenuItem>
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
                    dataStyle={{ flexWrap: 'wrap', padding: '5px 10px' }}
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
    theme: PropTypes.object.isRequired,
};

export default withTheme()(DataPackStatusTable);
