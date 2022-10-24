import { getUsers, usersSlice, initialState as usersState } from '../../slices/usersSlice';

const usersReducer = usersSlice.reducer;

describe('usersReducer', () => {
    it('should return initial state', () => {
        expect(usersReducer(undefined, { type: null } )).toEqual(usersState);
    });

    it('FETCHING_USERS should return fetching true and fetched false', () => {
        expect(usersReducer(
            {
                ...usersState,
                fetched: true,
            },
            {
                type: getUsers.pending,
            },
        )).toEqual({
            ...usersState,
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
                type: getUsers.fulfilled,
                payload: {
                    append: false,
                    users,
                    total: 3,
                    nextPage: false,
                    range: '1/1',
                },
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
        const error = { message: 'oh no, its an error' };
        expect(usersReducer(
            {
                ...usersState,
                fetching: true,
            },
            {
                type: getUsers.rejected,
                error,
            },
        )).toEqual({
            ...usersState,
            fetched: false,
            fetching: false,
            error: error.message,
        });
    });
});
