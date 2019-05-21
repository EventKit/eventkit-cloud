import * as React from 'react';
import { withTheme, withStyles, createStyles } from '@material-ui/core/styles';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';
import MuiDrawer from '@material-ui/core/Drawer';
import MenuItem from '@material-ui/core/MenuItem';
import { IndexLink, Link } from 'react-router';
import AVLibraryBooks from '@material-ui/icons/LibraryBooks';
import ContentAddBox from '@material-ui/icons/AddBox';
import Dashboard from '@material-ui/icons/Dashboard';
import ActionInfoOutline from '@material-ui/icons/InfoOutlined';
import SocialPerson from '@material-ui/icons/Person';
import SocialGroup from '@material-ui/icons/Group';
import ActionExitToApp from '@material-ui/icons/ExitToApp';
import Mail from '@material-ui/icons/MailOutlined';
import ConfirmDialog from './Dialog/ConfirmDialog';

const jss = (theme: any) => createStyles({
    link: {
        padding: '0px 0px 0px 5px',
        width: '100%',
        height: '58px',
        lineHeight: '58px',
        textDecoration: 'none',
        color: theme.eventkit.colors.primary,
        fill: theme.eventkit.colors.primary,
        '&:hover': {
            textDecoration: 'none',
            color: theme.eventkit.colors.primary,
            backgroundColor: theme.eventkit.colors.background,
        },
        '&:focus': {
            textDecoration: 'none',
            color: theme.eventkit.colors.primary,
            backgroundColor: theme.eventkit.colors.background,
        },
    },
    activeLink: {
        textDecoration: 'none',
        color: theme.eventkit.colors.primary,
        backgroundColor: theme.eventkit.colors.background,
    },
    drawer: {
        width: '200px',
        height: 'calc(100% - 95px)',
        marginTop: '95px',
        backgroundColor: theme.eventkit.colors.black,
        padding: '0px',
        justifyContent: 'space-between',
    },
    menuItem: {
        fontSize: '16px',
        height: '58px',
        padding: '0px 0px',
    },
    icon: {
        height: '22px',
        width: '22px',
        marginRight: '11px',
        verticalAlign: 'middle',
        fill: 'inherit',
    },
    contact: {
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '11px',
        marginBottom: '20px',
        color: theme.eventkit.colors.primary,
        fill: theme.eventkit.colors.primary,
        '&:hover': {
            color: theme.eventkit.colors.primary,
        },
        '&:focus': {
            color: theme.eventkit.colors.primary,
        },
    },
});

interface Props {
    open: boolean;
    handleLogout: () => void;
    handleMenuItemClick: () => void;
    contactUrl?: string;
    width: Breakpoint;
    theme: Eventkit.Theme;
    classes: {
        link: string;
        activeLink: string;
        menuItem: string;
        drawer: string;
        icon: string;
        contact: string;
    };
}

interface State {
    showLogoutDialog: boolean;
}

export class Drawer extends React.Component<Props, State> {
    constructor(props) {
        super(props);
        this.handleLogoutDialogCancel = this.handleLogoutDialogCancel.bind(this);
        this.handleLogoutDialogConfirm = this.handleLogoutDialogConfirm.bind(this);
        this.handleLogoutClick = this.handleLogoutClick.bind(this);
        this.state = {
            showLogoutDialog: false,
        };
    }

    handleLogoutClick() {
        this.setState({
            showLogoutDialog: true,
        });
    }

    handleLogoutDialogCancel() {
        this.setState({
            showLogoutDialog: false,
        });
    }

    handleLogoutDialogConfirm() {
        this.setState({
            showLogoutDialog: false,
        });

        this.props.handleLogout();
    }

