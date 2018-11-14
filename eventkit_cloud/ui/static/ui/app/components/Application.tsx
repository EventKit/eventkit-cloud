import * as PropTypes from 'prop-types';
import * as React from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';
import AppBar from '@material-ui/core/AppBar';
import Drawer from '@material-ui/core/Drawer';
import MenuItem from '@material-ui/core/MenuItem';
import { IndexLink, Link } from 'react-router';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/icons/Menu';
import AVLibraryBooks from '@material-ui/icons/LibraryBooks';
import ContentAddBox from '@material-ui/icons/AddBox';
import Dashboard from '@material-ui/icons/Dashboard';
import ActionInfoOutline from '@material-ui/icons/InfoOutlined';
import SocialPerson from '@material-ui/icons/Person';
import SocialGroup from '@material-ui/icons/Group';
import ActionExitToApp from '@material-ui/icons/ExitToApp';
import Notifications from '@material-ui/icons/Notifications';
import Mail from '@material-ui/icons/MailOutlined';
import { withTheme, withStyles, createStyles } from '@material-ui/core/styles';
import Banner from './Banner';
import BaseDialog from './Dialog/BaseDialog';
import { DrawerTimeout } from '../actions/uiActions';
import { userActive } from '../actions/userActions';
import { getNotifications, getNotificationsUnreadCount } from '../actions/notificationsActions';
import ConfirmDialog from './Dialog/ConfirmDialog';
import NotificationsDropdown from './Notification/NotificationsDropdown';
import '../styles/bootstrap/css/bootstrap.css';
import '../styles/openlayers/ol.css';
import '../styles/flexboxgrid.css';
import '../styles/react-joyride-compliled.css';
// tslint:disable-next-line:no-var-requires
require('../fonts/index.css');

