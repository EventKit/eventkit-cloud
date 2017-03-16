import authReducer, {initialState} from '../reducers/authReducer'
import types from '../actions/actionTypes'

describe('authReducer', () => {

    it('should return initial state', () => {
        expect(authReducer(undefined, {})).toEqual(
            {
                csrftoken: null
            }
        )
    })

    it('SET_CSRF should add the csrf token to the store', () => {

        const expected_csrftoken = "example_token";

        expect(authReducer(
            undefined,
            {
                type: types.SET_CSRF,
                payload: {csrftoken: expected_csrftoken}
            }
        )).toEqual({...initialState, csrftoken: expected_csrftoken})
    })

    it('SET_CSRF should update the csrf token in the store', () => {

        const original_csrftoken = "example_token";
        const new_csrftoken = "example_token_2";

        const state = { csrftoken: original_csrftoken }

        expect(authReducer(
            state,
            {
                type: types.SET_CSRF,
                payload: {csrftoken: new_csrftoken}
            }
        )).toEqual({...state, csrftoken: new_csrftoken})
    })

    it('REMOVE_CSRF should remove the csrf token from the store', () => {
        const expected_csrftoken = "example_token";
        const state = {...initialState, csrftoken: expected_csrftoken};

        expect(authReducer(
            state,
            {
                type: types.CLEAR_CSRF
            }
        )).toEqual({...state, csrftoken: null})
    })

})
