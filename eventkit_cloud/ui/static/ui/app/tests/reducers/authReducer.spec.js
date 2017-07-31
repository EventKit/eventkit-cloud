import authReducer, {initialState} from '../../reducers/authReducer'
import types from '../../actions/actionTypes'

describe('authReducer', () => {

    it('should return initial state', () => {
        expect(authReducer(undefined, {})).toEqual(
            {
                token: null
            }
        )
    });

    it('SET_TOKEN should add the token to the store', () => {

        const expected_token = "example_token";

        expect(authReducer(
            undefined,
            {
                type: types.SET_TOKEN,
                payload: {token: expected_token}
            }
        )).toEqual({...initialState, token: expected_token})
    });

    it('SET_TOKEN should update the token in the store', () => {

        const original_token = "example_token";
        const new_token = "example_token_2";

        const state = { token: original_token }

        expect(authReducer(
            state,
            {
                type: types.SET_TOKEN,
                payload: {token: new_token}
            }
        )).toEqual({...state, token: new_token})
    });

    it('REMOVE_TOKEN should remove the token from the store', () => {
        const expected_token = "example_token";
        const state = {...initialState, token: expected_token};

        expect(authReducer(
            state,
            {
                type: types.CLEAR_TOKEN
            }
        )).toEqual({...state, token: null})
    });

})
