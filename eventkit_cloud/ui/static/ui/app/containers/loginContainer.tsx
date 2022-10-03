import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { withTheme } from '@material-ui/core/styles';
import axios from 'axios';
import Button from '@material-ui/core/Button';
import { login } from '../actions/userActions';

export const Form = (props) => {
    const [loginFormEnabled, setLoginFormEnabled] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [oauthName, setOauthName] = useState('');
    const error = useSelector((state) => state.user.status.error)
    const dispatch = useDispatch();

    const handleSubmit = (event) => {
        event.preventDefault();
        dispatch(login({username, password}, (props.location ? props.location.search : '')));
    };

    const handleOAuth = (event) => {
        event.preventDefault();
        window.location.assign('/oauth');
    };

    const onChange = (event) => {
        if(event.target.name === "password") {
            setPassword(event.target.value);
        } else if(event.target.name === "username") {
            setUsername(event.target.value);
        }

        if (!username || !password) {
            setButtonDisabled(true);
        } else {
            setButtonDisabled(false);
        }
    };

    const getErrorMessage = () => {
        if (!error) {
            return '';
        }
        const { statusCode, authType } = { ...error };
        if (statusCode === 401) {
            if (authType === 'auth') {
                return 'Username or Password incorrect.';
            }

            return 'Authentication failed. Please try again or contact an administrator.';
        }
        return 'An unknown error occurred. Please contact an administrator.';
    };

    const checkAuthEndpoint = () => {
        return axios.get('/auth')
    };

    const checkOAuthEndpoint = () => {
        return axios.get('/oauth', { params: { query: 'name' } })
    };

    useEffect(() => {
        checkAuthEndpoint().then(() => {
            setLoginFormEnabled(true);
        }).catch(() => { });

        checkOAuthEndpoint().then((response) => {
            setOauthName(response.data.name);
        }).catch(() => { });

    }, []);

    const { colors } = props.theme.eventkit;
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
    if (loginFormEnabled) {
        loginForm = (
            <form onSubmit={handleSubmit} onChange={onChange} style={styles.form}>
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
                    onChange={onChange}
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
                    disabled={buttonDisabled}
                >
                    Login
                </Button>
            </form>
        );
    }

    if (oauthName) {
        if (!loginFormEnabled) {
            oauthButton = (
                <div className="qa-LoginForm-oauth">
                    <div style={{ margin: '40px auto', fontSize: '24px', color: colors.white }}>
                        <strong>Welcome to EventKit</strong>
                    </div>
                    <Button
                        style={{ margin: '40px auto', minWidth: '150px' }}
                        variant="contained"
                        color="primary"
                        onClick={handleOAuth}
                    >
                        {`Login with ${oauthName}`}
                    </Button>
                </div>
            );
        } else {
            oauthButton = (
                <span
                    role="button"
                    tabIndex={0}
                    style={{ color: colors.primary, cursor: 'pointer', margin: '15px auto' }}
                    onClick={handleOAuth}
                    onKeyPress={handleOAuth}
                    className="qa-LoginForm-oauth"
                >
                        <strong>Or, login with {oauthName}</strong>
                    </span>
            );
        }
    }

    return (
        <div style={{ verticalAlign: 'middle', textAlign: 'center', marginTop: '30px' }}>
            {error
            && (
                <div style={{ color: colors.warning }}>
                    {getErrorMessage()}
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
};

export default withTheme(Form);
