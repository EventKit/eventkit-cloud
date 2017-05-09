import userReducer, {initialState} from '../reducers/userReducer';
import types from '../actions/actionTypes';

describe('userReducer', () => {
    it('should return initial state', () => {
        expect(userReducer(undefined, {})).toEqual(initialState);
    });

    it('USER_LOGGING_IN should set isLoading to true', () => {
         expect(userReducer(
             initialState,
             {
                 type: types.USER_LOGGING_IN,
             }
         )).toEqual({...initialState, isLoading: true});
    });

    it('USER_LOGGED_IN should setLoading to false and update userdata', () => {
        expect(userReducer(
            {...initialState, isLoading: true},
            {
                type: types.USER_LOGGED_IN,
                payload: {user: {username: 'admin'}, accepted_licenses: {one: true}},
            }
        )).toEqual({...initialState, data: {user: {username: 'admin'}, accepted_licenses: {one: true}}});
    });

    it('USER_LOGGED_OUT should set isLoading false and userdata null', () =>{
        expect(userReducer(
            {...initialState, isLoading: true, data: {user: {some: 'data'}}},
            {
                type: types.USER_LOGGED_OUT
            }
        )).toEqual({...initialState});
    });

    it('PATCHING_USER should return patching true', () => {
        expect(userReducer(
            initialState,
            {
                type: types.PATCHING_USER
            }
        )).toEqual({...initialState, patching: true});
    });

    it('PATCHED_USER should return patched true and the upated user data', () => {
        expect(userReducer(
            {...initialState, patching: true},
            {
                type: types.PATCHED_USER,
                payload: {user: {username: 'admin'}, accepted_licenses: {one: true}}
            }
        )).toEqual({...initialState, patched: true, data: {user: {username: 'admin'}, accepted_licenses: {one: true}}});
    });

    it('PATCHING_USER_ERROR should return teh error', () => {
        expect(userReducer(
            {...initialState, patching: true},
            {
                type: types.PATCHING_USER_ERROR,
                error: 'This is an important error',
            }
        )).toEqual({...initialState, error: 'This is an important error'});
    });
});
