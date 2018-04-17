import {
    userReducer, usersReducer, userState, usersState,
} from '../../reducers/userReducer';
import types from '../../actions/actionTypes';

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

describe('usersReducer', () => {
    it('should return initial state', () => {
        expect(usersReducer(undefined, {})).toEqual(usersState);
    });

    it('FETCHING_USERS should return fetching true and fetched false', () => {
        expect(usersReducer(
            {
                ...usersState,
                fetched: true,
            },
            {
                type: types.FETCHING_USERS,
            },
        )).toEqual({
            ...usersState,
            fetching: true,
        });
    });

    it('FETCHED_USER should return fetched true, the users, and user total', () => {
        const users = [{ name: 'one' }, { name: 'two' }];
        expect(usersReducer(
            {
                ...usersState,
                fetching: true,
                total: 0,
                new: 0,
                ungrouped: 0,
            },
            {
                type: types.FETCHED_USERS,
                users,
                total: 3,
                new: 2,
                ungrouped: 1,

            },
        )).toEqual({
            ...usersState,
            fetched: true,
            users,
            total: 3,
            new: 2,
            ungrouped: 1,
        });
    });

    it('FETCH_USERS_ERROR should return the error', () => {
        const error = 'oh no, its an error';
        expect(usersReducer(
            {
                ...usersState,
                fetching: true,
            },
            {
                type: types.FETCH_USERS_ERROR,
                error,
            },
        )).toEqual({
            ...usersState,
            error,
        });
    });
});
