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
                type: types.FETCHING_USERS,
                cancelSource: 'fake source',
            },
        )).toEqual({
            ...usersState,
            fetched: false,
            fetching: true,
            cancelSource: 'fake source',
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
                type: types.FETCHED_USERS,
                users,
                total: 3,
                nextPage: false,
                range: '1/1',
            },
        )).toEqual({
            ...usersState,
            fetched: true,
            fetching: false,
            users,
            total: 3,
            nextPage: false,
            range: '1/1',
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
            fetched: false,
            fetching: false,
            error,
        });
    });
});
