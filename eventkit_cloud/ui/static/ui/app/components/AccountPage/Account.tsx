import * as React from 'react';
import { connect } from 'react-redux';
import { withTheme, Theme } from '@material-ui/core/styles';
import Joyride from 'react-joyride';
import Help from '@material-ui/icons/Help';
import ButtonBase from '@material-ui/core/ButtonBase';
import PageHeader from '../common/PageHeader';
import UserInfo from './UserInfo';
import LicenseInfo from './LicenseInfo';
import SaveButton from './SaveButton';
import getLicenses from '../../actions/licenseActions';
import { patchUser } from '../../actions/userActions';
import CustomScrollbar from '../CustomScrollbar';
import { DrawerTimeout } from '../../actions/uiActions';
import { joyride } from '../../joyride.config';

export interface Props {
    user: Eventkit.Store.User;
    licenses: Eventkit.Store.Licenses;
    getLicenses: () => void;
    patchUser: (licenses, username) => void;
    drawer: string;
    openDrawer: () => void;
    theme: Eventkit.Theme & Theme;
}

export interface State {
    acceptedLicenses: { [slug: string]: boolean };
    showSavedMessage: boolean;
    steps: any[];
    isRunning: boolean;
}

export class Account extends React.Component<Props, State> {
    private joyride;
    constructor(props) {
        super(props);
        this.handleCheck = this.handleCheck.bind(this);
        this.handleAll = this.handleAll.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.callback = this.callback.bind(this);
        this.handleJoyride = this.handleJoyride.bind(this);
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
        const steps = joyride.Account;
        this.joyrideAddSteps(steps);
    }

    componentDidUpdate(prevProps) {
        if (this.props.user.status.patched && !prevProps.user.status.patched) {
            this.setState({ showSavedMessage: true });
            window.setTimeout(() => {
                this.setState({ showSavedMessage: false });
            }, 3000);
        }
    }

    private handleCheck(slug, checked) {
        const licenses = this.state.acceptedLicenses;
        licenses[slug] = checked;
        this.setState({ acceptedLicenses: licenses });
    }

    private handleAll(event, checked) {
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

    private handleSubmit() {
        this.props.patchUser(this.state.acceptedLicenses, this.props.user.data.user.username);
    }

    private joyrideAddSteps(steps) {
        let newSteps = steps;

        if (!Array.isArray(newSteps)) {
            newSteps = [newSteps];
        }

        if (!newSteps.length) { return; }

        this.setState((currentState) => {
            const nextState = { ...currentState };
            nextState.steps = nextState.steps.concat(newSteps);
            return nextState;
        });
    }

    private callback(data) {
        if (data.action === 'close' || data.action === 'skip' || data.type === 'finished') {
            this.setState({ isRunning: false });
            this.joyride.reset(true);
            if (this.state.acceptedLicenses['fake-license-for-tour'] !== undefined) {
                this.setState({ acceptedLicenses: {} });
                this.props.licenses.licenses = [];
                this.props.user.data.accepted_licenses = {};
            }
        }

        if (data.index === 4 && data.type === 'step:after') {
            if (this.props.drawer === 'closed') {
                this.props.openDrawer();
            }
        }
    }

    private handleJoyride() {
        if (this.state.isRunning === true) {
            this.setState({ isRunning: false });
            this.joyride.reset(true);
        } else {
            this.setState({ isRunning: true });
            if (!Object.keys(this.state.acceptedLicenses).length) {
                const fake = {
                    slug: 'fake-license-for-tour',
                    name: 'Page Tour Example License (Demonstration Purposes Only)',
                    text: 'This license is for the page tour and does not actually need to be accepted',
                };
                this.setState({ acceptedLicenses: { 'fake-license-for-tour': false } });
                this.props.licenses.licenses.push(fake);
                this.props.user.data.accepted_licenses[fake.slug] = false;
            }
        }
    }

    render() {
        const { theme } = this.props;

        const { steps, isRunning } = this.state;
        const styles = {
            body: {
                height: 'calc(100vh - 130px)',
                width: '100%',
                margin: 'auto',
                overflowY: 'hidden' as 'hidden',
            },
            bodyContent: {
                padding: '30px 34px',
                maxWidth: '1000px',
                margin: 'auto',
            },
            tourButton: {
                color: theme.eventkit.colors.primary,
                cursor: 'pointer',
                display: 'inline-block',
                marginRight: '30px',
            },
            tourIcon: {
                color: theme.eventkit.colors.primary,
                cursor: 'pointer',
                height: '18px',
                width: '18px',
                verticalAlign: 'middle',
                marginRight: '5px',
                marginBottom: '5px',
            },
        };

        const iconElementRight = (
            <ButtonBase
                onClick={this.handleJoyride}
                style={styles.tourButton}
            >
                <Help
                    style={styles.tourIcon}
                />
                Page Tour
            </ButtonBase>
        );

        const equal = Object.keys(this.state.acceptedLicenses).every((key) => {
            if (this.state.acceptedLicenses[key] === this.props.user.data.accepted_licenses[key]) {
                return true;
            }
            return false;
        });

        return (
            <div style={{ backgroundColor: theme.eventkit.colors.white }}>
                <Joyride
                    callback={this.callback}
                    ref={(instance) => { this.joyride = instance; }}
                    steps={steps}
                    autoStart
                    type="continuous"
                    showSkipButton
                    showStepsProgress
                    locale={{
                        // @ts-ignore
                        back: (<span>Back</span>),
                        // @ts-ignore
                        close: (<span>Close</span>),
                        // @ts-ignore
                        last: (<span>Done</span>),
                        // @ts-ignore
                        next: (<span>Next</span>),
                        // @ts-ignore
                        skip: (<span>Skip</span>),
                    }}
                    run={isRunning}
                />
                <PageHeader
                    className="qa-Account-PageHeader"
                    title="Account"
                >
                    {iconElementRight}
                    <SaveButton
                        saved={this.state.showSavedMessage}
                        saveDisabled={equal}
                        handleSubmit={this.handleSubmit}
                    />
                </PageHeader>
                <div style={styles.body}>
                    <CustomScrollbar style={{ height: 'calc(100vh - 130px)', width: '100%' }}>
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
        openDrawer: () => {
            dispatch(timeout.openDrawer());
        },
    };
}

export default withTheme()(connect(
    mapStateToProps,
    mapDispatchToProps,
)(Account));
