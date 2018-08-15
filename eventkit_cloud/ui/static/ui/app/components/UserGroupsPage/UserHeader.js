import PropTypes from 'prop-types';
import React, { Component } from 'react';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import Divider from 'material-ui/Divider';
import IconButton from 'material-ui/IconButton';
import Person from '@material-ui/icons/Person';
import Sort from '@material-ui/icons/Sort';
import DropDown from '@material-ui/icons/ArrowDropDown';
import Checked from '@material-ui/icons/CheckBox';
import Unchecked from '@material-ui/icons/CheckBoxOutlineBlank';
import GroupsDropDownMenu from './GroupsDropDownMenu';
import ConfirmDialog from '../Dialog/ConfirmDialog';

export class UserHeader extends Component {
    constructor(props) {
        super(props);
        this.handleOpen = this.handleOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleAddUsersClick = this.handleAddUsersClick.bind(this);
        this.handleNewGroupClick = this.handleNewGroupClick.bind(this);
        this.handleRemoveUsersClick = this.handleRemoveUsersClick.bind(this);
        this.handleOpenAdminConfirm = this.handleOpenAdminConfirm.bind(this);
        this.handleCloseAdminConfirm = this.handleCloseAdminConfirm.bind(this);
        this.handleConfirmAdminAction = this.handleConfirmAdminAction.bind(this);
        this.select = this.props.onSelect.bind(this, true);
        this.deselect = this.props.onSelect.bind(this, false);
        this.state = {
            open: false,
            popoverAnchor: null,
            showAdminConfirm: false,
        };
    }

    handleOpen(e) {
        e.preventDefault();
        this.setState({ open: true, popoverAnchor: e.currentTarget });
    }

    handleClose() {
        this.setState({ open: false, popoverAnchor: null });
    }

    handleAddUsersClick() {
        this.handleClose();
        this.props.handleAddUsers(this.props.selectedUsers);
    }

    handleNewGroupClick() {
        this.handleClose();
        this.props.handleNewGroup(this.props.selectedUsers);
    }

    handleRemoveUsersClick() {
        this.handleClose();
        this.props.handleRemoveUsers(this.props.selectedUsers);
    }

    handleOpenAdminConfirm() {
        this.handleClose();
        this.setState({ showAdminConfirm: true });
    }

    handleCloseAdminConfirm() {
        this.setState({ showAdminConfirm: false });
    }

    handleConfirmAdminAction() {
        this.handleCloseAdminConfirm();
        this.props.handleAdminRights(this.props.selectedUsers);
    }

