import React, { Component, PropTypes } from 'react';
import IconButton from 'material-ui/IconButton';
import MenuItem from 'material-ui/MenuItem';
import Divider from 'material-ui/Divider';
import Person from 'material-ui/svg-icons/social/person';
import ArrowDown from 'material-ui/svg-icons/navigation/arrow-drop-down';
import Checked from 'material-ui/svg-icons/toggle/check-box';
import Unchecked from 'material-ui/svg-icons/toggle/check-box-outline-blank';
import GroupsDropDownMenu from './GroupsDropDownMenu';

export class UserRowColumn extends Component {
    constructor(props) {
        super(props);
        this.handleMouseOver = this.handleMouseOver.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);
        this.handleOpen = this.handleOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleAddUserClick = this.handleAddUserClick.bind(this);
        this.handleNewGroupClick = this.handleNewGroupClick.bind(this);
        this.handleMakeAdminClick = this.handleMakeAdminClick.bind(this);
        this.handleDemoteAdminClick = this.handleDemoteAdminClick.bind(this);
        this.handleRemoveUserClick = this.handleRemoveUserClick.bind(this);
        this.onSelect = this.props.onSelect.bind(this, this.props.user);
        this.state = {
            open: false,
            popoverAnchor: null,
            hovered: false,
        };
    }

    handleMouseOver() {
        this.setState({ hovered: true });
    }

    handleMouseOut() {
        this.setState({ hovered: false });
    }

    handleOpen(e) {
        e.preventDefault();
        e.stopPropagation();
        this.setState({ open: true, popoverAnchor: e.currentTarget });
    }

    handleClose() {
        this.setState({ open: false });
    }

    handleAddUserClick() {
        this.handleClose();
        this.props.handleAddUser([this.props.user]);
    }

    handleNewGroupClick() {
        this.handleClose();
        this.props.handleNewGroup([this.props.user]);
    }

    handleMakeAdminClick() {
        this.handleClose();
        this.props.handleMakeAdmin(this.props.user);
    }

    handleDemoteAdminClick() {
        this.handleClose();
        this.props.handleDemoteAdmin(this.props.user);
    }

    handleRemoveUserClick() {
        this.handleClose();
        this.props.handleRemoveUser(this.props.user);
    }

    render() {
        const styles = {
            row: {
                ...this.props.style,
                color: '#707274',
                fontSize: '14px',
                whiteSpace: 'normal',
                display: 'flex',
                backgroundColor: this.state.hovered ? '#4598bf33' : '#fff',
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

        let adminButton = null;
        if (this.props.showAdminButton) {
            let adminButtonText = 'Grant Admin Rights';
            let adminFunction = this.handleMakeAdminClick;
            if (this.props.isAdmin) {
                adminButtonText = 'Remove Admin Rights';
                adminFunction = this.handleDemoteAdminClick;
            }

            adminButton = ([
                <MenuItem
                    key="makeAdminMenuItem"
                    style={styles.menuItem}
                    innerDivStyle={styles.menuItemInner}
                    onTouchTap={adminFunction}
                    className="qa-UserRowColumn-MenuItem-makeAdmin"
                >
                    <span>{adminButtonText}</span>
                </MenuItem>,
                <Divider key="makeAdminDivider" className="qa-UserRowColumn-Divider" />,
            ]);
        }

        let removeButton = null;
        if (this.props.showRemoveButton) {
            removeButton = (
                <MenuItem
                    style={{ ...styles.menuItem, color: '#ce4427' }}
                    innerDivStyle={styles.menuItemInner}
                    onTouchTap={this.handleRemoveUserClick}
                    className="qa-UserRowColumn-MenuItem-remove"
                >
                    <span>Remove User</span>
                </MenuItem>
            );
        }
        
        let name = this.props.user.user.username;
        if (this.props.user.user.first_name && this.props.user.user.last_name) {
            name = `${this.props.user.user.first_name} ${this.props.user.user.last_name}`;
        }
        const email = this.props.user.user.email || 'No email provided';

        let adminLabel = null;
        if (this.props.showAdminLabel && this.props.isAdmin) {
            adminLabel = (
                <div style={styles.adminContainer}>
                        ADMIN
                </div>
            );
        }

        const checkbox = this.props.selected ? <Checked onClick={this.onSelect} /> : <Unchecked onClick={this.onSelect} />;

        return (
            <div
                style={styles.row}
                className="qa-UserRowColumn"
                onMouseOver={this.handleMouseOver}
                onMouseOut={this.handleMouseOut}
                onFocus={this.handleMouseOver}
                onBlur={this.handleMouseOut}
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', flex: '1 1 auto' }}>
                        <div className="qa-UserRowColumn-name" style={{ flexBasis: '100%', flexWrap: 'wrap', wordBreak: 'break-word' }}>
                            <strong>{name}</strong>
                        </div>
                        <div className="qa-UserRowColumn-email" style={{ flexBasis: '100%', flexWrap: 'wrap', wordBreak: 'break-word' }}>
                            {email}
                        </div>
                    </div>
                    {adminLabel}
                    <IconButton
                        style={styles.iconButton}
                        iconStyle={{ color: '#4598bf' }}
                        onClick={this.handleOpen}
                        className="qa-UserRowColumn-IconButton-options"
                    >
                        <Person />
                        <ArrowDown />
                    </IconButton>
                    <GroupsDropDownMenu
                        open={this.state.open}
                        anchorEl={this.state.popoverAnchor}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                        targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                        onClose={this.handleClose}
                        width={200}
                        className="qa-UserRowColumn-GroupsDropDownMenu"
                    >
                        <MenuItem
                            style={styles.menuItem}
                            innerDivStyle={styles.menuItemInner}
                            onTouchTap={this.handleAddUserClick}
                            className="qa-UserRowColumn-MenuItem-editGroups"
                        >
                            <span>Add to Existing Group</span>
                        </MenuItem>
                        <Divider className="qa-UserRowColumn-Divider" />
                        <MenuItem
                            style={styles.menuItem}
                            innerDivStyle={styles.menuItemInner}
                            onTouchTap={this.handleNewGroupClick}
                            className="qa-UserRowColumn-MenuItem-newGroup"
                        >
                            <span>Add to New Group</span>
                        </MenuItem>
                        <Divider className="qa-UserRowColumn-Divider" />
                        {adminButton}
                        {removeButton}
                    </GroupsDropDownMenu>
                </div>
            </div>
        );
    }
}

UserRowColumn.defaultProps = {
    handleMakeAdmin: () => { console.error('Make admin function not provided'); },
    handleDemoteAdmin: () => { console.error('Demote admin function not provided'); },
    handleRemoveUser: () => { console.error('Remove user function not provided'); },
    isAdmin: false,
    showAdminButton: false,
    showAdminLabel: false,
    showRemoveButton: false,
    style: {},
};

UserRowColumn.propTypes = {
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
    handleNewGroup: PropTypes.func.isRequired,
    handleAddUser: PropTypes.func.isRequired,
    handleMakeAdmin: PropTypes.func,
    handleDemoteAdmin: PropTypes.func,
    handleRemoveUser: PropTypes.func,
    isAdmin: PropTypes.bool,
    showAdminButton: PropTypes.bool,
    showAdminLabel: PropTypes.bool,
    showRemoveButton: PropTypes.bool,
    style: PropTypes.object,
};

export default UserRowColumn;
