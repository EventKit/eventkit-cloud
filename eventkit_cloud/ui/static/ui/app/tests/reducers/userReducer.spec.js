import { userReducer, initialState as userState } from '../../reducers/userReducer';
import { types } from '../../actions/userActions';

describe('userReducer', () => {
    it('should return initial state', () => {
        expect(userReducer(undefined, {})).toEqual(userState);
    });

    it('USER_LOGGING_IN should set isLoading to true', () => {
        expect(userReducer(
            userState,
            {
                type: types.USER_LOGGING_IN,
            },
        )).toEqual({ ...userState, isLoading: true });
    });

    it('USER_LOGGED_IN should setLoading to false and update userdata', () => {
        expect(userReducer(
            { ...userState, isLoading: true },
            {
                type: types.USER_LOGGED_IN,
                payload: { user: { username: 'admin' }, accepted_licenses: { one: true } },
            },
        )).toEqual({ ...userState, data: { user: { username: 'admin' }, accepted_licenses: { one: true } } });
    });

    it('USER_LOGGED_IN should set loading to false an data to null if no payload', () => {
        expect(userReducer(
            { ...userState, isLoading: true },
            {
                type: types.USER_LOGGED_IN,
                payload: null,
            },
        )).toEqual({ ...userState });
    });

    it('USER_LOGGED_OUT should set isLoading false and userdata null', () => {
        expect(userReducer(
            { ...userState, isLoading: true, data: { user: { some: 'data' } } },
            {
                type: types.USER_LOGGED_OUT,
            },
        )).toEqual({ ...userState });
    });

    it('PATCHING_USER should return patching true', () => {
        expect(userReducer(
            userState,
            {
                type: types.PATCHING_USER,
            },
        )).toEqual({ ...userState, patching: true });
    });

    it('PATCHED_USER should return patched true and the upated user data', () => {
        expect(userReducer(
            { ...userState, patching: true },
            {
                type: types.PATCHED_USER,
                payload: { user: { username: 'admin' }, accepted_licenses: { one: true } },
            },
        )).toEqual({ ...userState, patched: true, data: { user: { username: 'admin' }, accepted_licenses: { one: true } } });
    });

    it('PATCHING_USER_ERROR should return teh error', () => {
        expect(userReducer(
            { ...userState, patching: true },
            {
                type: types.PATCHING_USER_ERROR,
                error: 'This is an important error',
            },
        )).toEqual({ ...userState, error: 'This is an important error' });
    });

    it('USER_ACTIVE should return the payload', () => {
        expect(userReducer(
            {
                ...userState,
            },
            {
                type: types.USER_ACTIVE,
                payload: {
                    autoLogoutAt: 111,
                    autoLogoutWarningAt: 11,
                },
            },
        )).toEqual({
            ...userState,
            autoLogoutAt: 111,
            autoLogoutWarningAt: 11,
        });
    });
});
