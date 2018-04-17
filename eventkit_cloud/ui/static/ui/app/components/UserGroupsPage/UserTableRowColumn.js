import React, { Component, PropTypes } from 'react';
import IconButton from 'material-ui/IconButton';
import { TableRowColumn } from 'material-ui/Table';
import MenuItem from 'material-ui/MenuItem';
import Divider from 'material-ui/Divider';
import Group from 'material-ui/svg-icons/social/group';
import ArrowDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
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
            },
            admin: {
                backgroundColor: '#4598bf',
                color: '#fff',
                padding: '4px 11px',
                fontSize: '11px',
                alignSelf: 'center',
                cursor: 'pointer',
            },
            notAdmin: {
                color: '#4598bf',
                padding: '4px 11px',
                fontSize: '11px',
                alignSelf: 'center',
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

        // get "rest" of props needed to pass to MUI component
        const {
            user,
            groups,
            groupsLoading,
            handleGroupItemClick,
            handleNewGroupClick,
            handleMakeAdmin,
            handleDemoteAdmin,
            isAdmin,
            showAdminLabel,
            ...rest
        } = this.props;

        let name = user.user.username;
        if (user.user.first_name && user.user.last_name) {
            name = `${user.user.first_name} ${user.user.last_name}`;
        }
        const email = user.user.email || 'No email provided';

        return (
            <TableRowColumn
                {...rest}
                style={styles.tableRowColumn}
                className="qa-UserTableRowColumn"
            >
                <div style={{ display: 'flex' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', flex: '1 1 auto' }}>
                        <div className="qa-UserTableRowColumn-name" style={{ flexBasis: '100%', flexWrap: 'wrap', wordBreak: 'break-word' }}>
                            <strong>{name}</strong>
                        </div>
                        <div className="qa-UserTableRowColumn-email" style={{ flexBasis: '100%', flexWrap: 'wrap', wordBreak: 'break-word' }}>
                            {email}
                        </div>
                    </div>
                    {showAdminLabel ?
                        <div style={styles.adminContainer}>
                            {isAdmin ?
                                <span
                                    style={styles.admin}
                                    onClick={this.handleDemoteAdminClick}
                                >
                                    ADMIN
                                </span>
                                :
                                <span
                                    style={styles.notAdmin}
                                    onClick={this.handleMakeAdminClick}
                                >
                                    ADMIN
                                </span>
                            }
                        </div>
                        :
                        null
                    }
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
                        loading={groupsLoading}
                        width={200}
                        className="qa-UserTableRowColumn-GroupsDropDownMenu"
                    >
                        {this.props.groups.map(group => (
                            <GroupsDropDownMenuItem
                                key={group.id}
                                group={group}
                                onClick={this.handleGroupItemClick}
                                selected={user.groups.includes(group.id)}
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
            </TableRowColumn>
        );
    }
}

UserTableRowColumn.defaultProps = {
    handleMakeAdmin: () => { console.error('Make admin function not provided'); },
    handleDemoteAdmin: () => { console.error('Demote admin function not provided'); },
    isAdmin: false,
    showAdminLabel: false,
    style: {},
};

UserTableRowColumn.propTypes = {
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
    showAdminLabel: PropTypes.bool,
    style: PropTypes.object,
};

export default UserTableRowColumn;
