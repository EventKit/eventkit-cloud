import * as PropTypes from 'prop-types';
import * as React from 'react';
import {ToastContainer} from "react-toastify";
import {connect} from 'react-redux';
import axios from 'axios';
import queryString from 'query-string';
import {withTheme, withStyles, createStyles} from '@material-ui/core/styles';
import withWidth, {isWidthUp} from '@material-ui/core/withWidth';
import {Breakpoint} from '@material-ui/core/styles/createBreakpoints';
import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/icons/Menu';
import Notifications from '@material-ui/icons/Notifications';
import Banner from './Banner';
import Drawer from './Drawer';
import BaseDialog from './Dialog/BaseDialog';
import {DrawerTimeout} from '../actions/uiActions';
import {login, userActive} from '../actions/userActions';
import {getNotifications, getNotificationsUnreadCount} from '../actions/notificationsActions';
import NotificationsDropdown from './Notification/NotificationsDropdown';
import Loadable from 'react-loadable';
import {connectedReduxRedirect} from 'redux-auth-wrapper/history4/redirect';
import createBrowserHistory from '../utils/history';
import {Redirect, Route, RouteComponentProps, Router, Switch} from 'react-router';
import {routerActions} from 'connected-react-router';
import debounce from 'lodash/debounce';
import PageLoading from './common/PageLoading';
import theme from "../styles/eventkit_theme";
import '../styles/bootstrap/css/bootstrap.css';
import '../styles/openlayers/ol.css';
import '../styles/flexboxgrid.css';
import '../styles/react-joyride-compliled.css';
import {AppConfigProvider} from "./ApplicationContext";
import MatomoHandler from "./MatomoHandler";
import {RegionsProvider} from "./common/context/RegionContext";
import 'react-toastify/dist/ReactToastify.css';
// tslint:disable-next-line:no-var-requires
require('../fonts/index.css');

const Loading = (args) => {
    if (args.pastDelay) {
        return (
            <PageLoading background="pattern"/>
        );
    }

    return null;
};

export function allTrue(acceptedLicenses) {
    return Object.keys(acceptedLicenses).every(license => acceptedLicenses[license]);
}

const loadableDefaults = {
    loading: Loading,
    delay: 1000,
};

const jss = (theme: any) => createStyles({
    appBar: {
        position: 'relative',
        height: '95px',
        backgroundColor: 'black',
        boxShadow: 'none',
        zIndex: 1299,
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
    badgeNotificationsIndicator: {
        position: 'absolute',
        right: '21%',
        top: '22%',
        width: '18px',
        height: '16px',
        backgroundColor: theme.eventkit.colors.warning,
        borderRadius: '50%',
        color: 'white',
        zIndex: '1' as any,
        textAlign: 'center',
        fontSize: '53%',
        padding: '2px',
    }
});

interface Props {
    children: React.ReactChildren;
    openDrawer: () => void;
    closeDrawer: () => void;
    userActive: () => void;
    drawer: string;
    history: any;
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
    isLoading: boolean;
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
        menuButton: string;
        notificationsButton: string;
        badgeNotificationsIndicator: string;
    };
    login: (options?: object) => void;
}

interface State {
    childContext: {
        config: {
            DATAPACK_PAGE_SIZE?: string;
            NOTIFICATIONS_PAGE_SIZE?: string;
            CONTACT_URL?: string;
            SERVE_ESTIMATES?: boolean;
            DATAPACKS_DEFAULT_SHARED?: boolean;
            MATOMO?: any;
            AUTO_LOGOUT_SECONDS?: string;
            AUTO_LOGOUT_WARNING_AT_SECONDS_LEFT?: string;
        }
    };
    autoLogoutWarningText: string;
    showAutoLogoutWarningDialog: boolean;
    showAutoLoggedOutDialog: boolean;
    showNotificationsDropdown: boolean;
    notificationsLoading: boolean;
    loggedIn: boolean;
    isMounted: false;
    user: { data: any, status: any };
}

const Loader = Loadable({
    ...loadableDefaults,
    loader: () => import('./common/PageLoading'),
});

const UserIsAuthenticated = connectedReduxRedirect({
    authenticatedSelector: (state: State) => !!state.user.data,
    authenticatingSelector: (state: State) => state.user.status.isLoading,
    AuthenticatingComponent: Loader,
    redirectAction: routerActions.replace,
    wrapperDisplayName: 'UserIsAuthenticated',
    redirectPath: '/login',
});

const UserIsNotAuthenticated = connectedReduxRedirect({
    redirectAction: routerActions.replace,
    wrapperDisplayName: 'UserIsNotAuthenticated',
    authenticatedSelector: (state: State) => {
        const checked = !state.user.data && state.user.status.isLoading === false;
        return checked;
    },
    redirectPath: (state, ownProps: RouteComponentProps<{}, {}>) => {
        const {redirect, next} = queryString.parse(ownProps.location.search);
        return (redirect as string || next as string) || '/dashboard';
    },
    allowRedirectBack: false,
});

