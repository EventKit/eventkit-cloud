import { push } from 'connected-react-router';
import axios from 'axios';
import { resetState } from './uiActions';
import { getCookie } from '../utils/generic';

export const types = {
    PATCHED_USER: 'PATCHED_USER',
    PATCHING_USER: 'PATCHING_USER',
    PATCHING_USER_ERROR: 'PATCHING_USER_ERROR',
    USER_ACTIVE: 'USER_ACTIVE',
    USER_LOGGED_IN: 'USER_LOGGED_IN',
    USER_LOGGED_OUT: 'USER_LOGGED_OUT',
    USER_LOGGING_IN: 'USER_LOGGING_IN',
};

export function logout() {
    return dispatch => (
        axios('/logout', { method: 'GET' }).then((response) => {
            dispatch({
                type: types.USER_LOGGED_OUT,
            });
            if (response.data.OAUTH_LOGOUT_URL) {
                window.location.assign(response.data.OAUTH_LOGOUT_URL);
            } else {
                dispatch(push({ pathname: '/login' }));
                dispatch(resetState());
            }
        }).catch((error) => {
            console.warn(error);
        })
    );
}

export function login(data) {
    return (dispatch) => {
        const csrftoken = getCookie('csrftoken');
        dispatch({
            type: types.USER_LOGGING_IN,
        });

        const formData = new FormData();
        let method = 'get';
        if (data && (data.username && data.password)) {
            formData.append('username', data.username);
            formData.append('password', data.password);
            method = 'post';
        }

        return axios({
            data: formData,
            headers: { 'X-CSRFToken': csrftoken },
            method,
            url: '/auth',
        }).then((response) => {
            if (response.data) {
                dispatch({
                    payload: response.data,
                    type: types.USER_LOGGED_IN,
                });
            } else {
                dispatch({
                    type: types.USER_LOGGED_OUT,
                });
            }
        }).catch((response) => {
            if (method === 'get') {
                dispatch({
                    type: types.USER_LOGGED_OUT,
                });
            } else {
                dispatch({
                    status: {
                        error: {
                            authType: 'auth',
                            statusCode: response.response.status,
                        },
                    },
                    type: types.USER_LOGGED_OUT,
                });
            }
        });
    };
}

export function patchUser(acceptedLicenses, username) {
    return {
        data: { accepted_licenses: acceptedLicenses },
        method: 'PATCH',
        onSuccess: response => ({ payload: response.data || { ERROR: 'No user response data' } }),
        types: [
            types.PATCHED_USER,
            types.PATCHING_USER,
            types.PATCHING_USER_ERROR,
        ],
        url: `/api/users/${username}`,
    };
}

export function userActive() {
    return dispatch => (
        axios('/user_active', { method: 'GET' }).then((response) => {
            const autoLogoutAt = response.data.auto_logout_at;
            const autoLogoutWarningat = response.data.auto_logout_warning_at;

            dispatch({
                payload: {
                    autoLogoutAt: (autoLogoutAt) ? new Date(autoLogoutAt) : null,
                    autoLogoutWarningAt: (autoLogoutWarningat)
                        ? new Date(autoLogoutWarningat) : null,
                },
                type: types.USER_ACTIVE,
            });
        }).catch((error) => {
            console.warn(error.message);
        })
    );
}
