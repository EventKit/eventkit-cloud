import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import AppBar from 'material-ui/AppBar';
import UserInfo from './UserInfo';
import LicenseInfo from './LicenseInfo';
import SaveButton from './SaveButton';
import getLicenses from '../../actions/licenseActions';
import { patchUser } from '../../actions/userActions';
import CustomScrollbar from '../CustomScrollbar';
import Joyride from 'react-joyride';
import Help from 'material-ui/svg-icons/action/help';
import { DrawerTimeout } from '../../actions/exportsActions';

export class Account extends Component {
    constructor(props) {
        super(props);
        this.handleCheck = this.handleCheck.bind(this);
        this.handleAll = this.handleAll.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.callback = this.callback.bind(this);
        this.state = {
            acceptedLicenses: {},
            showSavedMessage: false,
            steps: [],
            isRunning: false,
        };
    }

    componentWillMount() {
        this.setState({ acceptedLicenses: { ...this.props.user.data.accepted_licenses } });
        this.props.getLicenses();
    }

    componentDidMount() {
        const tooltipStyle = {
            backgroundColor: 'white',
            borderRadius: '0',
            color: 'black',
            mainColor: '#ff4456',
            textAlign: 'left',
            header: {
                textAlign: 'left',
                fontSize: '20px',
                borderColor: '#4598bf',
            },
            main: {
                paddingTop: '20px',
                paddingBottom: '20px',
            },
            button: {
                color: 'white',
                backgroundColor: '#4598bf',
            },
            skip: {
                color: '#8b9396',
            },
            back: {
                color: '#8b9396',
            },
            hole: {
                backgroundColor: 'rgba(226,226,226, 0.2)',
            },
        };

        const welcomeTooltipStyle = {
            backgroundColor: 'white',
            borderRadius: '0',
            color: 'black',
            mainColor: '#ff4456',
            textAlign: 'left',
            header: {
                textAlign: 'left',
                fontSize: '20px',
                borderColor: '#4598bf',
            },
            arrow: {
                display: 'none',
            },
            main: {
                paddingTop: '20px',
                paddingBottom: '20px',
            },

            button: {
                color: 'white',
                backgroundColor: '#4598bf',
            },
            skip: {
                display: 'none',
            },
            back: {
                color: '#8b9396',
            },
            hole: {
                display: 'none',
            },
        };

        const steps = [
            {
                title: 'Welcome to the Account Settings Page',
                text: 'This page contains Licenses and Terms of Use along with some personal information.  On your initial login, you must agree to these Licenses and Terms of Use to use EventKit.  You will only be required to re-visit this page in the future if new Licenses and Terms of Use are introduced with a new data provider.',
                selector: '.qa-Account-AppBar',
                position: 'top',
                style: welcomeTooltipStyle,
                isFixed: true,
            },
            {
                title: 'License Agreement Info',
                text: 'You can expand the license text and scroll down to review.  You can download the license text if you so choose.',
                selector: '.qa-UserLicense-ArrowDown',
                position: 'bottom',
                style: tooltipStyle,
                isFixed: true,
            },
            {
                title: 'Agree to Licenses',
                text: 'Once you’ve reviewed the licenses, you can agree to them individually.',
                selector: '.qa-UserLicense-Checkbox',
                position: 'bottom',
                style: tooltipStyle,
                isFixed: true,
            },
            {
                title: 'Agree to Licenses',
                text: 'Or you can choose to agree to them collectively.',
                selector: '.qa-LicenseInfo-Checkbox',
                position: 'bottom',
                style: tooltipStyle,
                isFixed: true,
            },
            {
                title: 'Save Agreements',
                text: 'Once you have selected the licenses to agree to, click Save Changes.',
                selector: '.qa-SaveButton-RaisedButton-SaveChanges',
                position: 'top',
                style: tooltipStyle,
                isFixed: true,
            },
            {
                title: 'Navigate Application',
                text: 'Once you have saved the license agreements, you can navigate away from the page to browse DataPacks.',
                selector: '.qa-Application-MenuItem-exports',
                position: 'top',
                style: tooltipStyle,
                isFixed: true,
            },
            {
                title: 'Navigate Application',
                text: 'Or to create your own DataPack.',
                selector: '.qa-Application-MenuItem-create',
                position: 'top',
                style: tooltipStyle,
                isFixed: true,
            },
        ];

        this.joyrideAddSteps(steps);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.user.patched && !this.props.user.patched) {
            this.setState({ showSavedMessage: true });
            window.setTimeout(() => {
                this.setState({ showSavedMessage: false });
            }, 3000);
        }
    }

    handleCheck(slug, checked) {
        const licenses = this.state.acceptedLicenses;
        licenses[slug] = checked;
        this.setState({ acceptedLicenses: licenses });
    }

    handleAll(event, checked) {
        const licenses = { ...this.state.acceptedLicenses };
        // for(const license in licenses) {
        Object.keys(licenses).forEach((license) => {
            // if the command is to uncheck, make sure not to uncheck already agreed licenses
            if (!checked && this.props.user.data.accepted_licenses[license]) {
                // do nothing;
            } else {
                licenses[license] = checked;
            }
        });
        this.setState({ acceptedLicenses: licenses });
    }

    handleSubmit() {
        this.props.patchUser(this.state.acceptedLicenses, this.props.user.data.user.username);
    }

    handleWalkthroughClick() {
        this.setState({ isRunning: true });
    }

    joyrideAddSteps(steps) {
        let newSteps = steps;

        if (!Array.isArray(newSteps)) {
            newSteps = [newSteps];
        }

        if (!newSteps.length) return;

        this.setState((currentState) => {
            currentState.steps = currentState.steps.concat(newSteps);
            return currentState;
        });
    }

    callback(data) {
        if (data.action === 'close' || data.action === 'skip' || data.type === 'finished') {
            this.setState({ isRunning: false });
            this.refs.joyride.reset(true);
        }

        if (data.index === 4 && data.type === 'step:after') {
            if (this.props.drawer === 'closed') {
                this.props.openDrawer();
            }
        }
    }

    handleJoyride() {
        if (this.state.isRunning === true) {
            this.refs.joyride.reset(true);
        } else {
            this.setState({ isRunning: true });
        }
    }

    render() {
        const { steps, isRunning } = this.state;
        const iconElementRight = <div onTouchTap={this.handleJoyride.bind(this)} style={{ color: '#4598bf', cursor: 'pointer', display: 'inline-block', marginRight: '30px', fontSize: '16px' }}><Help onTouchTap={this.handleJoyride.bind(this)} style={{ color: '#4598bf', cursor: 'pointer', height: '18px', width: '18px', verticalAlign: 'middle', marginRight: '5px', marginBottom: '5px' }} />Page Tour</div>

        const styles = {
            header: {
                backgroundColor: '#161e2e',
                height: '35px',
                color: 'white',
                fontSize: '14px',
                padding: '0px 34px',
            },
            headerTitle: {
                fontSize: '18px',
                lineHeight: '35px',
                height: '35px',
            },
            body: {
                height: window.innerHeight - 130,
                width: '100%',
                margin: 'auto',
                overflowY: 'hidden',
            },
            bodyContent: {
                padding: '30px 34px',
                maxWidth: '1000px',
                margin: 'auto',
            },
        };

        const equal = Object.keys(this.state.acceptedLicenses).every((key) => {
            if (this.state.acceptedLicenses[key] === this.props.user.data.accepted_licenses[key]) {
                return true;
            }
            return false;
        });

        return (
            <div style={{ backgroundColor: 'white' }}>
                <Joyride
                    callback={this.callback}
                    ref="joyride"
                    debug={false}
                    steps={steps}
                    autoStart
                    type="continuous"
                    disableOverlay
                    showSkipButton
                    showStepsProgress
                    locale={{
                        back: (<span>Back</span>),
                        close: (<span>Close</span>),
                        last: (<span>Done</span>),
                        next: (<span>Next</span>),
                        skip: (<span>Skip</span>),
                    }}
                    run={isRunning}
                />
                <AppBar
                    className="qa-Account-AppBar"
                    title="Account"
                    style={styles.header}
                    titleStyle={styles.headerTitle}
                    showMenuIconButton={false}
                    iconElementRight={iconElementRight}
                >
                    <SaveButton
                        saved={this.state.showSavedMessage}
                        saveDisabled={equal}
                        handleSubmit={this.handleSubmit}
                    />
                </AppBar>
                <div style={styles.body}>
                    <CustomScrollbar style={{ height: window.innerHeight - 130, width: '100%' }}>
                        <div style={styles.bodyContent} className="qa-Account-body">
                            {this.props.licenses.licenses.length > 0 ?
                                <div style={{ marginBottom: '34px' }} className="qa-Account-licenses">
                                    <LicenseInfo
                                        user={this.props.user}
                                        licenses={this.props.licenses}
                                        acceptedLicenses={this.state.acceptedLicenses}
                                        onLicenseCheck={this.handleCheck}
                                        onAllCheck={this.handleAll}
                                    />
                                </div>
                                :
                                null
                            }
                            {Object.keys(this.props.user.data.user).length > 0 ?
                                <div style={{ marginBottom: '34px' }} className="qa-Account-userInfo">
                                    <UserInfo user={this.props.user.data.user} updateLink="" />
                                </div>
                                :
                                null
                            }
                        </div>
                    </CustomScrollbar>
                </div>
            </div>
        );
    }
}

Account.propTypes = {
    user: PropTypes.object.isRequired,
    licenses: PropTypes.object.isRequired,
    getLicenses: PropTypes.func.isRequired,
    patchUser: PropTypes.func.isRequired,
    openDrawer: PropTypes.func.isRequired,
    closeDrawer: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
    return {
        user: state.user,
        licenses: state.licenses,
        drawer: state.drawer,
    };
}

function mapDispatchToProps(dispatch) {
    const timeout = new DrawerTimeout();
    return {
        getLicenses: () => {
            dispatch(getLicenses());
        },
        patchUser: (acceptedLicenses, username) => {
            dispatch(patchUser(acceptedLicenses, username));
        },
        closeDrawer: () => {
            dispatch(timeout.closeDrawer());
        },
        openDrawer: () => {
            dispatch(timeout.openDrawer());
        },
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Account);
