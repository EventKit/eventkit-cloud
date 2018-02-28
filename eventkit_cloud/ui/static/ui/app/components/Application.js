import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import { Link, IndexLink } from 'react-router';
import AVLibraryBooks from 'material-ui/svg-icons/av/library-books';
import ContentAddBox from 'material-ui/svg-icons/content/add-box';
import ActionInfoOutline from 'material-ui/svg-icons/action/info-outline';
import SocialPerson from 'material-ui/svg-icons/social/person';
import ActionExitToApp from 'material-ui/svg-icons/action/exit-to-app';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Banner from './Banner';
import BaseDialog from './Dialog/BaseDialog';
import logo from '../../images/eventkit-logo.1.png';
import { DrawerTimeout } from '../actions/exportsActions';
import { userActive } from '../actions/userActions';
import ConfirmDialog from './Dialog/ConfirmDialog';

require('../fonts/index.css');

const muiTheme = getMuiTheme({
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
        this.logout = this.logout.bind(this);
        this.startCheckingForAutoLogout = this.startCheckingForAutoLogout.bind(this);
        this.stopCheckingForAutoLogout = this.stopCheckingForAutoLogout.bind(this);
        this.startSendingUserActivePings = this.startSendingUserActivePings.bind(this);
        this.stopSendingUserActivePings = this.stopSendingUserActivePings.bind(this);
        this.handleStayLoggedIn = this.handleStayLoggedIn.bind(this);
        this.handleCloseAutoLoggedOutDialog = this.handleCloseAutoLoggedOutDialog.bind(this);
        this.handleLogoutDialogCancel = this.handleLogoutDialogCancel.bind(this);
        this.handleLogoutDialogConfirm = this.handleLogoutDialogConfirm.bind(this);
        this.handleLogoutClick = this.handleLogoutClick.bind(this);
        this.state = {
            config: {},
            hovered: '',
            showAutoLogoutWarningDialog: false,
            showAutoLoggedOutDialog: false,
            showLogoutDialog: false,
        };
        this.userActiveInputTypes = ['mousemove', 'click', 'keypress', 'wheel', 'touchstart', 'touchmove', 'touchend'];
    }

    getChildContext() {
        return {
            config: this.state.config,
        };
    }

    componentDidMount() {
        this.getConfig();
        window.addEventListener('resize', this.handleResize);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.userData !== this.props.userData) {
            if (nextProps.userData != null) {
                // if the user is logged in and the screen is large the drawer should be open
                if (window.innerWidth >= 1200) {
                    this.props.openDrawer();
                }
                this.startCheckingForAutoLogout();
                this.startSendingUserActivePings();
            } else {
                this.stopCheckingForAutoLogout();
                this.stopSendingUserActivePings();
            }
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
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

    handleStayLoggedIn() {
        this.hideAutoLogoutWarning();
        this.startSendingUserActivePings();
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

    startSendingUserActivePings() {
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
        this.props.userActive();
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

    render() {
        const styles = {
            appBar: {
                backgroundColor: 'black',
                height: '70px',
                top: '25px',
            },
            img: {
                position: 'absolute',
                left: '50%',
                marginLeft: '-127px',
                marginTop: '10px',
                height: '50px',
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
                marginLeft: ((this.props.drawer === 'open' || this.props.drawer === 'opening') && window.innerWidth) >= 1200 ? 200 : 0
            },
        };

        const img = <img style={styles.img} src={logo} alt="EventKit" />;

        const childrenWithContext = React.Children.map(this.props.children, child => (
            React.cloneElement(child, {
                context: { config: this.state.config },
            })
        ));

        return (
            <MuiThemeProvider muiTheme={muiTheme}>
                <div style={{ backgroundColor: '#000' }}>
                    <Banner />
                    <header className="qa-Application-header" style={{ height: '95px' }}>
                        <AppBar
                            className="qa-Application-AppBar"
                            style={styles.appBar}
                            title={img}
                            onLeftIconButtonTouchTap={this.handleToggle}
                            showMenuIconButton={!!this.props.userData}
                        />
                    </header>
                    <Drawer
                        className="qa-Application-Drawer"
                        containerStyle={styles.drawer}
                        overlayStyle={styles.drawer}
                        docked
                        open={this.props.drawer === 'open' || this.props.drawer === 'opening'}
                    >
                        <MenuItem
                            className="qa-Application-MenuItem-exports"
                            onClick={this.onMenuItemClick}
                            innerDivStyle={styles.menuItem}
                        >
                            <IndexLink
                                className="qa-Application-Link-exports"
                                style={{ ...styles.link, backgroundColor: this.state.hovered === 'exports' ? '#161e2e' : '' }}
                                activeStyle={styles.activeLink}
                                to="/exports"
                                href="/exports"
                                onMouseEnter={() => this.handleMouseOver('exports')}
                                onMouseLeave={this.handleMouseOut}
                            >
                                <AVLibraryBooks style={styles.icon} />
                                DataPack Library
                            </IndexLink>
                        </MenuItem>
                        <MenuItem
                            className="qa-Application-MenuItem-create"
                            onClick={this.onMenuItemClick}
                            innerDivStyle={styles.menuItem}
                        >
                            <Link
                                className="qa-Application-Link-create"
                                style={{ ...styles.link, backgroundColor: this.state.hovered === 'create' ? '#161e2e' : '' }}
                                activeStyle={styles.activeLink}
                                onMouseEnter={() => this.handleMouseOver('create')}
                                onMouseLeave={this.handleMouseOut}
                                to="/create"
                                href="/create"
                            >
                                <ContentAddBox style={styles.icon} />
                                Create DataPack
                            </Link>
                        </MenuItem>
                        <MenuItem
                            className="qa-Application-MenuItem-about"
                            onClick={this.onMenuItemClick}
                            innerDivStyle={styles.menuItem}
                        >
                            <Link
                                className="qa-Application-Link-about"
                                style={{ ...styles.link, backgroundColor: this.state.hovered === 'about' ? '#161e2e' : '' }}
                                activeStyle={styles.activeLink}
                                onMouseEnter={() => this.handleMouseOver('about')}
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
                                style={{ ...styles.link, backgroundColor: this.state.hovered === 'account' ? '#161e2e' : '' }}
                                activeStyle={styles.activeLink}
                                onMouseEnter={() => this.handleMouseOver('account')}
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
                            <Link
                                className="qa-Application-Link-logout"
                                style={{ ...styles.link, backgroundColor: this.state.hovered === 'logout' ? '#161e2e' : '' }}
                                activeStyle={styles.activeLink}
                                onMouseEnter={() => this.handleMouseOver('logout')}
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
                        isDestructive={true}
                        onCancel={this.handleLogoutDialogCancel}
                        onConfirm={this.handleLogoutDialogConfirm}
                    >
                        <strong>Are you sure?</strong>
                    </ConfirmDialog>
                </div>
            </MuiThemeProvider>
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
};

Application.childContextTypes = {
    config: PropTypes.object,
};

function mapStateToProps(state) {
    return {
        drawer: state.drawer,
        userData: state.user.data,
        autoLogoutAt: state.user.autoLogoutAt,
        autoLogoutWarningAt: state.user.autoLogoutWarningAt,
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
        userActive: () => {
            dispatch(userActive());
        },
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Application);
