import React, { PropTypes, Component } from 'react';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import DatePicker from 'material-ui/DatePicker';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import SocialGroup from 'material-ui/svg-icons/social/group';
import Check from 'material-ui/svg-icons/navigation/check';
import Edit from 'material-ui/svg-icons/image/edit';
import Lock from 'material-ui/svg-icons/action/lock-outline';
import moment from 'moment';
import DataPackTableRow from './DataPackTableRow';
import DataPackShareDialog from '../DataPackShareDialog/DataPackShareDialog';

export class DataPackStatusTable extends Component {
    constructor(props) {
        super(props);
        this.setPermissions = this.setPermissions.bind(this);
        this.handleShareDialogOpen = this.handleShareDialogOpen.bind(this);
        this.handleShareDialogClose = this.handleShareDialogClose.bind(this);
        this.handleShareDialogSave = this.handleShareDialogSave.bind(this);
        this.handleDropDownChange = this.handleDropDownChange.bind(this);
        this.state = {
            shareDialogOpen: false,
            permissions: {
                value: 'PRIVATE',
                groups: {},
                members: {},
            },
        };
    }

    componentDidMount() {
        this.setPermissions();
    }

    setPermissions() {
        if (this.props.permissions) {
            // Because we have no "public" button, public is grouped in with shared
            const value = this.props.permissions.value === 'PRIVATE' ? 'PRIVATE' : 'SHARED';
            this.setState({ permissions: { ...this.props.permissions, value } });
        }
    }

    handleShareDialogOpen() {
        this.setState({ shareDialogOpen: true });
    }

    handleShareDialogClose() {
        this.setState({ shareDialogOpen: false });
    }

    handleShareDialogSave(permissions) {
        const newPermissions = { ...permissions };
        // update the local state to what the user set in the ShareDialog
        this.setState({ permissions: { ...newPermissions } });

        // check if all groups and members are selected
        const groupsEqual = Object.keys(newPermissions.groups).length === this.props.groups.length;
        const membersEqual = Object.keys(newPermissions.members).length === this.props.members.length;
        // if all groups and members are selected we tell the api that it should be public
        if (groupsEqual && membersEqual) {
            newPermissions.value = 'PUBLIC';
        }
        this.props.handlePermissionsChange({ ...newPermissions });
        this.handleShareDialogClose();
    }

    handleDropDownChange(e, k, value) {
        // update the value in permissions
        const permissions = { ...this.state.permissions, value };
        if (permissions.value === 'PRIVATE') {
            // if the new value is private we can make the api call to update
            this.props.handlePermissionsChange(permissions);
        } else {
            // if the new value is not private (shared) we default to shared with all (public)
            // then the user has the ability to change the share settings to something else
            const groups = {};
            const members = {};
            this.props.groups.forEach((group) => {
                groups[group.id] = 'READ';
            });
            this.props.members.forEach((member) => {
                members[member.user.username] = 'READ';
            });
            permissions.groups = groups;
            permissions.members = members;
        }
        this.setState({ permissions });
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
            privateCheck: this.state.permissions.value === 'PRIVATED' ? checkIcon : null,
            membersCheck: this.state.permissions.value === 'SHARED' ? checkIcon : null,
        };

        let membersAndGroups = null;
        if (this.state.permissions.value !== 'PRIVATE') {
            const groupCount = Object.keys(this.state.permissions.groups).length;
            const memberCount = Object.keys(this.state.permissions.members).length;

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
                memberText = '1 Members';
            } else {
                memberText = `${memberCount} Members`;
            }

            membersAndGroups = (
                <EnhancedButton
                    key="membersAndGroupsButton"
                    onClick={this.handleShareDialogOpen}
                    style={{ color: '#4598bf', textDecoration: 'underline', padding: '0px 5px' }}
                >
                    {memberText} / {groupText}
                </EnhancedButton>
            );
        }

        return (
            <div style={{ marginLeft: '-5px', marginTop: '-5px' }}>
                <DataPackTableRow
                    title="Export"
                    data={this.props.status}
                    titleStyle={{ backgroundColor: this.props.statusColor }}
                    dataStyle={{
                        backgroundColor: this.props.statusColor,
                        color: this.props.statusFontColor,
                    }}
                />
                <DataPackTableRow
                    title="Expiration"
                    data={
                        <div>
                            {moment(this.props.expiration).format('YYYY-MM-DD')}
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
                            />
                            <Edit
                                onClick={() => { this.dp.focus(); }}
                                style={styles.tableRowInfoIcon}
                            />
                        </div>
                    }
                />
                <DataPackTableRow
                    title="Permissions"
                    dataStyle={{ flexWrap: 'wrap' }}
                    data={[
                        <DropDownMenu
                            key="permissionsMenu"
                            className="qa-DataPackStatusTable-DropDownMenu-published"
                            value={this.state.permissions.value}
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
                                value="SHARED"
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
                    ]}
                />
                {this.state.shareDialogOpen ?
                    <DataPackShareDialog
                        show
                        onClose={this.handleShareDialogClose}
                        onSave={this.handleShareDialogSave}
                        groups={this.props.groups}
                        members={this.props.members}
                        permissions={this.state.permissions}
                        groupsText="hello"
                        membersText="hello"
                        canUpdateAdmin
                    />
                    :
                    null
                }
            </div>
        );
    }
}

DataPackStatusTable.defaultProps = {
    minDate: null,
    maxDate: null,
    statusColor: null,
    statusFontColor: null,
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
        username: PropTypes.string,
        name: PropTypes.string,
        groups: PropTypes.arrayOf(PropTypes.number),
        email: PropTypes.string,
    })).isRequired,
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
};

export default DataPackStatusTable;
