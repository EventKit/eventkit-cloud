import * as reducers from '../../reducers/userActivityReducer';
import { types } from '../../actions/userActivityActions';

const initialState = { userActivity: reducers.initialState };

describe('userActivityReducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.userActivityReducer(undefined, {})).toEqual(initialState.userActivity);
    });

    it('should handle FETCHING_VIEWED_JOBS', () => {
        const action = {
            type: types.FETCHING_VIEWED_JOBS,
            cancelSource: 'test',
        };

        expect(reducers.userActivityReducer(initialState.userActivity, action)).toEqual({
            ...initialState.userActivity,
            viewedJobs: {
                ...initialState.userActivity.viewedJobs,
                fetching: true,
                fetched: false,
                error: null,
                cancelSource: action.cancelSource,
            },
        });
    });

    it('should handle RECEIVED_VIEWED_JOBS', () => {
        const state = {
            ...initialState.userActivity,
            viewedJobs: {
                ...initialState.viewedJobs,
                fetching: true,
                cancelSource: 'test',
            },
        };
        const action = {
            type: types.RECEIVED_VIEWED_JOBS,
            viewedJobs: [
                { id: '1' },
                { id: '2' },
            ],
            nextPage: true,
            range: '12/24',
        };

        expect(reducers.userActivityReducer(state, action)).toEqual({
            ...state,
            viewedJobs: {
                ...state.viewedJobs,
                fetching: false,
                fetched: true,
                viewedJobs: action.viewedJobs,
                nextPage: action.nextPage,
                range: action.range,
                error: action.error,
                cancelSource: null,
            },
        });
    });

    it('should handle FETCH_VIEWED_JOBS_ERROR', () => {
        const state = {
            ...initialState.userActivity,
            viewedJobs: {
                ...initialState.viewedJobs,
                fetching: true,
                cancelSource: 'test',
            },
        };
        const action = {
            type: types.FETCH_VIEWED_JOBS_ERROR,
            error: 'oh no an error',
        };

        expect(reducers.userActivityReducer(state, action)).toEqual({
            ...state,
            viewedJobs: {
                ...state.viewedJobs,
                fetching: false,
                fetched: false,
                error: action.error,
                cancelSource: null,
            },
        });
    });

    it('should handle USER_LOGGED_OUT', () => {
        const state = {
            ...initialState.userActivity,
            viewedJobs: {
                ...initialState.viewedJobs,
                fetched: true,
                viewedJobs: [
                    { id: '1' },
                    { id: '2' },
                ],
            },
        };
        const action = {
            type: types.USER_LOGGED_OUT,
        };

        expect(reducers.userActivityReducer(state, action)).toEqual(initialState.userActivity);
    });
});
