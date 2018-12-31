import * as React from 'react';
import { withTheme, Theme, withStyles, createStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import Person from '@material-ui/icons/Person';
import ArrowDown from '@material-ui/icons/ArrowDropDown';
import IconMenu from '../common/IconMenu';

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    row: {
        color: theme.eventkit.colors.text_primary,
        fontSize: '14px',
        whiteSpace: 'normal',
        display: 'flex',
        borderTop: `1px solid ${theme.eventkit.colors.backdrop}`,
        borderBottom: `1px solid ${theme.eventkit.colors.backdrop}`,
        backgroundColor: theme.eventkit.colors.secondary,
        '&:hover': {
            backgroundColor: theme.eventkit.colors.selected_primary,
        }
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
        backgroundColor: theme.eventkit.colors.primary,
        color: theme.eventkit.colors.white,
        padding: '4px 11px',
        fontSize: '11px',
        cursor: 'pointer',
    },
    menuItem: {
        fontSize: '14px',
        overflow: 'hidden',
        color: theme.eventkit.colors.warning,
    },
});

export interface Props {
    user: Eventkit.User;
    handleDemoteAdmin: (user: Eventkit.User) => void;
    handleRemoveUser: (user: Eventkit.User) => void;
    isAdmin: boolean;
    showAdminButton: boolean;
    showAdminLabel: boolean;
    showRemoveButton: boolean;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string; };
}

export class OwnUserRow extends React.Component<Props, {}> {
    static defaultProps = {
        isAdmin: false,
        handleDemoteAdmin: () => { console.warn('Demote admin function not provided'); },
        handleRemoveUser: () => { console.warn('Remove user function not provided'); },
        showAdminButton: false,
        showAdminLabel: false,
        showRemoveButton: false,
    };

    constructor(props: Props) {
        super(props);
        this.handleDemoteAdminClick = this.handleDemoteAdminClick.bind(this);
        this.handleRemoveUserClick = this.handleRemoveUserClick.bind(this);
    }

    private handleDemoteAdminClick() {
        this.props.handleDemoteAdmin(this.props.user);
    }

    private handleRemoveUserClick() {
        this.props.handleRemoveUser(this.props.user);
    }

    render() {
        const { classes } = this.props;

        let adminButton = null;
        if (this.props.showAdminButton && this.props.isAdmin) {
            adminButton = (
                <MenuItem
                    key="adminMenuItem"
                    onClick={this.handleDemoteAdminClick}
                    className={`qa-OwnUserRow-MenuItem-makeAdmin ${classes.menuItem}`}
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
                    onClick={this.handleRemoveUserClick}
                    className={`qa-OwnUserRow-MenuItem-remove ${classes.menuItem}`}
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
                <div className={`qa-OwnUserRow-adminLabel ${classes.adminContainer}`}>
                        ADMIN
                </div>
            );
        }

        return (
            <div
                className={`qa-OwnUserRow ${classes.row}`}
            >
                <div style={{ padding: '28px 24px' }} />
                <div style={{ display: 'flex', flex: '1 1 auto', padding: '8px 24px' }}>
                    <div>
                        <div className={`qa-OwnUserRow-name ${classes.userInfo}`}>
                            <strong>{name}</strong>
                        </div>
                        <div className={`qa-OwnUserRow-email ${classes.userInfo}`}>
                            {email}
                        </div>
                    </div>
                    <div className={classes.me}>(me)</div>
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

export default withTheme()(withStyles(jss)(OwnUserRow));