    render() {
        const styles = {
            header: {
                color: '#707274',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                height: '56px',
            },
            iconMenu: {
                width: '24px',
                height: '100%',
                margin: '0px 12px',
            },
            iconButton: {
                padding: '0px',
                marginLeft: '10px',
                height: '24px',
                width: '24pz',
                verticalAlign: 'middle',
                flex: '0 0 auto',
            },
            dropDown: {
                height: '24px',
                fontSize: '14px',
                float: 'right',
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

        const checkbox = this.props.selected ?
            <Checked onClick={this.deselect} className="qa-UserHeader-checkbox" />
            :
            <Unchecked onClick={this.select} className="qa-UserHeader-checkbox" />;

        let removeButton = null;
        if (this.props.showRemoveButton) {
            removeButton = (
                <MenuItem
                    style={{ ...styles.menuItem, color: '#ce4427' }}
                    innerDivStyle={styles.menuItemInner}
                    onClick={this.handleRemoveUsersClick}
                    className="qa-UserHeader-MenuItem-remove"
                >
                    <span>Remove User(s)</span>
                </MenuItem>
            );
        }

        let confirmationText = 'Are you sure you want to proceed with this action?';
        let adminButton = null;
        if (this.props.showAdminButton) {
            let adminLabel = '';
            if (this.props.selectedGroup) {
                const allAdmins = this.props.selectedUsers.every(user =>
                    this.props.selectedGroup.administrators.indexOf(user.user.username) > -1);
                if (allAdmins) {
                    adminLabel = 'Remove Admin Rights';
                } else {
                    adminLabel = 'Grant Admin Rights';
                }
                confirmationText = `Are you sure you want to ${
                    adminLabel.toLowerCase()
                } for the (${
                    this.props.selectedUsers.length
                }) selected members?`;
            }

            adminButton = ([
                <MenuItem
                    key="makeAdminMenuItem"
                    style={styles.menuItem}
                    innerDivStyle={styles.menuItemInner}
                    onClick={this.handleOpenAdminConfirm}
                    className="qa-UserHeader-MenuItem-makeAdmin"
                >
                    <span>{adminLabel}</span>
                </MenuItem>,
                <Divider key="makeAdminDivider" className="qa-UserHeader-Divider" />,
            ]);
        }

        return (
            <div
                style={styles.header}
                className="qa-UserHeader"
            >
                <div style={{
                    display: 'flex',
                    flex: '0 0 auto',
                    paddingLeft: '24px',
                    alignItems: 'center',
                }}
                >
                    {checkbox}
                </div>
                <div style={{ display: 'flex', flex: '1 1 auto', padding: '8px 24px' }}>
                    <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center' }}>
                        <strong className="qa-UserHeader-selectedCount">
                            {this.props.selectedUsers.length} Selected
                        </strong>

                        { this.props.selectedUsers.length ?
                            <IconButton
                                style={styles.iconButton}
                                iconStyle={{ color: '#4598bf' }}
                                onClick={this.handleOpen}
                                className="qa-UserHeader-IconButton-options"
                            >
                                <Person />
                                <DropDown />
                            </IconButton>
                            :
                            null
                        }
                        <GroupsDropDownMenu
                            open={this.state.open}
                            anchorEl={this.state.popoverAnchor}
                            anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
                            targetOrigin={{ horizontal: 'left', vertical: 'top' }}
                            onClose={this.handleClose}
                            width={200}
                            className="qa-UserHeader-GroupsDropDownMenu"
                        >
                            <MenuItem
                                style={styles.menuItem}
                                innerDivStyle={styles.menuItemInner}
                                onClick={this.handleAddUsersClick}
                                className="qa-UserHeader-MenuItem-editGroups"
                            >
                                <span>Add to Existing Group</span>
                            </MenuItem>
                            <Divider className="qa-UserHeader-Divider" />
                            <MenuItem
                                style={styles.menuItem}
                                innerDivStyle={styles.menuItemInner}
                                onClick={this.handleNewGroupClick}
                                className="qa-UserHeader-MenuItem-newGroup"
                            >
                                <span>Add to New Group</span>
                            </MenuItem>
                            <Divider className="qa-UserHeader-Divider" />
                            {adminButton}
                            {removeButton}
                        </GroupsDropDownMenu>
                    </div>
                    <IconMenu
                        value={this.props.orderingValue}
                        onChange={this.props.handleOrderingChange}
                        iconButtonElement={
                            <IconButton style={{ padding: '0px', height: '24px' }}>
                                <Sort /><DropDown />
                            </IconButton>
                        }
                        style={styles.dropDown}
                        menuItemStyle={{ color: '#707274', fontSize: '14px' }}
                        selectedMenuItemStyle={{ color: '#4598bf', fontSize: '14px' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                        targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                        className="qa-UserHeader-DropDownMenu-sort"
                    >
                        <MenuItem
                            value="username"
                            primaryText="Username A-Z"
                            className="qa-UserHeader-MenuItem-sortAZ"
                        />
                        <MenuItem
                            value="-username"
                            primaryText="Username Z-A"
                            className="qa-UserHeader-MenuItem-sortZA"
                        />
                        <MenuItem
                            value="-date_joined"
                            primaryText="Newest"
                            className="qa-UserHeader-MenuItem-sortNewest"
                        />
                        <MenuItem
                            value="date_joined"
                            primaryText="Oldest"
                            className="qa-UserHeader-MenuItem-sortOldest"
                        />
                        <MenuItem
                            value="admin"
                            primaryText="Administrator"
                            className="qa-UserHeader-MenuItem-sortAdmin"
                        />
                    </IconMenu>
                </div>
                <ConfirmDialog
                    show={this.state.showAdminConfirm}
                    title="Are you sure?"
                    onCancel={this.handleCloseAdminConfirm}
                    onConfirm={this.handleConfirmAdminAction}
                    isDestructive
                >
                    {confirmationText}
                </ConfirmDialog>
            </div>
        );
    }
}

UserHeader.defaultProps = {
    handleRemoveUsers: () => { console.error('No remove users handler supplied'); },
    handleAdminRights: () => { console.error('No admin rights handler supplied'); },
    selectedGroup: null,
    showRemoveButton: false,
    showAdminButton: false,
};

UserHeader.propTypes = {
    selected: PropTypes.bool.isRequired,
    onSelect: PropTypes.func.isRequired,
    orderingValue: PropTypes.string.isRequired,
    handleOrderingChange: PropTypes.func.isRequired,
    handleAddUsers: PropTypes.func.isRequired,
    handleRemoveUsers: PropTypes.func,
    handleAdminRights: PropTypes.func,
    selectedUsers: PropTypes.arrayOf(PropTypes.object).isRequired,
    selectedGroup: PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    }),
    handleNewGroup: PropTypes.func.isRequired,
    showRemoveButton: PropTypes.bool,
    showAdminButton: PropTypes.bool,
};

export default UserHeader;
