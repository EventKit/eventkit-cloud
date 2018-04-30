import React, { Component, PropTypes } from 'react';
import IconButton from 'material-ui/IconButton';
import MenuItem from 'material-ui/MenuItem';
import Divider from 'material-ui/Divider';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import Group from 'material-ui/svg-icons/social/group';
import ArrowDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import Checked from 'material-ui/svg-icons/toggle/check-box';
import Unchecked from 'material-ui/svg-icons/toggle/check-box-outline-blank';
import GroupsDropDownMenu from './GroupsDropDownMenu';
import GroupsDropDownMenuItem from './GroupsDropDownMenuItem';

export class UserTableRowColumn extends Component {
    constructor(props) {
        super(props);
        this.handleOpen = this.handleOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleNewGroupClick = this.handleNewGroupClick.bind(this);
        this.handleGroupItemClick = this.handleGroupItemClick.bind(this);
        this.handleMakeAdminClick = this.handleMakeAdminClick.bind(this);
        this.handleDemoteAdminClick = this.handleDemoteAdminClick.bind(this);
        this.onSelect = this.props.onSelect.bind(this, this.props.user);
        this.state = {
            open: false,
            popoverAnchor: null,
        };
    }

    handleOpen(e) {
        e.preventDefault();
        e.stopPropagation();
        this.setState({ open: true, popoverAnchor: e.currentTarget });
    }

    handleClose() {
        this.setState({ open: false });
    }

    handleNewGroupClick() {
        this.handleClose();
        this.props.handleNewGroupClick([this.props.user]);
    }

    handleGroupItemClick(group) {
        this.props.handleGroupItemClick(group, this.props.user);
    }

    handleMakeAdminClick(e) {
        e.stopPropagation();
        this.props.handleMakeAdmin(this.props.user);
    }

    handleDemoteAdminClick(e) {
        e.stopPropagation();
        this.props.handleDemoteAdmin(this.props.user);
    }