const jss = (theme: any) => createStyles({
    appBar: {
        position: 'relative',
        height: '95px',
        backgroundColor: 'black',
        boxShadow: 'none',
        zIndex: 1301,
    },
    img: {
        width: '256px',
        margin: '0 20px',
        [theme.breakpoints.only('xs')]: {
            width: '180px',
        },
    },
    title: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        [theme.breakpoints.only('xs')]: {
            justifyContent: 'flex-end',
        },
    },
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
    menuButton: {
        width: '70px',
        height: '70px',
    },
    notificationsButton: {
        width: '70px',
        height: '70px',
        transitionProperty: 'none',
        borderRadius: 'unset',
    },
    notificationsIndicator: {
        position: 'absolute',
        top: '36%',
        right: '29%',
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        backgroundColor: theme.eventkit.colors.warning,
        zIndex: '1' as any,
        pointerEvents: 'none',
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
    children: React.ReactChildren;
    openDrawer: () => void;
    closeDrawer: () => void;
    userActive: () => void;
    drawer: string;
    router: any;
    userData: {
        accepted_licenses: object;
        user: {
            username: string;
            last_name: string;
            first_name: string;
            email: string;
            commonname: string;
            date_joined: string;
            last_login: string;
            identification: string;
        };
    };
    autoLogoutAt: Date;
    autoLogoutWarningAt: Date;
    notificationsData: Eventkit.Store.NotificationsData;
    notificationsStatus: Eventkit.Store.NotificationsStatus;
    notificationsCount: number;
    getNotificationsUnreadCount: (options?: object) => void;
    getNotifications: (options?: object) => void;
    width: Breakpoint;
    theme: Eventkit.Theme;
    classes: {
        appBar: string;
        title: string;
        img: string;
        link: string;
        activeLink: string;
        menuButton: string;
        menuItem: string;
        notificationsButton: string;
        notificationsIndicator: string;
        drawer: string;
        icon: string;
        contact: string;
    };
}

interface State {
    childContext: { config: {
        DATAPACK_PAGE_SIZE?: string;
        NOTIFICATIONS_PAGE_SIZE?: string;
        CONTACT_URL?: string;
    }};
    autoLogoutWarningText: string;
    showAutoLogoutWarningDialog: boolean;
    showAutoLoggedOutDialog: boolean;
    showLogoutDialog: boolean;
    showNotificationsDropdown: boolean;
    notificationsLoading: boolean;
    loggedIn: boolean;
}

export class Application extends React.Component<Props, State> {
    private userActiveInputTypes: string[];
    private notificationsUnreadCountRefreshInterval: number;
    private notificationsRefreshInterval: number;
    private notificationsPageSize: number;
    private notificationsUnreadCountIntervalId: number | null;
    private notificationsRefreshIntervalId: number | null;
    private checkAutoLogoutIntervalId: number | null;
    private autoLogoutWarningIntervalId: number | null;
    private isSendingUserActivePings: boolean;
    private handleUserActiveInput: () => void;

    static defaultProps = {
        children: null,
        autoLogoutAt: null,
        autoLogoutWarningAt: null,
        userData: null,
    };

    static childContextTypes = {
        config: PropTypes.shape({
            BANNER_BACKGROUND_COLOR: PropTypes.string,
            BANNER_TEXT: PropTypes.string,
            BANNER_TEXT_COLOR: PropTypes.string,
            BASEMAP_COPYRIGHT: PropTypes.string,
            BASEMAP_URL: PropTypes.string,
            LOGIN_DISCLAIMER: PropTypes.string,
            MAX_VECTOR_AOI_SQ_KM: PropTypes.number,
            MAX_RASTER_AOI_SQ_KM: PropTypes.number,
            MAX_DATAPACK_EXPIRATION_DAYS: PropTypes.string,
            USER_GROUPS_PAGE_SIZE: PropTypes.string,
            DATAPACK_PAGE_SIZE: PropTypes.string,
            NOTIFICATIONS_PAGE_SIZE: PropTypes.string,
            VERSION: PropTypes.string,
        }),
    };

    constructor(props) {
        super(props);
        this.handleToggle = this.handleToggle.bind(this);
        this.onMenuItemClick = this.onMenuItemClick.bind(this);
        this.getConfig = this.getConfig.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.logout = this.logout.bind(this);
        this.startListeningForNotifications = this.startListeningForNotifications.bind(this);
        this.stopListeningForNotifications = this.stopListeningForNotifications.bind(this);
        this.autoGetNotificationsUnreadCount = this.autoGetNotificationsUnreadCount.bind(this);
        this.autoGetNotifications = this.autoGetNotifications.bind(this);
        this.startCheckingForAutoLogout = this.startCheckingForAutoLogout.bind(this);
        this.stopCheckingForAutoLogout = this.stopCheckingForAutoLogout.bind(this);
        this.startSendingUserActivePings = this.startSendingUserActivePings.bind(this);
        this.stopSendingUserActivePings = this.stopSendingUserActivePings.bind(this);
        this.handleStayLoggedIn = this.handleStayLoggedIn.bind(this);
        this.handleCloseAutoLoggedOutDialog = this.handleCloseAutoLoggedOutDialog.bind(this);
        this.handleLogoutDialogCancel = this.handleLogoutDialogCancel.bind(this);
        this.handleLogoutDialogConfirm = this.handleLogoutDialogConfirm.bind(this);
        this.handleLogoutClick = this.handleLogoutClick.bind(this);
        this.handleNotificationsButtonClick = this.handleNotificationsButtonClick.bind(this);
        this.handleNotificationsDropdownNavigate = this.handleNotificationsDropdownNavigate.bind(this);
        this.state = {
            childContext: { config: {} },
            autoLogoutWarningText: '',
            showAutoLogoutWarningDialog: false,
            showAutoLoggedOutDialog: false,
            showLogoutDialog: false,
            showNotificationsDropdown: false,
            notificationsLoading: true,
            loggedIn: Boolean(props.userData),
        };
        this.userActiveInputTypes = ['mousemove', 'click', 'keypress', 'wheel', 'touchstart', 'touchmove', 'touchend'];
        this.notificationsUnreadCountRefreshInterval = 10000;
        this.notificationsRefreshInterval = 10000;
        this.notificationsPageSize = 10;
        this.notificationsUnreadCountIntervalId = null;
        this.notificationsRefreshIntervalId = null;
    }

    getChildContext() {
        return this.state.childContext;
    }

    componentDidMount() {
        this.getConfig();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.childContext !== this.state.childContext) {
            this.notificationsPageSize = Number(this.state.childContext.config.NOTIFICATIONS_PAGE_SIZE);
            if (this.state.loggedIn || this.props.userData) {
                this.startCheckingForAutoLogout();
                this.startSendingUserActivePings();
                this.startListeningForNotifications();
            }
        }
        if (this.state.loggedIn && this.props.width !== prevProps.width) {
            if (this.props.width === 'xl') {
                this.props.openDrawer();
            } else if (prevProps.width === 'xl') {
                this.props.closeDrawer();
            }
        }
        if (!this.state.loggedIn && this.props.userData) {
            this.setState({ loggedIn: true });
            if (this.props.width === 'xl') {
                this.props.openDrawer();
            }
        } else if (this.state.loggedIn && !this.props.userData) {
            this.setState({ loggedIn: false });
            this.stopCheckingForAutoLogout();
            this.stopSendingUserActivePings();
            this.stopListeningForNotifications();
        }

        if (this.props.notificationsStatus.fetched && !prevProps.notificationsStatus.fetched) {
            this.setState({ notificationsLoading: false });
        }
    }

    shouldComponentUpdate(prevProps, prevState) {
        if (prevState.loggedIn !== this.state.loggedIn) {
            // if login state has changed we always update
            return true;
        }

        const status = prevProps.notificationsStatus;
        const oldStatus = this.props.notificationsStatus;

        // if the status object has changed we need to inspect
        if (status !== oldStatus) {
            // if there is a error change we need to update
            if (status.error !== oldStatus.error) {
                return true;
            }
            // if a fetch has completed AND the data has changed we need to update OR loading state is true
            if (status.fetched && (
                (prevProps.notificationsData !== this.props.notificationsData) || this.state.notificationsLoading)
            ) {
                return true;
            }
            // any other status change can be ignored
            return false;
        }

        // if the status is not the update we can default to true
        return true;
    }

    componentWillUnmount() {
        this.stopListeningForNotifications();
    }

    onMenuItemClick() {
        if (this.props.width !== 'xl') {
            this.handleToggle();
        }
    }

    getConfig() {
        return axios.get('/configuration')
            .then((response) => {
                if (response.data) {
                    this.setState({ childContext: { config: response.data } });
                }
            }).catch((error) => {
                console.log(error.response.data);
            });
    }

    async handleStayLoggedIn() {
        await this.startSendingUserActivePings();
        this.hideAutoLogoutWarning();
    }

    handleCloseAutoLoggedOutDialog() {
        this.setState({ showAutoLoggedOutDialog: false });
    }

    handleToggle() {
        if (this.props.drawer === 'open' || this.props.drawer === 'opening') {
            this.props.closeDrawer();
        } else {
            this.props.openDrawer();
        }
    }

    logout() {
        this.props.closeDrawer();
        this.props.router.push('/logout');
    }

    startListeningForNotifications() {
        if (this.notificationsUnreadCountIntervalId || this.notificationsRefreshIntervalId) {
            console.warn('Already listening for notifications.');
            return;
        }

        // Unread notifications count.
        this.props.getNotificationsUnreadCount();
        this.notificationsUnreadCountIntervalId = window.setInterval(
            this.autoGetNotificationsUnreadCount,
            this.notificationsUnreadCountRefreshInterval,
        );

        // Notifications.
        this.props.getNotifications({
            pageSize: this.notificationsPageSize,
            isAuto: true,
        });
        this.notificationsRefreshIntervalId = window.setInterval(this.autoGetNotifications, this.notificationsRefreshInterval);
    }

    stopListeningForNotifications() {
        if (!this.notificationsUnreadCountIntervalId || !this.notificationsRefreshIntervalId) {
            console.warn('Already stopped listening for notifications.');
            return;
        }

        // Unread notifications count.
        clearInterval(this.notificationsUnreadCountIntervalId);
        this.notificationsUnreadCountIntervalId = null;

        // Notifications.
        clearInterval(this.notificationsRefreshIntervalId);
        this.notificationsRefreshIntervalId = null;
    }

    autoGetNotificationsUnreadCount() {
        this.props.getNotificationsUnreadCount({ isAuto: true });
    }

    autoGetNotifications() {
        this.props.getNotifications({
            pageSize: this.notificationsPageSize,
            isAuto: true,
        });
    }

    startCheckingForAutoLogout() {
        if (this.checkAutoLogoutIntervalId) {
            console.warn('Already checking for auto logout.');
            return;
        }

        // Regularly check if the user should be notified about an impending auto logout.
        this.checkAutoLogoutIntervalId = window.setInterval(() => {
            if (!this.props.autoLogoutAt) {
                return;
            }

            if (Date.now() >= this.props.autoLogoutAt.getTime()) {
                // Redirect to logout and show auto logged out dialog.
                this.stopCheckingForAutoLogout();
                this.stopSendingUserActivePings();
                this.hideAutoLogoutWarning();
                this.setState({
                    showAutoLoggedOutDialog: true,
                });
                this.logout();
            } else if (Date.now() >= this.props.autoLogoutWarningAt.getTime()) {
                if (!this.state.showAutoLogoutWarningDialog) {
                    this.showAutoLogoutWarning();
                }
            }
        }, 1000);
    }

    stopCheckingForAutoLogout() {
        if (!this.checkAutoLogoutIntervalId) {
            console.warn('Not checking for auto logout.');
            return;
        }

        window.clearInterval(this.checkAutoLogoutIntervalId);
        this.checkAutoLogoutIntervalId = null;
    }

    async startSendingUserActivePings() {
        if (this.isSendingUserActivePings) {
            console.warn('Already sending user active pings.');
            return;
        }

        this.isSendingUserActivePings = true;

        let sendPing = true;
        this.handleUserActiveInput = () => {
            if (sendPing) {
                // Allow the next ping to be sent after one minute.
                sendPing = false;
                setTimeout(() => {
                    sendPing = true;
                }, 60 * 1000);
                // Notify server.
                this.props.userActive();
            }
        };

        // Check all forms of input to track user activity.
        this.userActiveInputTypes.forEach((eventType: string) => {
            window.addEventListener(eventType, this.handleUserActiveInput);
        });

        // Send an initial user active ping to kick the whole cycle off.
        await this.props.userActive();
    }

    stopSendingUserActivePings() {
        if (!this.isSendingUserActivePings) {
            console.warn('Not sending user active pings.');
            return;
        }

        this.isSendingUserActivePings = false;

        // Remove input event listeners.
        this.userActiveInputTypes.forEach((eventType: string) => {
            window.removeEventListener(eventType, this.handleUserActiveInput);
        });
    }

    showAutoLogoutWarning() {
        if (this.autoLogoutWarningIntervalId) {
            console.warn('Already showing auto logout warning.');
            return;
        }

        const updateAutoLogoutWarningText = () => {
            const secondsLeft = Math.ceil((this.props.autoLogoutAt.getTime() - Date.now()) / 1000);

            let timeLeftText;
            if (secondsLeft > 60) {
                // For anything above one minute, show minutes left.
                const minutesLeft = Math.ceil(secondsLeft / 60);
                timeLeftText = `${minutesLeft} minutes`;
            } else {
                // For one minute or less, show seconds left.
                timeLeftText = `${secondsLeft} second`;
                if (secondsLeft !== 1) {
                    timeLeftText += 's';
                }
            }

            this.setState({
                autoLogoutWarningText: `You will be automatically logged out in ${timeLeftText} due to inactivity.`,
            });
        };

        updateAutoLogoutWarningText();
        this.setState({ showAutoLogoutWarningDialog: true });

        // Stop automatically sending user active pings during this time, so that the user
        // has to press a button to stay logged in.
        this.stopSendingUserActivePings();

        // Update auto logout warning text every second.
        this.autoLogoutWarningIntervalId = window.setInterval(updateAutoLogoutWarningText, 1000);
    }

    hideAutoLogoutWarning() {
        if (!this.autoLogoutWarningIntervalId) {
            console.warn('Not showing auto logout warning.');
            return;
        }

        this.setState({ showAutoLogoutWarningDialog: false });

        window.clearInterval(this.autoLogoutWarningIntervalId);
        this.autoLogoutWarningIntervalId = null;
    }

    handleClick() {
        // Close the notifications dropdown if it's open and we click outside of it.
        if (this.state.showNotificationsDropdown) {
            this.setState({ showNotificationsDropdown: false });
        }
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

        this.logout();
    }

    handleNotificationsButtonClick(e) {
        e.preventDefault();
        e.stopPropagation();
        this.setState({
            showNotificationsDropdown: !this.state.showNotificationsDropdown,
        });
    }

    handleNotificationsDropdownNavigate() {
        this.setState({ showNotificationsDropdown: false });
        // Allow navigation to proceed.
        return true;
    }

    render() {
        const { classes } = this.props;
        const { colors, images } = this.props.theme.eventkit;
        const mainAppBarHeight = 95;
        const styles = {
            content: {
                transition: 'margin-left 450ms cubic-bezier(0.23, 1, 0.32, 1)',
                marginLeft: (this.props.drawer === 'open' || this.props.drawer === 'opening')
                    && isWidthUp('xl', this.props.width) ? 200 : 0,
                background: 'rgb(17, 24, 35)',
                backgroundImage: `url(${images.topo_dark})`,
                height: `calc(100vh - ${mainAppBarHeight}px)`,
            },
        };

        const childrenWithContext = React.Children.map(this.props.children, child => (
            React.cloneElement(child as React.ReactElement<any>, {
                context: this.state.childContext,
            })
        ));

        return (
            <div style={{ backgroundColor: colors.black }}>
                <AppBar
                    className={`qa-Application-AppBar ${classes.appBar}`}
                >
                    <Banner />
                    <div className={classes.title}>
                        <img className={classes.img} src={images.logo} alt="EventKit" />
                    </div>
                    {this.state.loggedIn ? <div style={{ position: 'absolute', left: '0', top: '25px' }}>
                        <IconButton
                            className={`qa-Application-AppBar-MenuButton ${classes.menuButton}`}
                            color="secondary"
                            onClick={this.handleToggle}
                        >
                            <Menu style={{ width: '36px', height: '36px' }} />
                        </IconButton>
                        <div style={{ display: 'inline-block', position: 'relative' }}>
                            <IconButton
                                className={`qa-Application-AppBar-NotificationsButton ${classes.notificationsButton}`}
                                style={{
                                    backgroundColor: (this.props.router.location.pathname.indexOf('/notifications') === 0) ?
                                        colors.primary : '',
                                }}
                                color="secondary"
                                onClick={this.handleNotificationsButtonClick}
                            >
                                <Notifications style={{ width: '38px', height: '38px' }} />
                            </IconButton>
                            <div
                                className={`qa-Application-AppBar-NotificationsIndicator ${classes.notificationsIndicator}`}
                                style={{
                                    transition: 'transform 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
                                    transform: (this.props.notificationsCount > 0) ? 'scale(1)' : 'scale(0)',
                                }}
                            />
                            <div>
                                {this.state.showNotificationsDropdown ?
                                    <NotificationsDropdown
                                        loading={this.state.notificationsLoading}
                                        notifications={this.props.notificationsData}
                                        router={this.props.router}
                                        onNavigate={this.handleNotificationsDropdownNavigate}
                                        onClickAway={this.handleClick}
                                    /> : null }
                            </div>
                        </div>
                    </div> : null}
                </AppBar>
                <Drawer
                    className="qa-Application-Drawer"
                    classes={{ paper: classes.drawer }}
                    SlideProps={{ unmountOnExit: true }}
                    variant="persistent"
                    open={this.props.drawer === 'open' || this.props.drawer === 'opening'}
                >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <MenuItem
                            className={`qa-Application-MenuItem-dashboard ${classes.menuItem}`}
                            onClick={this.onMenuItemClick}
                        >
                            <IndexLink
                                className={`qa-Application-Link-dashboard ${classes.link}`}
                                activeClassName={classes.activeLink}
                                to="/dashboard"
                            >
                                <Dashboard className={classes.icon} />
                                Dashboard
                            </IndexLink>
                        </MenuItem>
                        <MenuItem
                            className={`qa-Application-MenuItem-exports ${classes.menuItem}`}
                            onClick={this.onMenuItemClick}
                        >
                            <Link
                                className={`qa-Application-Link-exports ${classes.link}`}
                                activeClassName={classes.activeLink}
                                to="/exports"
                                href="/exports"
                            >
                                <AVLibraryBooks className={classes.icon} />
                                DataPack Library
                            </Link>
                        </MenuItem>
                        <MenuItem
                            className={`qa-Application-MenuItem-create ${classes.menuItem}`}
                            onClick={this.onMenuItemClick}
                        >
                            <Link
                                className={`qa-Application-Link-create ${classes.link}`}
                                activeClassName={classes.activeLink}
                                to="/create"
                                href="/create"
                            >
                                <ContentAddBox className={classes.icon} />
                                Create DataPack
                            </Link>
                        </MenuItem>
                        <MenuItem
                            className={`qa-Application-MenuItem-groups ${classes.menuItem}`}
                            onClick={this.onMenuItemClick}
                        >
                            <Link
                                className={`qa-Application-Link-groups ${classes.link}`}
                                activeClassName={classes.activeLink}
                                to="/groups"
                                href="/groups"
                            >
                                <SocialGroup className={classes.icon} />
                                Members and Groups
                            </Link>
                        </MenuItem>
                        <MenuItem
                            className={`qa-Application-MenuItem-about ${classes.menuItem}`}
                            onClick={this.onMenuItemClick}
                        >
                            <Link
                                className={`qa-Application-Link-about ${classes.link}`}
                                activeClassName={classes.activeLink}
                                to="/about"
                                href="/about"
                            >
                                <ActionInfoOutline className={classes.icon} />
                                About EventKit
                            </Link>
                        </MenuItem>
                        <MenuItem
                            className={`qa-Application-MenuItem-account ${classes.menuItem}`}
                            onClick={this.onMenuItemClick}
                        >
                            <Link
                                className={`qa-Application-Link-account ${classes.link}`}
                                activeClassName={classes.activeLink}
                                to="/account"
                                href="/account"
                            >
                                <SocialPerson className={classes.icon} />
                                Account Settings
                            </Link>
                        </MenuItem>
                        <MenuItem
                            className={`qa-Application-MenuItem-logout ${classes.menuItem}`}
                        >
                            <Link // eslint-disable-line jsx-a11y/anchor-is-valid
                                className={`qa-Application-Link-logout ${classes.link}`}
                                activeClassName={classes.activeLink}
                                onClick={this.handleLogoutClick}
                                to={undefined}
                            >
                                <ActionExitToApp className={classes.icon} />
                                Log Out
                            </Link>
                        </MenuItem>
                    </div>
                    {this.state.childContext.config.CONTACT_URL ? <a
                        className={`qa-Application-contact ${classes.contact}`}
                        href={this.state.childContext.config.CONTACT_URL}
                    >
                        <Mail className={classes.icon} />Contact Us
                    </a> : null}
                </Drawer>
                <div className="qa-Application-content" style={styles.content}>
                    <div>{childrenWithContext}</div>
                </div>
                <BaseDialog
                    show={this.state.showAutoLogoutWarningDialog}
                    title="AUTO LOGOUT"
                    buttonText="Stay Logged In"
                    onClose={this.handleStayLoggedIn}
                >
                    <strong>{this.state.autoLogoutWarningText}</strong>
                </BaseDialog>
                <BaseDialog
                    show={this.state.showAutoLoggedOutDialog}
                    title="AUTO LOGOUT"
                    onClose={this.handleCloseAutoLoggedOutDialog}
                >
                    <strong>You have been automatically logged out due to inactivity.</strong>
                </BaseDialog>
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
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        drawer: state.drawer,
        userData: state.user.data,
        autoLogoutAt: state.user.meta.autoLogoutAt,
        autoLogoutWarningAt: state.user.meta.autoLogoutWarningAt,
        notificationsStatus: state.notifications.status,
        notificationsData: state.notifications.data,
        notificationsCount: state.notifications.unreadCount.data.unreadCount,
    };
}

function mapDispatchToProps(dispatch) {
    const timeout = new DrawerTimeout();
    return {
        closeDrawer: () => {
            dispatch(timeout.closeDrawer());
        },
        openDrawer: () => {
            dispatch(timeout.openDrawer());
        },
        userActive: () => (
            dispatch(userActive())
        ),
        getNotificationsUnreadCount: () => {
            dispatch(getNotificationsUnreadCount());
        },
        getNotifications: (args) => {
            dispatch(getNotifications(args));
        },
    };
}

export default withWidth()(
    withTheme()<any>(
        withStyles<any, any>(jss)(
            connect(mapStateToProps, mapDispatchToProps)(
                Application
            )
        )
    )
);
