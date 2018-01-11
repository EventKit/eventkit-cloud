import { userGroupsReducer } from '../../reducers/userGroupsReducer';
import initialState from '../../reducers/initialState';
import types from '../../actions/actionTypes';

describe('userGroupsReducer', () => {
    const state = initialState.groups;

    it('should return initialState', () => {
        expect(userGroupsReducer(undefined, {})).toEqual(state);
    });

    it('FETCHING_GROUPS should return fetching true and a cancelSource', () => {
        const cancelSource = { source: 'fake cancel source' };
        expect(userGroupsReducer(
            {
                ...state,
            },
            {
                type: types.FETCHING_GROUPS,
                cancelSource,
            },
        )).toEqual({
            ...state,
            fetching: true,
            cancelSource,
        });
    });

    it('FETCHED_GROUPS should return fetched true and the groups', () => {
        const groups = [{ name: 'group1' }, { name: 'group2' }];
        expect(userGroupsReducer(
            {
                ...state,
                fetching: true,
                cancelSource: { source: 'fake source' },
            },
            {
                type: types.FETCHED_GROUPS,
                groups,
            },
        )).toEqual({
            ...state,
            fetched: true,
            groups,
        });
    });

    it('FETCH_GROUPS_ERROR', () => {
        const error = 'oh no its an error';
        expect(userGroupsReducer(
            {
                ...state,
                fetching: true,
                cancelSource: { source: 'fake source' },
            },
            {
                type: types.FETCH_GROUPS_ERROR,
                error,
            },
        )).toEqual({
            ...state,
            error,
        });
    });

    it('DELETING_GROUP should return deleting true', () => {
        expect(userGroupsReducer(
            {
                ...state,
            },
            {
                type: types.DELETING_GROUP,
            },
        )).toEqual({
            ...state,
            deleting: true,
        });
    });

    it('DELETED_GROUP should return deleted true', () => {
        expect(userGroupsReducer(
            {
                ...state,
                deleting: true,
            },
            {
                type: types.DELETED_GROUP,
            },
        )).toEqual({
            ...state,
            deleted: true,
        });
    });

    it('DELETE_GROUP_ERROR should should return the error', () => {
        const error = 'oh no its an error';
        expect(userGroupsReducer(
            {
                ...state,
                deleting: true,
            },
            {
                type: types.DELETE_GROUP_ERROR,
                error,
            },
        )).toEqual({
            ...state,
            error,
        });
    });

    it('CREATING_GROUP should return creating true', () => {
        expect(userGroupsReducer(
            {
                ...state,
            },
            {
                type: types.CREATING_GROUP,
            },
        )).toEqual({
            ...state,
            creating: true,
        });
    });

    it('CREATED_GROUP should return created true', () => {
        expect(userGroupsReducer(
            {
                ...state,
                creating: true,
            },
            {
                type: types.CREATED_GROUP,
            },
        )).toEqual({
            ...state,
            created: true,
        });
    });

    it('CREATE_GROUP_ERROR should return the error', () => {
        const error = 'oh no an error';
        expect(userGroupsReducer(
            {
                ...state,
                creating: true,
            },
            {
                type: types.CREATE_GROUP_ERROR,
                error,
            },
        )).toEqual({
            ...state,
            error,
        });
    });

    it('ADDING_GROUP_USERS should return adding true', () => {
        expect(userGroupsReducer(
            {
                ...state,
            },
            {
                type: types.ADDING_GROUP_USERS,
            },
        )).toEqual({
            ...state,
            adding: true,
        });
    });

    it('ADDED_GROUP_USERS should return added true', () => {
        expect(userGroupsReducer(
            {
                ...state,
                adding: true,
            },
            {
                type: types.ADDED_GROUP_USERS,
            },
        )).toEqual({
            ...state,
            added: true,
        });
    });

    it('ADDING_GROUP_USERS_ERROR should return the error', () => {
        const error = 'oh no an error';
        expect(userGroupsReducer(
            {
                ...state,
                adding: true,
            },
            {
                type: types.ADDING_GROUP_USERS_ERROR,
                error,
            },
        )).toEqual({
            ...state,
            error,
        });
    });

    it('REMOVING_GROUP_USERS should return removing true', () => {
        expect(userGroupsReducer(
            {
                ...state,
            },
            {
                type: types.REMOVING_GROUP_USERS,
            },
        )).toEqual({
            ...state,
            removing: true,
        });
    });

    it('REMOVED_GROUP_USERS should return removed true', () => {
        expect(userGroupsReducer(
            {
                ...state,
                removing: true,
            },
            {
                type: types.REMOVED_GROUP_USERS,
            },
        )).toEqual({
            ...state,
            removed: true,
        });
    });

    it('REMOVING_GROUP_USERS_ERROR should return the error', () => {
        const error = 'oh no an error';
        expect(userGroupsReducer(
            {
                ...state,
                removing: true,
            },
            {
                type: types.REMOVING_GROUP_USERS_ERROR,
                error,
            },
        )).toEqual({
            ...state,
            error,
        });
    });
});