    render() {
        const styles = {
            tableRowColumn: {
                ...this.props.style,
                color: '#707274',
                fontSize: '14px',
                whiteSpace: 'normal',
                display: 'flex',
                borderTop: '1px solid #e0e0e0',
            },
            iconMenu: {
                width: '24px',
                height: '40px',
                margin: '0px 12px',
                float: 'right',
            },
            iconButton: {
                padding: '0px',
                height: '40px',
                width: '48px',
                flex: '0 0 auto',
                alignSelf: 'center',
            },
            adminContainer: {
                display: 'flex',
                margin: '0px 30px 0px 20px',
                alignItems: 'center',
            },
            admin: {
                backgroundColor: '#4598bf',
                color: '#fff',
                padding: '4px 11px',
                fontSize: '11px',
                cursor: 'pointer',
            },
            notAdmin: {
                backgroundColor: '#ccc',
                color: '#fff',
                padding: '4px 11px',
                fontSize: '11px',
                opacity: '0.8',
                cursor: 'pointer',
            },
            menuItem: {
                fontSize: '14px',
                overflow: 'hidden',
                color: '#707274',
            },
            menuItemInner: {
                padding: '0px',
                margin: '0px 22px 0px 16px',
                height: '48px',
                display: 'flex',
            },
        };

        let name = this.props.user.user.username;
        if (this.props.user.user.first_name && this.props.user.user.last_name) {
            name = `${this.props.user.user.first_name} ${this.props.user.user.last_name}`;
        }
        const email = this.props.user.user.email || 'No email provided';

        let adminLabel = null;
        if (this.props.showAdminButton) {
            adminLabel = (
                <div style={styles.adminContainer}>
                    {this.props.isAdmin ?
                        <EnhancedButton
                            style={styles.admin}
                            onClick={this.handleDemoteAdminClick}
                        >
                            ADMIN
                        </EnhancedButton>
                        :
                        <EnhancedButton
                            style={styles.notAdmin}
                            onClick={this.handleMakeAdminClick}
                        >
                            ADMIN
                        </EnhancedButton>
                    }
                </div>
            );
        } else if (this.props.showAdminLabel && this.props.isAdmin) {
            adminLabel = (
                <div style={styles.adminContainer}>
                        ADMIN
                </div>
            );
        }

        const checkbox = this.props.selected ? <Checked onClick={this.onSelect} /> : <Unchecked onClick={this.onSelect} />;

        return (
            <div
                style={styles.tableRowColumn}
                className="qa-UserTableRowColumn"
            >
                <div style={{ display: 'flex', flex: '0 0 auto', paddingLeft: '24px', alignItems: 'center' }}>
                    {checkbox}
                </div>
                <div style={{ display: 'flex', flex: '1 1 auto', padding: '8px 24px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', flex: '1 1 auto' }}>
                        <div className="qa-UserTableRowColumn-name" style={{ flexBasis: '100%', flexWrap: 'wrap', wordBreak: 'break-word' }}>
                            <strong>{name}</strong>
                        </div>
                        <div className="qa-UserTableRowColumn-email" style={{ flexBasis: '100%', flexWrap: 'wrap', wordBreak: 'break-word' }}>
                            {email}
                        </div>
                    </div>
                    {adminLabel}
                    <IconButton
                        style={styles.iconButton}
                        iconStyle={{ color: '#4598bf' }}
                        onClick={this.handleOpen}
                        className="qa-UserTableRowColumn-IconButton-options"
                    >
                        <Group />
                        <ArrowDown />
                    </IconButton>
                    <GroupsDropDownMenu
                        open={this.state.open}
                        anchorEl={this.state.popoverAnchor}
                        onClose={this.handleClose}
                        loading={this.props.groupsLoading}
                        width={200}
                        className="qa-UserTableRowColumn-GroupsDropDownMenu"
                    >
                        {this.props.groups.map(group => (
                            <GroupsDropDownMenuItem
                                key={group.id}
                                group={group}
                                onClick={this.handleGroupItemClick}
                                selected={this.props.user.groups.includes(group.id)}
                            />
                        ))}
                        <Divider className="qa-UserTableRowColumn-Divider" />
                        <MenuItem
                            style={styles.menuItem}
                            innerDivStyle={styles.menuItemInner}
                            onTouchTap={this.handleNewGroupClick}
                            className="qa-UserTableRowColumn-MenuItem-newGroup"
                        >
                            <span>Share with New Group</span>
                        </MenuItem>
                    </GroupsDropDownMenu>
                </div>
            </div>
        );
    }
}

UserTableRowColumn.defaultProps = {
    handleMakeAdmin: () => { console.error('Make admin function not provided'); },
    handleDemoteAdmin: () => { console.error('Demote admin function not provided'); },
    isAdmin: false,
    showAdminButton: false,
    showAdminLabel: false,
    style: {},
};

UserTableRowColumn.propTypes = {
    selected: PropTypes.bool.isRequired,
    onSelect: PropTypes.func.isRequired,
    user: PropTypes.shape({
        user: PropTypes.shape({
            first_name: PropTypes.string,
            last_name: PropTypes.string,
            email: PropTypes.string,
            username: PropTypes.string,
        }),
        groups: PropTypes.arrayOf(PropTypes.number),
    }).isRequired,
    groups: PropTypes.arrayOf(PropTypes.object).isRequired,
    groupsLoading: PropTypes.bool.isRequired,
    handleGroupItemClick: PropTypes.func.isRequired,
    handleNewGroupClick: PropTypes.func.isRequired,
    handleMakeAdmin: PropTypes.func,
    handleDemoteAdmin: PropTypes.func,
    isAdmin: PropTypes.bool,
    showAdminButton: PropTypes.bool,
    showAdminLabel: PropTypes.bool,
    style: PropTypes.object,
};

export default UserTableRowColumn;
