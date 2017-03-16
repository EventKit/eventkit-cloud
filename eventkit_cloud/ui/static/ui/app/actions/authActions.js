import cookie from 'react-cookie'
import actions from './actionTypes'


export const setCSRF = () => {

    const csrfmiddlewaretoken = cookie.load('csrftoken');

    return {
        type: actions.SET_CSRF,
        payload: {csrftoken: csrfmiddlewaretoken}
    }
}

export const clearCSRF = () => {

    return {
        type: actions.CLEAR_CSRF,
    }

}