const UserCanViewErrorPage = connectedReduxRedirect({
    redirectAction: routerActions.replace,
    wrapperDisplayName: 'UserIsNotAuthenticated',
    authenticatedSelector: (state: State) => {
        const checked = !state.user.data;
        return checked;
    },
    redirectPath: (state, ownProps: RouteComponentProps<{}, {}>) => {
        const {redirect, next} = queryString.parse(ownProps.location.search);
        return (redirect as string || next as string) || '/dashboard';
    },
    allowRedirectBack: false,
});

const UserHasAgreed = connectedReduxRedirect({
    redirectAction: routerActions.replace,
    redirectPath: '/account',
    wrapperDisplayName: 'UserHasAgreed',
    authenticatedSelector: (state: State) => allTrue(state.user.data.accepted_licenses),
});

const LoginPage = Loadable({
    ...loadableDefaults,
    loader: () => import('./auth/LoginPage'),
});

const LoginErrorPage = Loadable({
    ...loadableDefaults,
    loader: () => import('./auth/LoginErrorPage'),
});

const Logout = Loadable({
    ...loadableDefaults,
    loader: () => import('../containers/logoutContainer'),
});

const About = Loadable({
    ...loadableDefaults,
    loader: () => import('./About/About'),
});

const Account = Loadable({
    ...loadableDefaults,
    loader: () => import('./AccountPage/Account'),
});

const DashboardPage = Loadable({
    ...loadableDefaults,
    loader: () => import('./DashboardPage/DashboardPage'),
});

const DataPackPage = Loadable({
    ...loadableDefaults,
    loader: () => import('./DataPackPage/DataPackPage'),
});

const CreateExport = Loadable({
    ...loadableDefaults,
    loader: () => import('./CreateDataPack/CreateExport'),
});

const StatusDownload = Loadable({
    ...loadableDefaults,
    loader: () => import('./StatusDownloadPage/StatusDownload'),
});

const UserGroupsPage = Loadable({
    ...loadableDefaults,
    loader: () => import('./UserGroupsPage/UserGroupsPage'),
});

const NotificationsPage = Loadable({
    ...loadableDefaults,
    loader: () => import('./NotificationsPage/NotificationsPage'),
});

