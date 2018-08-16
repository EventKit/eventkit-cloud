import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import axios from 'axios';
import RaisedButton from 'material-ui/RaisedButton';
import { login } from '../actions/userActions';

export class Form extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.state = {
            username: '',
            password: '',
            buttonDisabled: true,
            loginForm: false,
            oauthName: '',
        };
    }

    getChildContext() {
        return { muiTheme: getMuiTheme(baseTheme) };
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
        this.props.handleLogin(this.state, (this.props.location ? this.props.location.query : ''));
    }

    handleOAuth(event) {
        event.preventDefault();
        window.location.assign('/oauth');
    }

    render() {
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
                color: 'white',
                margin: '15px auto 0px auto',
            },
            input: {
                borderRadius: '0px',
                outline: 'none',
                border: 'none',
                backgroundColor: 'rgba(179,205,224,.2)',
                fontSize: '16px',
                width: '100%',
                height: '45px',
                color: '#e2e2e2',
                margin: '15px auto 0px auto',
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
                    <RaisedButton
                        style={{ margin: '30px auto', width: '150px' }}
                        backgroundColor="#4598bf"
                        label="Login"
                        labelColor="#fff"
                        type="submit"
                        name="submit"
                        disabled={this.state.buttonDisabled}
                    />
                </form>
            );
        }
        if (this.state.oauthName) {
            if (!this.state.loginForm) {
                oauthButton = (
                    <div className="qa-LoginForm-oauth">
                        <div style={{ margin: '40px auto', fontSize: '24px', color: '#fff' }}>
                            <strong>Welcome to EventKit</strong>
                        </div>
                        <RaisedButton
                            style={{ margin: '40px auto', minWidth: '150px' }}
                            labelStyle={{ textTransform: 'none' }}
                            backgroundColor="#4598bf"
                            label={`Login with ${this.state.oauthName}`}
                            labelColor="#fff"
                            onClick={this.handleOAuth}
                        />
                    </div>
                );
            } else {
                oauthButton = (
                    <span
                        role="button"
                        tabIndex={0}
                        style={{ color: '#4598bf', cursor: 'pointer', margin: '15px auto' }}
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
                {loginForm}
                {oauthButton}
                {!loginForm && !oauthButton ?
                    <div style={{ color: '#fff', marginTop: '150px' }}>
                        No login methods available, please contact an administrator
                    </div>
                    : null}
            </div>
        );
    }
}

Form.propTypes = {
    handleLogin: PropTypes.func.isRequired,
    location: PropTypes.shape({
        query: PropTypes.object,
    }).isRequired,
};

function mapDispatchToProps(dispatch) {
    return {
        handleLogin: (params, query) => {
            dispatch(login(params, query));
        },
    };
}

Form.childContextTypes = {
    muiTheme: PropTypes.object.isRequired,
};

export default connect(null, mapDispatchToProps)(Form);
