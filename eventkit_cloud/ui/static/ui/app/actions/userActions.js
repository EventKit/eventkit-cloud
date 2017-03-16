import actions from './actionTypes'
import 'isomorphic-fetch'
import cookie from 'react-cookie'
import {push} from 'react-router-redux'
import axios from 'axios'


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


export const login = data => (dispatch, getState) => {

    const { csrftoken } = getState().auth;

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
        url: '/auth/',
        method: method,
        data: form_data,
        headers: {"X-CSRFToken": csrftoken}
    }).then((response) => {
        console.log(response)
        dispatch({
            type: actions.USER_LOGGED_IN,
            payload: response.data || {"ERROR": "No user response data"}
        });
    }).catch((error) => {
        dispatch(logout());
    });

}

