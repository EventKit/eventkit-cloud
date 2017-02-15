import actions from './actionTypes'
import axios from 'axios'
import cookie from 'react-cookie'


export const logout = data => dispatch => {
    //may need to look at validating login on backend prior to updating.
    axios({
        url: '/logout',
        method: 'get',
    }).then((response) =>{
        dispatch({
            type: actions.USER_LOGGED_OUT,
        })}
    ).catch((error) => {
        console.log(error);
    });
}

export const checkLogin = () => dispatch => {
    console.log("DISPATCHING THE LOG IN STATE");
    dispatch({
        type: actions.USER_LOGGING_IN
    });

    axios({
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
    console.log("RETURNING FROM CHECK LOGIN");
}

export const login = data => dispatch => {
    console.log("DISPATCHING THE LOG IN STATE");
    dispatch({
        type: actions.USER_LOGGING_IN
    });

    console.log("FETCHING CSRF TOKEN");
    axios.get('/auth/').catch((error) => {
        console.log(error);
    });

    const csrfmiddlewaretoken = cookie.load('csrftoken');
    const form_data = new FormData();
    form_data.append('username', data.username);
    form_data.append('password', data.password);
    form_data.append('csrfmiddlewaretoken', csrfmiddlewaretoken);
    console.log("LOGGING IN");
    axios({
        url: '/auth/',
        method: 'post',
        data: form_data,
        headers: {"X-CSRFToken": csrfmiddlewaretoken}
    }).then((response)=> {
        console.log("CHECKING LOG IN");
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

