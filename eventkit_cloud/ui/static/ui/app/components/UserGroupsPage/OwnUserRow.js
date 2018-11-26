import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import Person from '@material-ui/icons/Person';
import ArrowDown from '@material-ui/icons/ArrowDropDown';
import IconMenu from '../common/IconMenu';

export class OwnUserRow extends Component {
    constructor(props) {
        super(props);
        this.handleMouseOver = this.handleMouseOver.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);
        this.handleDemoteAdminClick = this.handleDemoteAdminClick.bind(this);
        this.handleRemoveUserClick = this.handleRemoveUserClick.bind(this);
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
                borderTop: `1px solid ${colors.backdrop}`,
                borderBottom: `1px solid ${colors.backdrop}`,
                backgroundColor: this.state.hovered ? colors.selected_primary : colors.secondary,
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
                color: colors.warning,
            },
        };

        let adminButton = null;
        if (this.props.showAdminButton && this.props.isAdmin) {
            adminButton = (
                <MenuItem
                    key="adminMenuItem"
                    style={styles.menuItem}
                    onClick={this.handleDemoteAdminClick}
                    className="qa-OwnUserRow-MenuItem-makeAdmin"
                >
                    Remove Admin Rights
                </MenuItem>
            );
        }

        let removeButton = null;
        if (this.props.showRemoveButton) {
            removeButton = (
                <MenuItem
                    key="remove"
                    style={styles.menuItem}
                    onClick={this.handleRemoveUserClick}
                    className="qa-OwnUserRow-MenuItem-remove"
                >
                    Leave Group
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
                    <IconMenu
                        disabled={iconDisabled}
                        style={{ width: '48px', backgroundColor: 'transparent' }}
                        color="primary"
                        icon={
                            <div style={{ display: 'flex' }}>
                                <Person />
                                <ArrowDown />
                            </div>
                        }
                        className="qa-OwnUserRow-IconMenu"
                    >
                        {adminButton}
                        {removeButton}
                    </IconMenu>
                </div>
            </div>
        );
    }
}

OwnUserRow.defaultProps = {
    isAdmin: false,
    handleDemoteAdmin: () => { console.warn('Demote admin function not provided'); },
    handleRemoveUser: () => { console.warn('Remove user function not provided'); },
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
    theme: PropTypes.object.isRequired,
};

export default withTheme()(OwnUserRow);
