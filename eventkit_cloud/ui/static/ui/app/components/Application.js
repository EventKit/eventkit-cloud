import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import AppBar from '@material-ui/core/AppBar';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import { Link, IndexLink } from 'react-router';
import IconButton from 'material-ui/IconButton';
import Menu from '@material-ui/icons/Menu';
import AVLibraryBooks from '@material-ui/icons/LibraryBooks';
import ContentAddBox from '@material-ui/icons/AddBox';
import Dashboard from '@material-ui/icons/Dashboard';
import ActionInfoOutline from '@material-ui/icons/InfoOutlined';
import SocialPerson from '@material-ui/icons/Person';
import SocialGroup from '@material-ui/icons/Group';
import ActionExitToApp from '@material-ui/icons/ExitToApp';
import Notifications from '@material-ui/icons/Notifications';
import { MuiThemeProvider as MuiThemeProviderV0 } from 'material-ui';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { MuiThemeProvider as MuiThemeProviderV1, createMuiTheme } from '@material-ui/core/styles';
import Banner from './Banner';
import BaseDialog from './Dialog/BaseDialog';
import logo from '../../images/eventkit-logo.1.png';
import { DrawerTimeout } from '../actions/exportsActions';
import { userActive } from '../actions/userActions';
import { getNotifications, getNotificationsUnreadCount } from '../actions/notificationsActions';
import ConfirmDialog from './Dialog/ConfirmDialog';
import NotificationsDropdown from './Notification/NotificationsDropdown';
import '../styles/bootstrap/css/bootstrap.css';
import '../styles/openlayers/ol.css';
import '../styles/flexboxgrid.css';
import '../styles/react-joyride-compliled.css';
import { isViewportL, isViewportXL, L_MAX_WIDTH } from '../utils/viewport';
import background from '../../images/ek_topo_pattern.png';

require('../fonts/index.css');

const muiThemeV1 = createMuiTheme({
    overrides: {
        MuiCheckbox: {
            colorPrimary: {
                color: '#4598bf',
                '&$checked': { color: '#4598bf' },
                '&$disabled': { color: 'grey' },
            },
        },
        MuiInput: {
            underline: {
                '&:before': {
                    borderBottomColor: '#5a5a5a',
                },
                '&:hover:not($disabled):not($error):not($focused):before': {
                    borderBottomColor: '#5a5a5a',
                },
                '&:after': {
                    borderBottomColor: '#4598bf',
                },
            },
        },
        MuiList: {
            padding: {
                paddingTop: '0px',
                paddingBottom: '0px',
            },
        },
        MuiTableCell: {
            head: {
                fontSize: '12px',
            },
            body: {
                fontSize: '12px',
            },
            footer: {
                fontSize: '12px',
            },
        },
        MuiButton: {
            root: {
                fontSize: '14px',
                minHeight: '30px',
                padding: '0px 16px',
                height: '30px',
                lineHeight: '30px',
                borderRadius: '0px',
            },
        },
        MuiMenuItem: {
            selected: {
                color: '#4598bf',
            },
        },
        MuiSvgIcon: {
            colorSecondary: {
                color: '#fff',
            },
        },
        MuiTypography: {
            root: {
                width: '100%',
            },
        },
    },
    palette: {
        primary: {
            light: '#63a8c9',
            main: '#4598bf',
            dark: '#3982a4',
        },
        secondary: {
            main: '#ce4427',
        },
    },
    typography: {
        fontSize: 14,
        htmlFontSize: 14,
    },
});

const muiThemeV0 = getMuiTheme({
    datePicker: {
        selectColor: '#253447',
    },
    flatButton: {
        textColor: '#253447',
        primaryTextColor: '#253447',
    },
    checkbox: {
        boxColor: '#4598bf',
        checkedColor: '#4598bf',
    },
    tableRow: {
        selectedColor: 'initial',
    },
    svgIcon: {
        color: '#4598bf',
    },
    palette: {
        accent1Color: '#4598bf',
    },
});

