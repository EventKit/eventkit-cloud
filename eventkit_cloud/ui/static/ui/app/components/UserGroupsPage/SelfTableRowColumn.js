import React, { Component, PropTypes } from 'react';
import IconButton from 'material-ui/IconButton';
import { TableRowColumn } from 'material-ui/Table';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import Group from 'material-ui/svg-icons/social/group';
import ArrowDown from 'material-ui/svg-icons/navigation/arrow-drop-down';

export class SelfTableRowColumn extends Component {
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
                // color: '#707274',
                backgroundColor: '#ccc',
                color: '#fff',
                padding: '4px 11px',
                fontSize: '11px',
                alignSelf: 'center',
                opacity: '0.8',
                cursor: 'pointer',
            },
        };

        // get "rest" of props needed to pass to MUI component
        const {
            user,
            handleMakeAdmin,
            handleDemoteAdmin,
            isAdmin,
            showAdminButton,
            ...rest
        } = this.props;

        let name = user.user.username;
        if (user.user.first_name && user.user.last_name) {
            name = `${user.user.first_name} ${user.user.last_name}`;
        }
        const email = user.user.email || 'No email provided';

        let adminLabel = null;
        if (showAdminButton) {
            adminLabel = (
                <div style={styles.adminContainer}>
                    {isAdmin ?
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
        }

        return (
            <TableRowColumn
                {...rest}
                style={styles.tableRowColumn}
                className="qa-SelfTableRowColumn"
            >
                <div style={{ display: 'flex' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', flex: '1 1 auto' }}>
                        <div className="qa-SelfTableRowColumn-name" style={{ flexBasis: '100%', flexWrap: 'wrap', wordBreak: 'break-word' }}>
                            <strong>{name}</strong>
                        </div>
                        <div className="qa-SelfTableRowColumn-email" style={{ flexBasis: '100%', flexWrap: 'wrap', wordBreak: 'break-word' }}>
                            {email}
                        </div>
                    </div>
                    {adminLabel}
                    <IconButton
                        style={styles.iconButton}
                        iconStyle={{ color: '#4598bf' }}
                        onClick={this.handleOpen}
                        className="qa-SelfTableRowColumn-IconButton-options"
                        disabled
                    >
                        <Group />
                        <ArrowDown />
                    </IconButton>
                </div>
            </TableRowColumn>
        );
    }
}

SelfTableRowColumn.defaultProps = {
    handleMakeAdmin: () => { console.error('Make admin function not provided'); },
    handleDemoteAdmin: () => { console.error('Demote admin function not provided'); },
    isAdmin: false,
    showAdminButton: false,
    style: {},
};

SelfTableRowColumn.propTypes = {
    user: PropTypes.shape({
        user: PropTypes.shape({
            first_name: PropTypes.string,
            last_name: PropTypes.string,
            email: PropTypes.string,
            username: PropTypes.string,
        }),
        groups: PropTypes.arrayOf(PropTypes.number),
    }).isRequired,
    handleMakeAdmin: PropTypes.func,
    handleDemoteAdmin: PropTypes.func,
    isAdmin: PropTypes.bool,
    showAdminButton: PropTypes.bool,
    style: PropTypes.object,
};

export default SelfTableRowColumn;
