import { push } from 'react-router-redux';
import axios from 'axios';
import cookie from 'react-cookie';
import MockAdapter from 'axios-mock-adapter'; /// JUST FOR MOCKING ///
import actions from './actionTypes';


export const logout = query => (dispatch) => {
    return axios('/logout', { method: 'GET' }).then((response) => {
        dispatch({
            type: actions.USER_LOGGED_OUT,
        });
        if(response.data.OAUTH_LOGOUT_URL) {
            window.location.href = response.data.OAUTH_LOGOUT_URL;
        }else{
            dispatch(push({ pathname: '/login' }));
        };
    }).catch((error) => {
        console.log(error);
    });
};


export const login = (data, query) => (dispatch) => {

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
        }
        else {
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

export const patchUser = (acceptedLicenses, username) => (dispatch) => {
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
            payload: response.data || { ERROR: 'No user response data'},
        });
    }).catch((error) => {
        dispatch({
            type: actions.PATCHING_USER_ERROR,
            error,
        });
    });
}

export const userActive = () => (dispatch) => {
    return axios('/user_active', {method: 'GET'}).then((response) => {
        const autoLogoutAt = response.data.auto_logout_at;
        const autoLogoutWarningat = response.data.auto_logout_warning_at;

        dispatch({
            type: actions.USER_ACTIVE,
            payload: {
                autoLogoutAt: (autoLogoutAt) ? new Date(autoLogoutAt) : null,
                autoLogoutWarningAt: (autoLogoutWarningat) ? new Date(autoLogoutWarningat) : null,
            },
        });
    }).catch((error) => {
        console.error(error.message);
    });
};

export function getUsers(params) {
    return (dispatch, getState) => {
        // get the current user information
        const loggedInUser = getState().user.data.user;
        //////// JUST FOR MOCKING THE API /////////////
        let fakeUsers = [
            { username: 'admin', name: 'admin', email: 'admin@eventkit.dev', groups: ['id-0', 'id-2', 'id-3', 'id-5', 'id-6', 'id-9', 'id-12', 'id-15', 'id-18'] },
            { username: 'JaneD', name: 'Jane Doe', email: 'jane.doe@email.com', groups: ['id-0', 'id-2', 'id-3', 'id-6', 'id-8', 'id-10', 'id-14', 'id-16', 'id-20'] },
            { username: 'JohnD', name: 'John Doe', email: 'john.doe@email.com', groups: ['id-0', 'id-2', 'id-3', 'id-6', 'id-7', 'id-11', 'id-13', 'id-17', 'id-19'] },
            { username: 'JoeS', name: 'Joe Shmo', email: 'joe.shmo@email.com', groups: ['id-0', 'id-2', 'id-1', 'id-3', 'id-2', 'id-3', 'id-5', 'id-8', 'id-9', 'id-12', 'id-13', 'id-14', 'id-18', 'id-19', 'id-20'] },
            { username: 'U1', name: 'User 1', email: 'user1@email.com', groups: ['id-0', 'id-2', 'id-3', 'id-6', 'id-8', 'id-10', 'id-14', 'id-16', 'id-20'] },
            { username: 'U2', name: 'User 2', email: 'user2@email.com', groups: ['id-1', 'id-2', 'id-3', 'id-6', 'id-8', 'id-9', 'id-14', 'id-16', 'id-20'] },
            { username: 'U3', name: 'User 3', email: 'user3@email.com', groups: ['id-1', 'id-2', 'id-4', 'id-7', 'id-9', 'id-11', 'id-13', 'id-17', 'id-20'] },
        ];

        console.log(params.split('&'));
        
        const split = params.split('&');
        split.forEach((value) => {
            if (value.includes('search=')) {
                const search = value.substring(7);
                fakeUsers = fakeUsers.filter(user => (
                    user.username.includes(search)
                    || user.name.includes(search)
                    || user.email.includes(search)
                ));
            }
            if (value.includes('group=')) {
                const group = value.substring(6);
                fakeUsers = fakeUsers.filter(user => (
                    user.groups.includes(group)
                ));
            }
        });
        

        const mock = new MockAdapter(axios, { delayResponse: 3000 });
        mock.onGet().reply(200, fakeUsers);
        //////////////////////////////////////////////////////////////

        dispatch({ type: actions.FETCHING_USERS });

        const url = params ? `/api/users?${params}` : '/api/users';
        const csrfmiddlewaretoken = cookie.load('csrftoken');

        return axios({
            url,
            method: 'GET',
            headers: { 'X-CSRFToken': csrfmiddlewaretoken },
        }).then((response) => {
            // filter out the current user from the list
            const users = response.data.filter(user => (user.email !== loggedInUser.email));
            dispatch({ type: actions.FETCHED_USERS, users });
            mock.restore();
        }).catch((error) => {
            dispatch({ type: actions.FETCH_USERS_ERROR, error: error.response.data });
            mock.restore();
        });
    };
}
