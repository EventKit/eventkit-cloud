import * as React from 'react';
import { withTheme, Theme, withStyles, createStyles } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import Person from '@material-ui/icons/Person';
import ArrowDown from '@material-ui/icons/ArrowDropDown';
import Checked from '@material-ui/icons/CheckBox';
import Unchecked from '@material-ui/icons/CheckBoxOutlineBlank';
import IconMenu from '../common/IconMenu';

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    row: {
        color: theme.eventkit.colors.text_primary,
        fontSize: '14px',
        whiteSpace: 'normal',
        display: 'flex',
        backgroundColor: theme.eventkit.colors.white,
        borderTop: `1px solid ${theme.eventkit.colors.backdrop}`,
        '&:hover': {
            backgroundColor: theme.eventkit.colors.selected_primary,
        },
    },
    info: {
        flexBasis: '100%',
        flexWrap: 'wrap',
        wordBreak: 'break-word',
    },
    checkboxContainer: {
        display: 'flex',
        flex: '0 0 auto',
        paddingLeft: '24px',
        alignItems: 'center',
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
        color: theme.eventkit.colors.text_primary,
    },
    warning: {
        color: theme.eventkit.colors.warning,
    },
});

export interface Props {
    className?: string;
    selected: boolean;
    onSelect: (user: Eventkit.User) => void;
    user: Eventkit.User;
    handleNewGroup: (users: Eventkit.User[]) => void;
    handleAddUser: (users: Eventkit.User[]) => void;
    handleMakeAdmin: (user: Eventkit.User) => void;
    handleDemoteAdmin: (user: Eventkit.User) => void;
    handleRemoveUser: (user: Eventkit.User) => void;
    isAdmin: boolean;
    showAdminButton: boolean;
    showAdminLabel: boolean;
    showRemoveButton: boolean;
    theme: Eventkit.Theme & Theme;
    classes: { [className: string]: string };
}

export class UserRow extends React.Component<Props, {}> {
    static defaultProps = {
        handleMakeAdmin: () => { console.warn('Make admin function not provided'); },
        handleDemoteAdmin: () => { console.warn('Demote admin function not provided'); },
        handleRemoveUser: () => { console.warn('Remove user function not provided'); },
        isAdmin: false,
        showAdminButton: false,
        showAdminLabel: false,
        showRemoveButton: false,
        style: {},
    };

    private onSelect: () => void;
    constructor(props: Props) {
        super(props);
        this.handleAddUserClick = this.handleAddUserClick.bind(this);
        this.handleNewGroupClick = this.handleNewGroupClick.bind(this);
        this.handleMakeAdminClick = this.handleMakeAdminClick.bind(this);
        this.handleDemoteAdminClick = this.handleDemoteAdminClick.bind(this);
        this.handleRemoveUserClick = this.handleRemoveUserClick.bind(this);
        this.onSelect = this.props.onSelect.bind(this, this.props.user);
    }

    private handleAddUserClick() {
        this.props.handleAddUser([this.props.user]);
    }

    private handleNewGroupClick() {
        this.props.handleNewGroup([this.props.user]);
    }

    private handleMakeAdminClick() {
        this.props.handleMakeAdmin(this.props.user);
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
                    onClick={adminFunction}
                    className={`qa-UserRow-MenuItem-makeAdmin ${classes.menuItem}`}
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
                    onClick={this.handleRemoveUserClick}
                    className={`qa-UserRow-MenuItem-remove ${classes.menuItem} ${classes.warning}`}
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
                <div className={classes.adminContainer}>
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
                className={`qa-UserRow ${classes.row}`}
            >
                <div className={classes.checkboxContainer}>
                    {checkbox}
                </div>
                <div style={{ display: 'flex', flex: '1 1 auto', padding: '8px 24px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', flex: '1 1 auto' }}>
                        <div className={`qa-UserRow-name ${classes.info}`}>
                            <strong>{name}</strong>
                        </div>
                        <div className={`qa-UserRow-email ${classes.info}`}>
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
                            onClick={this.handleAddUserClick}
                            className={`qa-UserRow-MenuItem-editGroups ${classes.menuItem}`}
                        >
                            Add to Existing Group
                        </MenuItem>
                        <MenuItem
                            key="new"
                            onClick={this.handleNewGroupClick}
                            className={`qa-UserRow-MenuItem-newGroup ${classes.menuItem}`}
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

export default withTheme()(withStyles(jss)(UserRow));
