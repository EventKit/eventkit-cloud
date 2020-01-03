import { initialState as usersState, usersReducer } from '../../reducers/usersReducer';
import { types } from '../../actions/usersActions';

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
                cancelSource: 'fake source',
                type: types.FETCHING_USERS,
            },
        )).toEqual({
            ...usersState,
            cancelSource: 'fake source',
            fetched: false,
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
            },
            {
                nextPage: false,
                range: '1/1',
                total: 3,
                type: types.FETCHED_USERS,
                users,
            },
        )).toEqual({
            ...usersState,
            fetched: true,
            fetching: false,
            nextPage: false,
            range: '1/1',
            total: 3,
            users,
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
                error,
                type: types.FETCH_USERS_ERROR,
            },
        )).toEqual({
            ...usersState,
            error,
            fetched: false,
            fetching: false,
        });
    });
});
