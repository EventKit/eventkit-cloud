import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import AppBar from 'material-ui/AppBar';
import UserInfo from './UserInfo';
import LicenseInfo from './LicenseInfo';
import SaveButton from './SaveButton';
import getLicenses from '../../actions/licenseActions';
import { patchUser } from '../../actions/userActions';
import CustomScrollbar from '../CustomScrollbar';

export class Account extends Component {
    constructor(props) {
        super(props);
        this.handleCheck = this.handleCheck.bind(this);
        this.handleAll = this.handleAll.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state = {
            acceptedLicenses: {},
            showSavedMessage: false,
        };
    }

    componentWillMount() {
        this.setState({ acceptedLicenses: { ...this.props.user.data.accepted_licenses } });
        this.props.getLicenses();
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

    render() {
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
                <AppBar
                    className="qa-Account-AppBar"
                    title="Account"
                    style={styles.header}
                    titleStyle={styles.headerTitle}
                    showMenuIconButton={false}
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
};

function mapStateToProps(state) {
    return {
        user: state.user,
        licenses: state.licenses,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getLicenses: () => {
            dispatch(getLicenses());
        },
        patchUser: (acceptedLicenses, username) => {
            dispatch(patchUser(acceptedLicenses, username));
        },
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Account);
