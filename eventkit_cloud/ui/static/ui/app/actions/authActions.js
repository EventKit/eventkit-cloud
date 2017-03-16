import cookie from 'react-cookie'
import actions from './actionTypes'


export const setCSRF = csrfmiddlewaretoken => {

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