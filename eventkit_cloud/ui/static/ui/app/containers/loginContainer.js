import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { withTheme } from '@material-ui/core/styles';
import axios from 'axios';
import Button from '@material-ui/core/Button';
import { login } from '../actions/userActions';

export class Form extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.getErrorMessage = this.getErrorMessage.bind(this);
        this.state = {
            buttonDisabled: true,
            loginForm: false,
            oauthName: '',
            password: '',
            username: '',
        };
    }

    componentDidMount() {
        this.checkAuthEndpoint();
        this.checkOAuthEndpoint();
    }

    onChange(event) {
        this.setState({ [event.target.name]: event.target.value }, () => {
            if (!this.state.username || !this.state.password) {
                if (!this.state.buttonDisabled) {
                    this.setState({ buttonDisabled: true });
                }
            } else if (this.state.buttonDisabled) {
                this.setState({ buttonDisabled: false });
            }
        });
    }

    getErrorMessage() {
        if (!this.props.error) {
            return '';
        }
        const { statusCode, authType } = { ...this.props.error };
        if (statusCode === 401) {
            if (authType === 'auth') {
                return 'Username or Password incorrect.';
            }

            return 'Authentication failed. Please try again or contact an administrator.';
        }
        return 'An unknown error occurred. Please contact an administrator.';
    }

    checkAuthEndpoint() {
        return axios.get('/auth').then(() => {
            this.setState({ loginForm: true });
        }).catch(this.getErrorMessage);
    }

    checkOAuthEndpoint() {
        return axios.get('/oauth', { params: { query: 'name' } }).then((response) => {
            this.setState({ oauthName: response.data.name });
        }).catch(this.getErrorMessage);
    }

    handleSubmit(event) {
        event.preventDefault();
        this.props.handleLogin(this.state, (this.props.location ? this.props.location.search : ''));
    }

    handleOAuth(event) {
        event.preventDefault();
        window.location.assign('/oauth');
    }


    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            form: {
                margin: '0 auto',
                maxWidth: 300,
                verticalAlign: 'middle',
            },
            heading: {
                color: colors.white,
                fontSize: '20px',
                fontWeight: 'bold',
                margin: '15px auto 0px auto',
                width: '100%',
            },
            input: {
                backgroundColor: `${colors.secondary}33`,
                border: 'none',
                borderRadius: '0px',
                color: colors.white,
                fontSize: '16px',
                height: '45px',
                margin: '0px auto 15px auto',
                outline: 'none',
                padding: '10px',
                width: '100%',
            },
        };
        let loginForm = '';
        let oauthButton = '';
        if (this.state.loginForm) {
            loginForm = (
                <form onSubmit={this.handleSubmit} onChange={this.onChange} style={styles.form}>
                    <div style={styles.heading}>Enter Login Information</div>
                    <input
                        id="username"
                        name="username"
                        placeholder="Username"
                        style={styles.input}
                        type="text"
                        maxLength="150"
                    />
                    <input
                        id="password"
                        name="password"
                        placeholder="Password"
                        onChange={this.onChange}
                        style={styles.input}
                        type="password"
                        maxLength="256"
                    />
                    <Button
                        style={{ margin: '30px auto', width: '150px' }}
                        type="submit"
                        name="submit"
                        color="primary"
                        variant="contained"
                        disabled={this.state.buttonDisabled}
                    >
                        Login
                    </Button>
                </form>
            );
        }
        if (this.state.oauthName) {
            if (!this.state.loginForm) {
                oauthButton = (
                    <div className="qa-LoginForm-oauth">
                        <div style={{ margin: '40px auto', fontSize: '24px', color: colors.white }}>
                            <strong>Welcome to EventKit</strong>
                        </div>
                        <Button
                            style={{ margin: '40px auto', minWidth: '150px' }}
                            variant="contained"
                            color="primary"
                            onClick={this.handleOAuth}
                        >
                            {`Login with ${this.state.oauthName}`}
                        </Button>
                    </div>
                );
            } else {
                oauthButton = (
                    <span
                        role="button"
                        tabIndex={0}
                        style={{ color: colors.primary, cursor: 'pointer', margin: '15px auto' }}
                        onClick={this.handleOAuth}
                        onKeyPress={this.handleOAuth}
                        className="qa-LoginForm-oauth"
                    >
                        <strong>Or, login with {this.state.oauthName}</strong>
                    </span>
                );
            }
        }
        return (
            <div style={{ verticalAlign: 'middle', textAlign: 'center', marginTop: '30px' }}>
                {this.props.error
                && (
                    <div style={{ color: colors.warning }}>
                        {this.getErrorMessage()}
                    </div>
                )
                }
                {loginForm}
                {oauthButton}
                {!loginForm && !oauthButton
                    ? (
                        <div style={{ color: colors.white, marginTop: '150px' }}>
                        No login methods available, please contact an administrator
                        </div>
                    )
                    : null}
            </div>
        );
    }
}

Form.propTypes = {
    error: PropTypes.object.isRequired,
    handleLogin: PropTypes.func.isRequired,
    location: PropTypes.shape({
        search: PropTypes.object,
    }).isRequired,
    theme: PropTypes.object.isRequired,
};

function mapDispatchToProps(dispatch) {
    return {
        handleLogin: (params, query) => {
            dispatch(login(params, query));
        },
    };
}

function mapStateToProps(state) {
    return {
        error: state.user.status.error,
    };
}

export default withTheme()(connect(mapStateToProps, mapDispatchToProps)(Form));