export class Application extends Component {
    constructor(props) {
        super(props);
        this.handleToggle = this.handleToggle.bind(this);
        this.onMenuItemClick = this.onMenuItemClick.bind(this);
        this.getConfig = this.getConfig.bind(this);
        this.handleMouseOver = this.handleMouseOver.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);
        this.handleResize = this.handleResize.bind(this);
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
        this.getButtonBackgroundColor = this.getButtonBackgroundColor.bind(this);
        this.setNotificationsDropdownContainerRef = this.setNotificationsDropdownContainerRef.bind(this);
        this.handleNotificationsDropdownNavigate = this.handleNotificationsDropdownNavigate.bind(this);
        this.state = {
            config: {},
            hovered: '',
            showAutoLogoutWarningDialog: false,
            showAutoLoggedOutDialog: false,
            showLogoutDialog: false,
            showNotificationsDropdown: false,
        };
        this.userActiveInputTypes = ['mousemove', 'click', 'keypress', 'wheel', 'touchstart', 'touchmove', 'touchend'];
        this.notificationsUnreadCountRefreshInterval = 10000;
        this.notificationsRefreshInterval = 10000;
        this.notificationsPageSize = 10;
        this.notificationsUnreadCountIntervalId = null;
        this.notificationsRefreshIntervalId = null;
        this.prevWindowWidth = 0;
        this.loggedIn = false;
    }

    getChildContext() {
        return {
            config: this.state.config,
        };
    }

    componentDidMount() {
        this.getConfig();
        this.props.getNotifications();
        window.addEventListener('resize', this.handleResize);
        window.addEventListener('click', this.handleClick);
    }

    componentWillReceiveProps(nextProps) {
        if (!this.loggedIn && nextProps.userData) {
            this.loggedIn = true;
            // If the user is logged in and the screen is large the drawer should be open
            if (isViewportXL()) {
                this.props.openDrawer();
            }
            this.startCheckingForAutoLogout();
            this.startSendingUserActivePings();
            this.startListeningForNotifications();
        } else if (this.loggedIn && !nextProps.userData) {
            this.loggedIn = false;
            this.stopCheckingForAutoLogout();
            this.stopSendingUserActivePings();
            this.stopListeningForNotifications();
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
        this.stopListeningForNotifications();
    }

    onMenuItemClick() {
        if (window.innerWidth < 1200) {
            this.handleToggle();
        }
    }

    getConfig() {
        return axios.get('/configuration')
            .then((response) => {
                if (response.data) {
                    this.setState({ config: response.data });
                }
            }).catch((error) => {
                console.log(error.response.data);
            });
    }

    getButtonBackgroundColor(route, activeColor = '#161e2e') {
        return (this.props.router.location.pathname.indexOf(route) === 0 || this.state.hovered === route) ? activeColor : '';
    }

    setNotificationsDropdownContainerRef(ref) {
        this.notificationsDropdownContainerRef = ref;
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
        this.notificationsUnreadCountIntervalId = setInterval(
            this.autoGetNotificationsUnreadCount,
            this.notificationsUnreadCountRefreshInterval,
        );

        // Notifications.
        this.props.getNotifications({
            notificationsPageSize: this.notificationsPageSize,
            isAuto: true,
        });
        this.notificationsRefreshIntervalId = setInterval(this.autoGetNotifications, this.notificationsRefreshInterval);
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
            notificationsPageSize: this.notificationsPageSize,
            isAuto: true,
        });
    }

    startCheckingForAutoLogout() {
        if (this.checkAutoLogoutIntervalId) {
            console.warn('Already checking for auto logout.');
            return;
        }

        // Regularly check if the user should be notified about an impending auto logout.
        this.checkAutoLogoutIntervalId = setInterval(() => {
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

        clearInterval(this.checkAutoLogoutIntervalId);
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
        this.userActiveInputTypes.forEach((eventType) => {
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
        this.userActiveInputTypes.forEach((eventType) => {
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
        this.autoLogoutWarningIntervalId = setInterval(updateAutoLogoutWarningText, 1000);
    }

    hideAutoLogoutWarning() {
        if (!this.autoLogoutWarningIntervalId) {
            console.warn('Not showing auto logout warning.');
            return;
        }

        this.setState({ showAutoLogoutWarningDialog: false });

        clearInterval(this.autoLogoutWarningIntervalId);
        this.autoLogoutWarningIntervalId = null;
    }

    handleResize() {
        this.forceUpdate();

        if (this.loggedIn) {
            // Close the drawer if we resize down to mobile width.
            if (isViewportL() && this.prevWindowWidth >= L_MAX_WIDTH) {
                this.props.closeDrawer();
            }

            // Open the drawer if we resize up to desktop width.
            if (isViewportXL() && this.prevWindowWidth < L_MAX_WIDTH) {
                this.props.openDrawer();
            }
        }

        this.prevWindowWidth = window.innerWidth;
    }

    handleClick(e) {
        // Close the notifications dropdown if it's open and we click outside of it.
        if (this.notificationsDropdownContainerRef && this.state.showNotificationsDropdown) {
            if (!this.notificationsDropdownContainerRef.contains(e.target)) {
                this.setState({ showNotificationsDropdown: false });
            }
        }
    }

    handleMouseOver(route) {
        this.setState({ hovered: route });
    }

    handleMouseOut() {
        this.setState({ hovered: '' });
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
        let imgWidth = '180px';
        if (window.innerWidth > 768) imgWidth = '256px';
        else if (window.innerWidth > 500) imgWidth = '200px';
        const mainAppBarHeight = 95;
        const styles = {
            appBar: {
                position: 'relative',
                height: '95px',
                backgroundColor: 'black',
                boxShadow: 'none',
                zIndex: 1301,
            },
            img: {
                width: imgWidth,
                margin: '0 20px',
            },
            title: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: (window.innerWidth > 768) ? 'center' : 'flex-end',
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
            },
            menuButton: {
                width: '70px',
                height: '70px',
            },
            menuButtonIcon: {
                width: '36px',
                height: '36px',
                color: 'white',
            },
            notificationsButton: {
                width: '70px',
                height: '70px',
                transitionProperty: 'none',
            },
            notificationsButtonIcon: {
                width: '38px',
                height: '38px',
                color: 'white',
            },
            notificationsIndicator: {
                position: 'absolute',
                top: '36%',
                right: '29%',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: '#ce4427',
                zIndex: '1',
                pointerEvents: 'none',
            },
            drawer: {
                width: '200px',
                marginTop: '95px',
                backgroundColor: '#010101',
                padding: '0px',
            },
            mainMenu: {
                color: '#3e3f3f',
                display: 'inline-block',
                marginRight: '40px',
                fontSize: '20px',
                align: 'left',
            },
            menuItem: {
                marginLeft: '0px',
                padding: '0px',
            },
            link: {
                position: 'relative',
                display: 'block',
                padding: '5px',
                textAlign: 'left',
                textDecoration: 'none',
                color: '#4498c0',
                fill: '#4498c0',
            },
            activeLink: {
                position: 'relative',
                display: 'block',
                padding: '5px',
                textAlign: 'left',
                textDecoration: 'none',
                color: '#4498c0',
                backgroundColor: '#161e2e',
                fill: '#1675aa',
            },
            icon: {
                height: '22px',
                width: '22px',
                marginRight: '11px',
                verticalAlign: 'middle',
                fill: 'inherit',
            },
            content: {
                transition: 'margin-left 450ms cubic-bezier(0.23, 1, 0.32, 1)',
                marginLeft: ((this.props.drawer === 'open' || this.props.drawer === 'opening') && window.innerWidth) >= 1200 ? 200 : 0,
                background: 'rgb(17, 24, 35)',
                backgroundImage: `url(${background})`,
                height: window.innerHeight - mainAppBarHeight,
            },
        };

        const img = <img style={styles.img} src={logo} alt="EventKit" />;

        const childrenWithContext = React.Children.map(this.props.children, child => (
            React.cloneElement(child, {
                context: { config: this.state.config },
            })
        ));

        return (
            <MuiThemeProviderV1 theme={muiThemeV1}>
                <MuiThemeProviderV0 muiTheme={muiThemeV0}>
                    <div style={{ backgroundColor: '#000' }}>
                        <AppBar
                            className="qa-Application-AppBar"
                            style={styles.appBar}
                        >
                            <Banner />
                            <div style={styles.title}>
                                <img style={styles.img} src={logo} alt="EventKit" />
                            </div>
                            <div style={{ position: 'absolute', left: '0', top: '25px' }}>
                                <IconButton
                                    className="qa-Application-AppBar-MenuButton"
                                    style={styles.menuButton}
                                    iconStyle={styles.menuButtonIcon}
                                    touchRippleColor="white"
                                    onClick={this.handleToggle}
                                >
                                    <Menu />
                                </IconButton>
                                <div style={{ display: 'inline-block', position: 'relative' }}>
                                    <IconButton
                                        className="qa-Application-AppBar-NotificationsButton"
                                        style={{
                                            ...styles.notificationsButton,
                                            backgroundColor: (this.props.router.location.pathname.indexOf('/notifications') === 0) ?
                                                '#4598BF' : '',
                                        }}
                                        iconStyle={styles.notificationsButtonIcon}
                                        touchRippleColor="white"
                                        onClick={this.handleNotificationsButtonClick}
                                        onMouseEnter={() => this.handleMouseOver('/notifications')}
                                        onMouseLeave={this.handleMouseOut}
                                    >
                                        <Notifications />
                                    </IconButton>
                                    <div
                                        className="qa-Application-AppBar-NotificationsIndicator"
                                        style={{
                                            ...styles.notificationsIndicator,
                                            transition: 'transform 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
                                            transform: (this.props.notifications.unreadCount.unreadCount > 0) ? 'scale(1)' : 'scale(0)',
                                        }}
                                    />
                                    <div ref={this.setNotificationsDropdownContainerRef}>
                                        <NotificationsDropdown
                                            style={{
                                                opacity: (this.state.showNotificationsDropdown) ? '1' : '0',
                                                pointerEvents: (this.state.showNotificationsDropdown) ? 'auto' : 'none',
                                                transform: (this.state.showNotificationsDropdown) ? 'scale(1)' : 'scale(0)',
                                            }}
                                            notifications={this.props.notifications}
                                            router={this.props.router}
                                            onNavigate={this.handleNotificationsDropdownNavigate}
                                        />
                                    </div>
                                </div>
                            </div>
                        </AppBar>
                        <Drawer
                            className="qa-Application-Drawer"
                            containerStyle={styles.drawer}
                            overlayStyle={styles.drawer}
                            docked
                            open={this.props.drawer === 'open' || this.props.drawer === 'opening'}
                        >
                            <MenuItem
                                className="qa-Application-MenuItem-dashboard"
                                onClick={this.onMenuItemClick}
                                innerDivStyle={styles.menuItem}
                            >
                                <IndexLink
                                    className="qa-Application-Link-dashboard"
                                    style={{ ...styles.link, backgroundColor: this.getButtonBackgroundColor('/dashboard') }}
                                    activeStyle={styles.activeLink}
                                    to="/dashboard"
                                    onMouseEnter={() => this.handleMouseOver('/dashboard')}
                                    onMouseLeave={this.handleMouseOut}
                                >
                                    <Dashboard style={styles.icon} />
                                    Dashboard
                                </IndexLink>
                            </MenuItem>
                            <MenuItem
                                className="qa-Application-MenuItem-exports"
                                onClick={this.onMenuItemClick}
                                innerDivStyle={styles.menuItem}
                            >
                                <Link
                                    className="qa-Application-Link-exports"
                                    style={{ ...styles.link, backgroundColor: this.getButtonBackgroundColor('/exports') }}
                                    activeStyle={styles.activeLink}
                                    to="/exports"
                                    href="/exports"
                                    onMouseEnter={() => this.handleMouseOver('/exports')}
                                    onMouseLeave={this.handleMouseOut}
                                >
                                    <AVLibraryBooks style={styles.icon} />
                                    DataPack Library
                                </Link>
                            </MenuItem>
                            <MenuItem
                                className="qa-Application-MenuItem-create"
                                onClick={this.onMenuItemClick}
                                innerDivStyle={styles.menuItem}
                            >
                                <Link
                                    className="qa-Application-Link-create"
                                    style={{ ...styles.link, backgroundColor: this.getButtonBackgroundColor('/create') }}
                                    activeStyle={styles.activeLink}
                                    onMouseEnter={() => this.handleMouseOver('/create')}
                                    onMouseLeave={this.handleMouseOut}
                                    to="/create"
                                    href="/create"
                                >
                                    <ContentAddBox style={styles.icon} />
                                    Create DataPack
                                </Link>
                            </MenuItem>
                            <MenuItem
                                className="qa-Application-MenuItem-groups"
                                onClick={this.onMenuItemClick}
                                innerDivStyle={styles.menuItem}
                            >
                                <Link
                                    className="qa-Application-Link-groups"
                                    style={{ ...styles.link, backgroundColor: this.state.hovered === 'groups' ? '#161e2e' : '' }}
                                    activeStyle={styles.activeLink}
                                    onMouseEnter={() => this.handleMouseOver('groups')}
                                    onMouseLeave={this.handleMouseOut}
                                    to="/groups"
                                    href="/groups"
                                >
                                    <SocialGroup style={styles.icon} />
                                    Members and Groups
                                </Link>
                            </MenuItem>
                            <MenuItem
                                className="qa-Application-MenuItem-about"
                                onClick={this.onMenuItemClick}
                                innerDivStyle={styles.menuItem}
                            >
                                <Link
                                    className="qa-Application-Link-about"
                                    style={{ ...styles.link, backgroundColor: this.getButtonBackgroundColor('/about') }}
                                    activeStyle={styles.activeLink}
                                    onMouseEnter={() => this.handleMouseOver('/about')}
                                    onMouseLeave={this.handleMouseOut}
                                    to="/about"
                                    href="/about"
                                >
                                    <ActionInfoOutline style={styles.icon} />
                                    About EventKit
                                </Link>
                            </MenuItem>
                            <MenuItem
                                className="qa-Application-MenuItem-account"
                                onClick={this.onMenuItemClick}
                                innerDivStyle={styles.menuItem}
                            >
                                <Link
                                    className="qa-Application-Link-account"
                                    style={{ ...styles.link, backgroundColor: this.getButtonBackgroundColor('/account') }}
                                    activeStyle={styles.activeLink}
                                    onMouseEnter={() => this.handleMouseOver('/account')}
                                    onMouseLeave={this.handleMouseOut}
                                    to="/account"
                                    href="/account"
                                >
                                    <SocialPerson style={styles.icon} />
                                    Account Settings
                                </Link>
                            </MenuItem>
                            <MenuItem
                                className="qa-Application-MenuItem-logout"
                                innerDivStyle={styles.menuItem}
                            >
                                <Link // eslint-disable-line jsx-a11y/anchor-is-valid
                                    className="qa-Application-Link-logout"
                                    style={{ ...styles.link, backgroundColor: this.getButtonBackgroundColor('/logout') }}
                                    activeStyle={styles.activeLink}
                                    onMouseEnter={() => this.handleMouseOver('/logout')}
                                    onMouseLeave={this.handleMouseOut}
                                    onClick={this.handleLogoutClick}
                                >
                                    <ActionExitToApp style={styles.icon} />
                                    Log Out
                                </Link>
                            </MenuItem>
                        </Drawer>
                        <div style={styles.content} className="qa-Application-content">
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
                </MuiThemeProviderV0>
            </MuiThemeProviderV1>
        );
    }
}

Application.defaultProps = {
    children: null,
    autoLogoutAt: null,
    autoLogoutWarningAt: null,
    userData: {},
};

Application.propTypes = {
    children: PropTypes.object,
    openDrawer: PropTypes.func.isRequired,
    closeDrawer: PropTypes.func.isRequired,
    userActive: PropTypes.func.isRequired,
    drawer: PropTypes.string.isRequired,
    router: PropTypes.shape({
        location: PropTypes.shape({
            pathname: PropTypes.string,
        }),
        push: PropTypes.func,
    }).isRequired,
    userData: PropTypes.shape({
        accepted_licenses: PropTypes.object,
        user: PropTypes.shape({
            username: PropTypes.string,
            last_name: PropTypes.string,
            first_name: PropTypes.string,
            email: PropTypes.string,
            commonname: PropTypes.string,
            date_joined: PropTypes.string,
            last_login: PropTypes.string,
            identification: PropTypes.string,
        }),
    }),
    autoLogoutAt: PropTypes.instanceOf(Date),
    autoLogoutWarningAt: PropTypes.instanceOf(Date),
    notifications: PropTypes.object.isRequired,
    getNotificationsUnreadCount: PropTypes.func.isRequired,
    getNotifications: PropTypes.func.isRequired,
};

Application.childContextTypes = {
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
        VERSION: PropTypes.string,
    }),
};

function mapStateToProps(state) {
    return {
        drawer: state.drawer,
        userData: state.user.data,
        autoLogoutAt: state.user.autoLogoutAt,
        autoLogoutWarningAt: state.user.autoLogoutWarningAt,
        notifications: state.notifications,
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

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Application);
