import * as actions from '../actions/authActions'
import types from '../actions/actionTypes'

describe('auth actions', () => {
    it('setCSRF should return the csrftoken along with the state', () => {
        const example_csrf = 'testcsrf'
        expect(actions.setCSRF(example_csrf)).toEqual({
            type: types.SET_CSRF,
            payload: {csrftoken: example_csrf}
        })
    })

    it('clearCSRF should return true', () => {
        expect(actions.clearCSRF()).toEqual({
            type: types.CLEAR_CSRF,
        })
    })
})