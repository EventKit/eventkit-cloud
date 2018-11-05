import * as user from '../../reducers/userReducer';
import { types } from '../../actions/userActions';

describe('userStatusReducer', () => {
    it('should return initial state', () => {
        expect(user.userStatusReducer(undefined, {})).toEqual(user.user.status);
    });

    it('USER_LOGGING_IN should set isLoading to true', () => {
        expect(user.userStatusReducer(
            user.user.status,
            {
                type: types.USER_LOGGING_IN,
            },
        )).toEqual({ ...user.user.status, isLoading: true });
    });

    it('USER_LOGGED_IN should setLoading to false', () => {
        expect(user.userStatusReducer(
            { ...user.user.status, isLoading: true },
            {
                type: types.USER_LOGGED_IN,
            },
        )).toEqual({ ...user.user.status, isLoading: false });
    });

    it('USER_LOGGED_OUT should set isLoading false', () => {
        expect(user.userStatusReducer(
            { ...user.user.status, isLoading: true },
            {
                type: types.USER_LOGGED_OUT,
            },
        )).toEqual({ ...user.user.status, isLoading: false });
    });

    it('PATCHING_USER should return patching true', () => {
        expect(user.userStatusReducer(
            user.user.status,
            {
                type: types.PATCHING_USER,
            },
        )).toEqual({ ...user.user.status, patching: true });
    });

    it('PATCHED_USER should return patched true', () => {
        expect(user.userStatusReducer(
            { ...user.user.status, patching: true },
            {
                type: types.PATCHED_USER,
            },
        )).toEqual({ ...user.user.status, patched: true, patching: false });
    });

    it('PATCHING_USER_ERROR should return the error', () => {
        expect(user.userStatusReducer(
            { ...user.user.status, patching: true },
            {
                type: types.PATCHING_USER_ERROR,
                error: 'This is an important error',
            },
        )).toEqual({ ...user.user.status, error: 'This is an important error', patching: false });
    });
});

describe('userMetaReducer', () => {
    it('should return initial state', () => {
        expect(user.userMetaReducer(undefined, {})).toEqual(user.user.meta);
    });

    it('USER_ACTIVE should return the payload', () => {
        expect(user.userMetaReducer(
            {
                ...user.user.meta,
            },
            {
                type: types.USER_ACTIVE,
                payload: {
                    autoLogoutAt: 111,
                    autoLogoutWarningAt: 11,
                },
            },
        )).toEqual({
            ...user.user.meta,
            autoLogoutAt: 111,
            autoLogoutWarningAt: 11,
        });
    });
});

describe('userDataReducer', () => {
    it('should return initial state', () => {
        expect(user.userDataReducer(undefined, {})).toEqual(user.user.data);
    });

    it('USER_LOGGED_IN should update userdata', () => {
        expect(user.userDataReducer(
            user.user.data,
            {
                type: types.USER_LOGGED_IN,
                payload: { user: { username: 'admin' }, accepted_licenses: { one: true } },
            },
        )).toEqual({ user: { username: 'admin' }, accepted_licenses: { one: true } });
    });

    it('USER_LOGGED_OUT should set userdata null', () => {
        expect(user.userDataReducer(
            { user: { some: 'data' } },
            {
                type: types.USER_LOGGED_OUT,
            },
        )).toEqual(null);
    });

    it('PATCHED_USER should return patched true and the upated user data', () => {
        expect(user.userDataReducer(
            user.user.data,
            {
                type: types.PATCHED_USER,
                payload: { user: { username: 'admin' }, accepted_licenses: { one: true } },
            },
        )).toEqual({ user: { username: 'admin' }, accepted_licenses: { one: true } });
    });
});