const history = createBrowserHistory;
const routes = (
    <Router history={history}>
        <Switch >
        <Route path="/login/error" component={UserCanViewErrorPage(LoginErrorPage)}/>
        <Route path="/login" component={UserIsNotAuthenticated(LoginPage)}/>

        <Route path="/logout" component={Logout}/>
        <Route path="/dashboard" component={UserIsAuthenticated(UserHasAgreed(DashboardPage))}/>
        <Route path="/exports" component={UserIsAuthenticated(UserHasAgreed(DataPackPage))}/>
        <Route path="/create" component={UserIsAuthenticated(UserHasAgreed(CreateExport))}/>
        <Route
            path="/status/:jobuid"
            component={UserIsAuthenticated(UserHasAgreed(StatusDownload))}
        />
        <Route path="/about" component={UserIsAuthenticated(About)}/>
        <Route path="/account" component={UserIsAuthenticated(Account)}/>
        <Route path="/groups" component={UserIsAuthenticated(UserGroupsPage)}/>
        <Route path="/notifications" component={UserIsAuthenticated(NotificationsPage)}/>
        <Route
            exact
            path="/"
            render={() => (
                <Redirect to="/dashboard"/>
            )}
        />
        </Switch>
    </Router>
);

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
    private handleUserActiveInput = null;

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
            MAX_DATAPACK_EXPIRATION_DAYS: PropTypes.string,
            USER_GROUPS_PAGE_SIZE: PropTypes.string,
            DATAPACK_PAGE_SIZE: PropTypes.string,
            NOTIFICATIONS_PAGE_SIZE: PropTypes.string,
            VERSION: PropTypes.string,
            AUTO_LOGOUT_SECONDS: PropTypes.string,
            AUTO_LOGOUT_WARNING_AT_SECONDS_LEFT: PropTypes.string,
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
        this.handleNotificationsButtonClick = this.handleNotificationsButtonClick.bind(this);
        this.handleNotificationsDropdownNavigate = this.handleNotificationsDropdownNavigate.bind(this);
        this.createActivityDebounceHandler = this.createActivityDebounceHandler.bind(this);
        this.validAutologoutSettings = this.validAutologoutSettings.bind(this);
        this.state = {
            childContext: {config: {}},
            autoLogoutWarningText: '',
            showAutoLogoutWarningDialog: false,
            showAutoLoggedOutDialog: false,
            showNotificationsDropdown: false,
            notificationsLoading: true,
            loggedIn: Boolean(props.userData),
            isMounted: false,
            user: null
        };
        this.userActiveInputTypes = ['mousemove', 'click', 'keypress', 'wheel', 'touchstart', 'touchmove', 'touchend'];
        this.notificationsUnreadCountRefreshInterval = 60000;
        this.notificationsRefreshInterval = 60000;
        this.notificationsPageSize = 10;
        this.notificationsUnreadCountIntervalId = null;
        this.notificationsRefreshIntervalId = null;
    }

    getChildContext() {
        return this.state.childContext;
    }

    checkAuth() {
        if (!this.props.userData) {
            this.props.login(null);
        }
    }

    componentDidMount() {
        this.getConfig();
        this.checkAuth();
    }

    componentDidUpdate(prevProps, prevState) {
        const {favicon, reddotfavicon} = theme.eventkit.images;
        const domFavicon = document.getElementById('favicon') as HTMLInputElement;

        if (domFavicon) {
            if (this.props.notificationsCount && this.props.notificationsCount > 0) {
                domFavicon.setAttribute("href", reddotfavicon);
            } else {
                domFavicon.setAttribute("href", favicon);
            }
        }

        if (prevState.childContext !== this.state.childContext) {
            this.notificationsPageSize = Number(this.state.childContext.config.NOTIFICATIONS_PAGE_SIZE);
        }

        if (!prevState.loggedIn && this.state.loggedIn) {
            if (this.handleUserActiveInput == null && this.validAutologoutSettings(Number(this.state.childContext.config.AUTO_LOGOUT_SECONDS), Number(this.state.childContext.config.AUTO_LOGOUT_WARNING_AT_SECONDS_LEFT))) {
                this.handleUserActiveInput = this.createActivityDebounceHandler();
                this.startCheckingForAutoLogout();
                this.startSendingUserActivePings();
            }
            this.startListeningForNotifications();
        }

        if (this.state.loggedIn && this.props.width !== prevProps.width) {
            if (this.props.width === 'xl') {
                this.props.openDrawer();
            } else if (prevProps.width === 'xl') {
                this.props.closeDrawer();
            }
        }
        if (!this.state.loggedIn && this.props.userData) {
            this.setState({loggedIn: true});
            if (this.props.width === 'xl') {
                this.props.openDrawer();
            }
        } else if (this.state.loggedIn && !this.props.userData) {
            this.setState({loggedIn: false});
            this.stopCheckingForAutoLogout();
            this.stopSendingUserActivePings();
            this.stopListeningForNotifications();
        }

        if (this.props.notificationsStatus.fetched && !prevProps.notificationsStatus.fetched) {
            this.setState({notificationsLoading: false});
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

    onMenuItemClick() {
        if (this.props.width !== 'xl') {
            this.handleToggle();
        }
    }

    getConfig() {
        return axios.get('/configuration')
            .then((response) => {
                if (response.data) {
                    const data = response.data;
                    this.setState({childContext: {config: data}});
                }
            }).catch((error) => {
                console.warn(error.response.data);
            });
    }

    async handleStayLoggedIn() {
        await this.startSendingUserActivePings();
        this.hideAutoLogoutWarning();
    }

    handleCloseAutoLoggedOutDialog() {
        this.setState({showAutoLoggedOutDialog: false});
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
        this.props.history.push('/logout');
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
        window.clearInterval(this.notificationsUnreadCountIntervalId);
        this.notificationsUnreadCountIntervalId = null;

        // Notifications.
        window.clearInterval(this.notificationsRefreshIntervalId);
        this.notificationsRefreshIntervalId = null;
    }

    autoGetNotificationsUnreadCount() {
        this.props.getNotificationsUnreadCount({isAuto: true});
    }

    autoGetNotifications() {
        this.props.getNotifications({
            pageSize: this.notificationsPageSize,
            isAuto: true,
        });
    }

    validAutologoutSettings(logoutSeconds, warningSeconds) {
        return logoutSeconds > 0 && logoutSeconds > warningSeconds;
    }

    createActivityDebounceHandler() {
        const secondsUntilWarning = Number(this.state.childContext.config.AUTO_LOGOUT_SECONDS) - Number(this.state.childContext.config.AUTO_LOGOUT_WARNING_AT_SECONDS_LEFT);
        const debounceDelay = secondsUntilWarning * 0.5 * 1000;
        return debounce(() => {
            this.props.userActive();
        },  debounceDelay, { maxWait: debounceDelay, leading: true, trailing: true});
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
            if (this.handleUserActiveInput) {
                this.handleUserActiveInput.cancel();
            }
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
        this.setState({showAutoLogoutWarningDialog: true});

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

        this.setState({showAutoLogoutWarningDialog: false});

        window.clearInterval(this.autoLogoutWarningIntervalId);
        this.autoLogoutWarningIntervalId = null;
    }

    handleClick(e) {
        if (e.srcElement.className && e.srcElement.className.includes('qa-NotificationMenu-MenuItem')) {
            // user clicked on a menu item which is a child of the dropdown but MUI does not know that.
            // we need to handle it ourselves
            return;
        }
        // Close the notifications dropdown if it's open and we click outside of it.
        if (this.state.showNotificationsDropdown) {
            this.setState({showNotificationsDropdown: false});
        }
    }

    handleNotificationsButtonClick(e) {
        e.preventDefault();
        e.stopPropagation();
        this.setState({
            showNotificationsDropdown: !this.state.showNotificationsDropdown
        });
    }

    handleNotificationsDropdownNavigate() {
        this.setState({showNotificationsDropdown: false});
        // Allow navigation to proceed.
        return true;
    }

    handleNotificationCount() {
        if (this.props.notificationsCount > 99) {
            return "+99";
        }
        if (this.props.notificationsCount > 0) {
            return this.props.notificationsCount;
        } else {
            return;
        }
    }

    render() {
        const {classes} = this.props;
        const {colors, images} = this.props.theme.eventkit;
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
            <AppConfigProvider value={this.state.childContext.config}>
                <RegionsProvider>
                    <MatomoHandler {...this.state.childContext.config.MATOMO}>
                        <div style={{backgroundColor: colors.black}}>
                            <AppBar
                                className={`qa-Application-AppBar ${classes.appBar}`}
                            >
                                <Banner/>
                                <div className={classes.title}>
                                    <img className={classes.img} src={images.logo} alt="EventKit"/>
                                </div>
                                {this.state.loggedIn ? <div style={{position: 'absolute', left: '0', top: '25px'}}>
                                    <IconButton
                                        className={`qa-Application-AppBar-MenuButton ${classes.menuButton}`}
                                        color="secondary"
                                        onClick={this.handleToggle}
                                    >
                                        <Menu style={{width: '36px', height: '36px'}}/>
                                    </IconButton>
                                    <div style={{display: 'inline-block', position: 'relative'}}>
                                        <IconButton
                                            className={`qa-Application-AppBar-NotificationsButton ${classes.notificationsButton}`}
                                            style={{
                                                backgroundColor: (this.props.history.location.pathname.indexOf('/notifications') === 0) ?
                                                    colors.primary : '',
                                                padding: 0
                                            }}
                                            color="secondary"
                                            onClick={this.handleNotificationsButtonClick}
                                        >
                                            <Notifications style={{width: '38px', height: '38px'}}/>
                                        </IconButton>
                                        <div
                                            className={`qa-Application-AppBar-badgeNotificationsIndicator ${classes.badgeNotificationsIndicator}`}
                                            style={{
                                                transform: (this.props.notificationsCount > 0) ? 'scale(1)' : 'scale(0)',
                                                transition: 'transform 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
                                            }}
                                        >
                                            {this.handleNotificationCount()}
                                        </div>
                                        <div>
                                            {this.state.showNotificationsDropdown ?
                                                <NotificationsDropdown
                                                    loading={this.state.notificationsLoading}
                                                    notifications={this.props.notificationsData}
                                                    history={this.props.history}
                                                    onNavigate={this.handleNotificationsDropdownNavigate}
                                                    onClickAway={this.handleClick}
                                                /> : null}
                                        </div>
                                    </div>
                                </div> : null}
                            </AppBar>
                            <Drawer
                                open={this.props.drawer === 'open' || this.props.drawer === 'opening'}
                                handleLogout={this.logout}
                                handleMenuItemClick={this.onMenuItemClick}
                                contactUrl={this.state.childContext.config.CONTACT_URL}
                            />
                            <div className="qa-Application-content" style={styles.content}>
                                {childrenWithContext}
                                {routes}
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
                            <ToastContainer
                                position="top-right"
                                autoClose={10000}
                                hideProgressBar={false}
                                newestOnTop={false}
                                closeOnClick
                                rtl={false}
                                pauseOnFocusLoss
                                pauseOnHover
                                limit={3}
                            />
                        </div>
                    </MatomoHandler>
                </RegionsProvider>
            </AppConfigProvider>
        );
    }
}

function mapStateToProps(state) {
    return {
        drawer: state.drawer,
        userData: state.user.data,
        isLoading: state.user.status.isLoading,
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
        login: (args) => {
            dispatch(login(args));
        }
    };
}

export default withWidth()(
    withTheme<any>(
        withStyles<any, any>(jss)(
            connect(mapStateToProps, mapDispatchToProps)(
                Application
            )
        )
    )
);
