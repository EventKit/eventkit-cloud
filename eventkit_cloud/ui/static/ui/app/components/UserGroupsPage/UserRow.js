import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import Person from '@material-ui/icons/Person';
import ArrowDown from '@material-ui/icons/ArrowDropDown';
import Checked from '@material-ui/icons/CheckBox';
import Unchecked from '@material-ui/icons/CheckBoxOutlineBlank';
import IconMenu from '../common/IconMenu';

export class UserRow extends Component {
    constructor(props) {
        super(props);
        this.handleMouseOver = this.handleMouseOver.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);
        this.handleAddUserClick = this.handleAddUserClick.bind(this);
        this.handleNewGroupClick = this.handleNewGroupClick.bind(this);
        this.handleMakeAdminClick = this.handleMakeAdminClick.bind(this);
        this.handleDemoteAdminClick = this.handleDemoteAdminClick.bind(this);
        this.handleRemoveUserClick = this.handleRemoveUserClick.bind(this);
        this.onSelect = this.props.onSelect.bind(this, this.props.user);
        this.state = {
            hovered: false,
        };
    }

    handleMouseOver() {
        this.setState({ hovered: true });
    }

    handleMouseOut() {
        this.setState({ hovered: false });
    }

    handleAddUserClick() {
        this.props.handleAddUser([this.props.user]);
    }

    handleNewGroupClick() {
        this.props.handleNewGroup([this.props.user]);
    }

    handleMakeAdminClick() {
        this.props.handleMakeAdmin(this.props.user);
    }

    handleDemoteAdminClick() {
        this.props.handleDemoteAdmin(this.props.user);
    }

    handleRemoveUserClick() {
        this.props.handleRemoveUser(this.props.user);
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            row: {
                ...this.props.style,
                color: colors.text_primary,
                fontSize: '14px',
                whiteSpace: 'normal',
                display: 'flex',
                backgroundColor: this.state.hovered ? colors.selected_primary : colors.white,
                borderTop: `1px solid ${colors.backdrop}`,
            },
            info: {
                flexBasis: '100%',
                flexWrap: 'wrap',
                wordBreak: 'break-word',
            },
            adminContainer: {
                display: 'flex',
                margin: '0px 30px 0px 20px',
                alignItems: 'center',
            },
            admin: {
                backgroundColor: colors.primary,
                color: colors.white,
                padding: '4px 11px',
                fontSize: '11px',
                cursor: 'pointer',
            },
            menuItem: {
                fontSize: '14px',
                overflow: 'hidden',
                color: colors.text_primary,
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

            adminButton = (
                <MenuItem
                    key="makeAdminMenuItem"
                    style={styles.menuItem}
                    onClick={adminFunction}
                    className="qa-UserRow-MenuItem-makeAdmin"
                >
                    {adminButtonText}
                </MenuItem>
            );
        }

        let removeButton = null;
        if (this.props.showRemoveButton) {
            removeButton = (
                <MenuItem
                    key="remove"
                    style={{ ...styles.menuItem, color: colors.warning }}
                    onClick={this.handleRemoveUserClick}
                    className="qa-UserRow-MenuItem-remove"
                >
                    Remove User
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

        const checkbox = this.props.selected ?
            <Checked onClick={this.onSelect} className="qa-UserRow-checkbox" color="primary" />
            :
            <Unchecked onClick={this.onSelect} className="qa-UserRow-checkbox" color="primary" />;

        return (
            <div
                style={styles.row}
                className="qa-UserRow"
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
                        <div className="qa-UserRow-name" style={styles.info}>
                            <strong>{name}</strong>
                        </div>
                        <div className="qa-UserRow-email" style={styles.info}>
                            {email}
                        </div>
                    </div>
                    {adminLabel}
                    <IconMenu
                        className="qa-UserRow-options"
                        style={{ width: '48px', backgroundColor: 'transparent' }}
                        color="primary"
                        icon={
                            <div style={{ display: 'flex' }}>
                                <Person />
                                <ArrowDown />
                            </div>
                        }
                    >
                        <MenuItem
                            key="edit"
                            style={styles.menuItem}
                            onClick={this.handleAddUserClick}
                            className="qa-UserRow-MenuItem-editGroups"
                        >
                            Add to Existing Group
                        </MenuItem>
                        <MenuItem
                            key="new"
                            style={styles.menuItem}
                            onClick={this.handleNewGroupClick}
                            className="qa-UserRow-MenuItem-newGroup"
                        >
                            Add to New Group
                        </MenuItem>
                        {adminButton}
                        {removeButton}
                    </IconMenu>
                </div>
            </div>
        );
    }
}

UserRow.defaultProps = {
    handleMakeAdmin: () => { console.warn('Make admin function not provided'); },
    handleDemoteAdmin: () => { console.warn('Demote admin function not provided'); },
    handleRemoveUser: () => { console.warn('Remove user function not provided'); },
    isAdmin: false,
    showAdminButton: false,
    showAdminLabel: false,
    showRemoveButton: false,
    style: {},
};

UserRow.propTypes = {
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
    theme: PropTypes.object.isRequired,
};

export default withTheme()(UserRow);
