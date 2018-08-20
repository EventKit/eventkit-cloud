import PropTypes from 'prop-types';
import React, { Component } from 'react';
import IconButton from 'material-ui/IconButton';
import MenuItem from 'material-ui/MenuItem';
import Divider from 'material-ui/Divider';
import Person from '@material-ui/icons/Person';
import ArrowDown from '@material-ui/icons/ArrowDropDown';
import GroupsDropDownMenu from './GroupsDropDownMenu';

export class OwnUserRow extends Component {
    constructor(props) {
        super(props);
        this.handleMouseOver = this.handleMouseOver.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);
        this.handleOpen = this.handleOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleDemoteAdminClick = this.handleDemoteAdminClick.bind(this);
        this.handleRemoveUserClick = this.handleRemoveUserClick.bind(this);
        this.state = {
            hovered: false,
            open: false,
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
                borderTop: '1px solid rgba(0, 0, 0, 0.2)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.2)',
                backgroundColor: this.state.hovered ? '#4598bf33' : 'rgba(0, 0, 0, 0.05)',
            },
            checkbox: {
                display: 'flex',
                flex: '0 0 auto',
                paddingLeft: '24px',
                alignItems: 'center',
            },
            userInfo: {
                display: 'flex',
                flexWrap: 'wrap',
                wordBreak: 'break-word',
                width: '100%',
            },
            me: {
                display: 'flex',
                flex: '1 1 auto',
                alignItems: 'center',
                paddingLeft: '15px',
                fontWeight: 800,
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
                color: '#ce4427',
            },
            menuItemInner: {
                padding: '0px',
                margin: '0px 22px 0px 16px',
                height: '48px',
                display: 'flex',
            },
        };

        let adminButton = null;
        if (this.props.showAdminButton && this.props.isAdmin) {
            adminButton = ([
                <MenuItem
                    key="adminMenuItem"
                    style={styles.menuItem}
                    innerDivStyle={styles.menuItemInner}
                    onClick={this.handleDemoteAdminClick}
                    className="qa-OwnUserRow-MenuItem-makeAdmin"
                >
                    <span>Remove Admin Rights</span>
                </MenuItem>,
                <Divider key="makeAdminDivider" className="qa-OwnUserRow-Divider" />,
            ]);
        }

        let removeButton = null;
        if (this.props.showRemoveButton) {
            removeButton = (
                <MenuItem
                    style={styles.menuItem}
                    innerDivStyle={styles.menuItemInner}
                    onClick={this.handleRemoveUserClick}
                    className="qa-OwnUserRow-MenuItem-remove"
                >
                    <span>Leave Group</span>
                </MenuItem>
            );
        }

        const iconDisabled = !removeButton && !adminButton;

        let name = this.props.user.user.username;
        if (this.props.user.user.first_name && this.props.user.user.last_name) {
            name = `${this.props.user.user.first_name} ${this.props.user.user.last_name}`;
        }
        const email = this.props.user.user.email || 'No email provided';

        let adminLabel = null;
        if (this.props.showAdminLabel && this.props.isAdmin) {
            adminLabel = (
                <div style={styles.adminContainer} className="qa-OwnUserRow-adminLabel">
                        ADMIN
                </div>
            );
        }

        return (
            <div
                style={styles.row}
                className="qa-OwnUserRow"
                onMouseOver={this.handleMouseOver}
                onMouseOut={this.handleMouseOut}
                onFocus={this.handleMouseOver}
                onBlur={this.handleMouseOut}
            >
                <div style={{ padding: '28px 24px' }} />
                <div style={{ display: 'flex', flex: '1 1 auto', padding: '8px 24px' }}>
                    <div>
                        <div className="qa-OwnUserRow-name" style={styles.userInfo}>
                            <strong>{name}</strong>
                        </div>
                        <div className="qa-OwnUserRow-email" style={styles.userInfo}>
                            {email}
                        </div>
                    </div>
                    <div style={styles.me}>(me)</div>
                    {adminLabel}
                    <IconButton
                        style={styles.iconButton}
                        iconStyle={{ color: iconDisabled ? '#707274' : '#4598bf' }}
                        onClick={this.handleOpen}
                        disabled={iconDisabled}
                        className="qa-OwnUserRow-IconButton-options"
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
                        className="qa-OwnUserRow-GroupsDropDownMenu"
                    >
                        {adminButton}
                        {removeButton}
                    </GroupsDropDownMenu>
                </div>
            </div>
        );
    }
}

OwnUserRow.defaultProps = {
    isAdmin: false,
    handleDemoteAdmin: () => { console.error('Demote admin function not provided'); },
    handleRemoveUser: () => { console.error('Remove user function not provided'); },
    showAdminButton: false,
    showAdminLabel: false,
    showRemoveButton: false,
    style: {},
};

OwnUserRow.propTypes = {
    user: PropTypes.shape({
        user: PropTypes.shape({
            first_name: PropTypes.string,
            last_name: PropTypes.string,
            email: PropTypes.string,
            username: PropTypes.string,
        }),
        groups: PropTypes.arrayOf(PropTypes.number),
    }).isRequired,
    handleDemoteAdmin: PropTypes.func,
    handleRemoveUser: PropTypes.func,
    isAdmin: PropTypes.bool,
    showAdminButton: PropTypes.bool,
    showAdminLabel: PropTypes.bool,
    showRemoveButton: PropTypes.bool,
    style: PropTypes.object,
};

export default OwnUserRow;