    render() {
        const { classes } = this.props;

        return (
            <React.Fragment>
                <MuiDrawer
                    className="qa-Drawer-Drawer"
                    classes={{ paper: classes.drawer }}
                    SlideProps={{ unmountOnExit: true }}
                    variant="persistent"
                    open={this.props.open}
                >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <MenuItem
                            className={`qa-Drawer-MenuItem-dashboard ${classes.menuItem}`}
                            onClick={this.props.handleMenuItemClick}
                        >
                            <IndexLink
                                className={`qa-Drawer-Link-dashboard ${classes.link}`}
                                activeClassName={classes.activeLink}
                                to="/dashboard"
                            >
                                <Dashboard className={classes.icon} />
                                Dashboard
                            </IndexLink>
                        </MenuItem>
                        <MenuItem
                            className={`qa-Drawer-MenuItem-exports ${classes.menuItem}`}
                            onClick={this.props.handleMenuItemClick}
                        >
                            <Link
                                className={`qa-Drawer-Link-exports ${classes.link}`}
                                activeClassName={classes.activeLink}
                                to="/exports"
                                href="/exports"
                            >
                                <AVLibraryBooks className={classes.icon} />
                                DataPack Library
                            </Link>
                        </MenuItem>
                        <MenuItem
                            className={`qa-Drawer-MenuItem-create ${classes.menuItem}`}
                            onClick={this.props.handleMenuItemClick}
                        >
                            <Link
                                className={`qa-Drawer-Link-create ${classes.link}`}
                                activeClassName={classes.activeLink}
                                to="/create"
                                href="/create"
                            >
                                <ContentAddBox className={classes.icon} />
                                Create DataPack
                            </Link>
                        </MenuItem>
                        <MenuItem
                            className={`qa-Drawer-MenuItem-groups ${classes.menuItem}`}
                            onClick={this.props.handleMenuItemClick}
                        >
                            <Link
                                className={`qa-Drawer-Link-groups ${classes.link}`}
                                activeClassName={classes.activeLink}
                                to="/groups"
                                href="/groups"
                            >
                                <SocialGroup className={classes.icon} />
                                Members and Groups
                            </Link>
                        </MenuItem>
                        <MenuItem
                            className={`qa-Drawer-MenuItem-about ${classes.menuItem}`}
                            onClick={this.props.handleMenuItemClick}
                        >
                            <Link
                                className={`qa-Drawer-Link-about ${classes.link}`}
                                activeClassName={classes.activeLink}
                                to="/about"
                                href="/about"
                            >
                                <ActionInfoOutline className={classes.icon} />
                                About EventKit
                            </Link>
                        </MenuItem>
                        <MenuItem
                            className={`qa-Drawer-MenuItem-account ${classes.menuItem}`}
                            onClick={this.props.handleMenuItemClick}
                        >
                            <Link
                                className={`qa-Drawer-Link-account ${classes.link}`}
                                activeClassName={classes.activeLink}
                                to="/account"
                                href="/account"
                            >
                                <SocialPerson className={classes.icon} />
                                Account Settings
                            </Link>
                        </MenuItem>
                        <MenuItem
                            className={`qa-Drawer-MenuItem-logout ${classes.menuItem}`}
                        >
                            <Link // eslint-disable-line jsx-a11y/anchor-is-valid
                                className={`qa-Drawer-Link-logout ${classes.link}`}
                                activeClassName={classes.activeLink}
                                onClick={this.handleLogoutClick}
                                to={undefined}
                            >
                                <ActionExitToApp className={classes.icon} />
                                Log Out
                            </Link>
                        </MenuItem>
                    </div>
                    {this.props.contactUrl ? <a
                        className={`qa-Drawer-contact ${classes.contact}`}
                        href={this.props.contactUrl}
                    >
                        <Mail className={classes.icon} />Contact Us
                    </a> : null}
                </MuiDrawer>
                <ConfirmDialog
                    show={this.state.showLogoutDialog}
                    title="LOG OUT"
                    confirmLabel="Log Out"
                    isDestructive
                    onCancel={this.handleLogoutDialogCancel}
                    onConfirm={this.handleLogoutDialogConfirm}
                >
                    <strong>Are you sure?</strong>
                </ConfirmDialog>
            </React.Fragment>
        );
    }
}

export default withTheme()(
    withStyles(jss)(
        Drawer
    )
);
