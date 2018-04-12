import { push } from 'react-router-redux';
import axios from 'axios';
import cookie from 'react-cookie';
import actions from './actionTypes';


export function logout() {
    return dispatch => (
        axios('/logout', { method: 'GET' }).then((response) => {
            dispatch({
                type: actions.USER_LOGGED_OUT,
            });
            if (response.data.OAUTH_LOGOUT_URL) {
                window.location.assign(response.data.OAUTH_LOGOUT_URL);
            } else {
                dispatch(push({ pathname: '/login' }));
            }
        }).catch((error) => {
            console.log(error);
        })
    );
}

export function login(data, query) {
    return (dispatch) => {
        const csrftoken = cookie.load('csrftoken');

        dispatch({
            type: actions.USER_LOGGING_IN,
        });

        const form_data = new FormData();
        let method = 'get';
        if (data && (data.username && data.password)) {
            form_data.append('username', data.username);
            form_data.append('password', data.password);
            method = 'post';
        }

        return axios({
            url: '/auth',
            method,
            data: form_data,
            headers: { 'X-CSRFToken': csrftoken },
        }).then((response) => {
            if (response.data) {
                dispatch({
                    type: actions.USER_LOGGED_IN,
                    payload: response.data,
                });
            } else {
                dispatch({
                    type: actions.USER_LOGGED_OUT,
                });
            }
        }).catch(() => {
            dispatch({
                type: actions.USER_LOGGED_OUT,
            });
        });
    };
}

export function patchUser(acceptedLicenses, username) {
    return (dispatch) => {
        const csrftoken = cookie.load('csrftoken');

        dispatch({
            type: actions.PATCHING_USER,
        });

        return axios({
            url: `/api/users/${username}`,
            method: 'PATCH',
            data: { accepted_licenses: acceptedLicenses },
            headers: { 'X-CSRFToken': csrftoken },
        }).then((response) => {
            dispatch({
                type: actions.PATCHED_USER,
                payload: response.data || { ERROR: 'No user response data' },
            });
        }).catch((error) => {
            dispatch({
                type: actions.PATCHING_USER_ERROR,
                error: error.response.data,
            });
        });
    };
}

export function userActive() {
    return dispatch => (
        axios('/user_active', { method: 'GET' }).then((response) => {
            const autoLogoutAt = response.data.auto_logout_at;
            const autoLogoutWarningat = response.data.auto_logout_warning_at;

            dispatch({
                type: actions.USER_ACTIVE,
                payload: {
                    autoLogoutAt: (autoLogoutAt) ? new Date(autoLogoutAt) : null,
                    autoLogoutWarningAt: (autoLogoutWarningat) ?
                        new Date(autoLogoutWarningat) : null,
                },
            });
        }).catch((error) => {
            console.error(error.message);
        })
    );
}

export function getUsers(params) {
    return (dispatch, getState) => {
        // get the current user information
        const loggedInUser = getState().user.data.user;

        dispatch({ type: actions.FETCHING_USERS });

        const csrfmiddlewaretoken = cookie.load('csrftoken');

        return axios({
            url: '/api/users',
            params,
            method: 'GET',
            headers: { 'X-CSRFToken': csrfmiddlewaretoken },
        }).then((response) => {
            // get the total, new, and ungrouped counts from the header
            const totalUsers = Number(response.headers['total-users']);
            const newUsers = Number(response.headers['new-users']);
            const ungroupedUsers = Number(response.headers['not-grouped-users']);

            // filter out the current user from the list
            const users = response.data.filter(user => (user.user.username !== loggedInUser.username));
            
            dispatch({
                type: actions.FETCHED_USERS,
                users,
                total: totalUsers,
                new: newUsers,
                ungrouped: ungroupedUsers,
            });
        }).catch((error) => {
            dispatch({ type: actions.FETCH_USERS_ERROR, error: error.response.data });
        });
    };
}
