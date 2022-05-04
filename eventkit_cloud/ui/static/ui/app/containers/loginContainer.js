import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import withTheme from '@mui/styles/withTheme';
import axios from 'axios';
import Button from '@mui/material/Button';
import { login } from '../actions/userActions';

export class Form extends Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.getErrorMessage = this.getErrorMessage.bind(this);
        this.state = {
            username: '',
            password: '',
            buttonDisabled: true,
            loginForm: false,
            oauthName: '',
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
        }).catch(() => {
        });
    }

    checkOAuthEndpoint() {
        return axios.get('/oauth', { params: { query: 'name' } }).then((response) => {
            this.setState({ oauthName: response.data.name });
        }).catch(() => {
        });
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
                verticalAlign: 'middle',
                margin: '0 auto',
                maxWidth: 300,
            },
            heading: {
                width: '100%',
                fontSize: '20px',
                fontWeight: 'bold',
                color: colors.white,
                margin: '15px auto 0px auto',
            },
            input: {
                borderRadius: '0px',
                outline: 'none',
                border: 'none',
                backgroundColor: `${colors.secondary}33`,
                fontSize: '16px',
                width: '100%',
                height: '45px',
                color: colors.white,
                margin: '0px auto 15px auto',
                padding: '10px',
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
                )}
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
    handleLogin: PropTypes.func.isRequired,
    location: PropTypes.shape({
        search: PropTypes.object,
    }).isRequired,
    theme: PropTypes.object.isRequired,
    error: PropTypes.object.isRequired,
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

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(Form));
