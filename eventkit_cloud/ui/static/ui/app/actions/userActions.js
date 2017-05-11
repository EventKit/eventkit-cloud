import actions from './actionTypes'
import { push } from 'react-router-redux'
import axios from 'axios'
import cookie from 'react-cookie'


export const logout = () => dispatch => {

    return axios('/logout', {method: 'GET'}).then((response) => {
        dispatch({
            type: actions.USER_LOGGED_OUT,
        })
        dispatch(push('/login'));
    }).catch((error) => {
        console.log(error);
    });
}


export const login = data => (dispatch) => {

    const csrftoken = cookie.load('csrftoken');

    dispatch({
        type: actions.USER_LOGGING_IN,
    });

    const form_data = new FormData();
    var method = 'get';
    if(data && (data.username && data.password)) {
        form_data.append('username', data.username);
        form_data.append('password', data.password);
        method = 'post';
    }

    return axios({
        url: '/auth',
        method: method,
        data: form_data,
        headers: {"X-CSRFToken": csrftoken}
    }).then((response) => {
        dispatch({
            type: actions.USER_LOGGED_IN,
            payload: response.data
        });
    }).catch((error) => {
        dispatch(logout());
    });
}

export const patchUser = (acceptedLicenses, username) => (dispatch) => {
    const csrftoken = cookie.load('csrftoken');
    dispatch({
        type: actions.PATCHING_USER,
    });

    return axios({
        url: '/api/user/' + username,
        method: 'PATCH',
        data: {accepted_licenses: acceptedLicenses},
        headers: {'X-CSRFToken': csrftoken}
    }).then((response) => {

        dispatch({
            type: actions.PATCHED_USER,
            payload: response.data || {"ERROR": "No user response data"}
        });
    }).catch((error) => {
        dispatch({
            type: actions.PATCHING_USER_ERROR,
            error: error
        });
    });
}

