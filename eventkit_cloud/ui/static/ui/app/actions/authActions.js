import cookie from 'react-cookie'
import actions from './actionTypes'


export const setToken = token => {

    return {
        type: actions.SET_TOKEN,
        payload: {token: token}
    }
}

export const clearToken = () => {

    return {
        type: actions.CLEAR_TOKEN,
    }

}