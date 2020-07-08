import { initialState as state, userGroupsReducer } from '../../reducers/groupReducer';
import { types } from '../../actions/groupActions';

describe('userGroupsReducer', () => {
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
            fetched: false,
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
                total: 12,
                range: '1-12',
                nextPage: true,
            },
        )).toEqual({
            ...state,
            fetching: false,
            fetched: true,
            groups,
            total: 12,
            range: '1-12',
            nextPage: true,
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
            fetched: false,
            fetching: false,
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
            deleted: false,
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
            deleting: false,
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
            deleted: false,
            deleting: false,
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
            created: false,
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
            creating: false,
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
            created: false,
            creating: false,
            error,
        });
    });

    it('UPDATING_GROUP should return updating true', () => {
        expect(userGroupsReducer(
            {
                ...state,
            },
            {
                type: types.UPDATING_GROUP,
            },
        )).toEqual({
            ...state,
            updated: false,
            updating: true,
        });
    });

    it('UPDATED_GROUP should return updated true', () => {
        expect(userGroupsReducer(
            {
                ...state,
                updating: true,
            },
            {
                type: types.UPDATED_GROUP,
            },
        )).toEqual({
            ...state,
            updating: false,
            updated: true,
        });
    });

    it('UPDATING_GROUP_ERROR should return the error', () => {
        const error = 'oh no an error';
        expect(userGroupsReducer(
            {
                ...state,
                updating: true,
            },
            {
                type: types.UPDATING_GROUP_ERROR,
                error,
            },
        )).toEqual({
            ...state,
            updated: false,
            updating: false,
            error,
        });
    });
});
