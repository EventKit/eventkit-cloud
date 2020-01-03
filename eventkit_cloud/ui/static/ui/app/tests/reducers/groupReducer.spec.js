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
                cancelSource,
                type: types.FETCHING_GROUPS,
            },
        )).toEqual({
            ...state,
            cancelSource,
            fetched: false,
            fetching: true,
        });
    });

    it('FETCHED_GROUPS should return fetched true and the groups', () => {
        const groups = [{ name: 'group1' }, { name: 'group2' }];
        expect(userGroupsReducer(
            {
                ...state,
                cancelSource: { source: 'fake source' },
                fetching: true,
            },
            {
                groups,
                nextPage: true,
                range: '1-12',
                total: 12,
                type: types.FETCHED_GROUPS,
            },
        )).toEqual({
            ...state,
            fetched: true,
            fetching: false,
            groups,
            nextPage: true,
            range: '1-12',
            total: 12,
        });
    });

    it('FETCH_GROUPS_ERROR', () => {
        const error = 'oh no its an error';
        expect(userGroupsReducer(
            {
                ...state,
                cancelSource: { source: 'fake source' },
                fetching: true,
            },
            {
                error,
                type: types.FETCH_GROUPS_ERROR,
            },
        )).toEqual({
            ...state,
            error,
            fetched: false,
            fetching: false,
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
            deleted: true,
            deleting: false,
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
                error,
                type: types.DELETE_GROUP_ERROR,
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
            created: true,
            creating: false,
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
                error,
                type: types.CREATE_GROUP_ERROR,
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
            updated: true,
            updating: false,
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
                error,
                type: types.UPDATING_GROUP_ERROR,
            },
        )).toEqual({
            ...state,
            error,
            updated: false,
            updating: false,
        });
    });
});
