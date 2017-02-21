import actions from './actionTypes'
import 'isomorphic-fetch'
import cookie from 'react-cookie'
import { push } from 'react-router-redux'
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

export const checkLogin = () => dispatch => {

    dispatch({
         type: actions.USER_LOGGING_IN
    });

    return axios({
        url: '/user',
        method: 'get',
    }).then((response) => {
        dispatch({
            type: actions.USER_LOGGED_IN,
            payload: response.data || {"ERROR": "No user response data"}
        })
    }).catch((error) => {
        dispatch(logout());
        console.log(error);
    });
}

export const login = data => dispatch => {

    dispatch({
        type: actions.USER_LOGGING_IN
    });

    axios.get('/auth/').catch((error) => {
        console.log(error);
    });

    const csrfmiddlewaretoken = cookie.load('csrftoken');
    const form_data = new FormData();
    form_data.append('username', data.username);
    form_data.append('password', data.password);
    form_data.append('csrfmiddlewaretoken', csrfmiddlewaretoken);

    return axios({
        url: '/auth/',
        method: 'post',
        data: form_data,
        headers: {"X-CSRFToken": csrfmiddlewaretoken}
    }).then((response) => {
        console.log(response.data || {"ERROR": "No user response data"});
        dispatch({
            type: actions.USER_LOGGED_IN,
            payload: response.data || {"ERROR": "No user response data"}
        });
    }).catch((error) => {
        console.log(error);
        dispatch(logout());
    });
}

