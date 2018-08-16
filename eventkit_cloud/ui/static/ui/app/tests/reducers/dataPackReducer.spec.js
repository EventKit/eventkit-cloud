import * as reducers from '../../reducers/dataPackReducer';

describe('DataPackList reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.dataPackReducer(undefined, {})).toEqual({
            fetching: false,
            fetched: false,
            runs: [],
            error: null,
            nextPage: false,
            range: '',
            order: '',
            view: '',
            cancelSource: null,
        });
    });

    it('should handle FETCHING RUNS', () => {
        expect(reducers.dataPackReducer(
            {
                fetching: false,
                fetched: false,
                runs: [],
                error: null,
                nextPage: false,
                range: '',
                order: '',
                view: '',
                cancelSource: null,
            },
            {
                type: 'FETCHING_RUNS',
                cancelSource: 'test',
            },
        )).toEqual({
            fetching: true,
            fetched: false,
            runs: [],
            error: null,
            nextPage: false,
            range: '',
            order: '',
            view: '',
            cancelSource: 'test',
        });
    });

    it('should handle RECEIVED_RUNS', () => {
        expect(reducers.dataPackReducer(
            {
                fetching: true,
                fetched: false,
                runs: [],
                error: null,
                nextPage: false,
                range: '',
                order: '',
                view: '',
                cancelSource: 'test',
            },
            {
                type: 'RECEIVED_RUNS', runs: [{ thisIs: 'a fake run' }], nextPage: true, range: '12/24',
            },
        )).toEqual({
            fetching: false,
            fetched: true,
            runs: [{ thisIs: 'a fake run' }],
            error: null,
            nextPage: true,
            range: '12/24',
            order: '',
            view: '',
            cancelSource: null,
        });
    });

    it('should handle FETCH_RUNS_ERROR', () => {
        expect(reducers.dataPackReducer(
            {
                fetching: true,
                fetched: false,
                runs: [],
                error: null,
                nextPage: false,
                range: '',
                order: '',
                view: '',
                cancelSource: 'test',
            },
            {
                type: 'FETCH_RUNS_ERROR', error: 'This is an error message',
            },
        )).toEqual({
            fetching: false,
            fetched: false,
            runs: [],
            error: 'This is an error message',
            nextPage: false,
            range: '',
            order: '',
            view: '',
            cancelSource: null,
        });
    });

    it('should handle SET_PAGE_ORDER', () => {
        expect(reducers.dataPackReducer(
            {
                fetching: false,
                fetched: false,
                runs: [],
                error: null,
                nextPage: false,
                range: '',
                order: '',
                view: '',
            },
            {
                type: 'SET_PAGE_ORDER', order: 'featured',
            },
        )).toEqual({
            fetching: false,
            fetched: false,
            runs: [],
            error: null,
            nextPage: false,
            range: '',
            order: 'featured',
            view: '',
        });
    });

    it('should handle SET_PAGE_VIEW', () => {
        expect(reducers.dataPackReducer(
            {
                fetching: false,
                fetched: false,
                runs: [],
                error: null,
                nextPage: false,
                range: '',
                order: '',
                view: '',
            },
            {
                type: 'SET_PAGE_VIEW', view: 'map',
            },
        )).toEqual({
            fetching: false,
            fetched: false,
            runs: [],
            error: null,
            nextPage: false,
            range: '',
            order: '',
            view: 'map',
        });
    });
});

describe('DeleteRuns Reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.DeleteRunsReducer(undefined, {})).toEqual({
            deleting: false,
            deleted: false,
            error: null,
        });
    });

    it('should handle DELETING_RUN', () => {
        expect(reducers.DeleteRunsReducer(
            {
                deleting: false,
                deleted: false,
                error: null,
            },
            {
                type: 'DELETING_RUN',
            },
        )).toEqual({
            deleting: true,
            deleted: false,
            error: null,
        });
    });
    it('should handle DELETED_RUN', () => {
        expect(reducers.DeleteRunsReducer(
            {
                deleting: true,
                deleted: false,
                error: null,
            },
            {
                type: 'DELETED_RUN',
            },
        )).toEqual({
            deleting: false,
            deleted: true,
            error: null,
        });
    });
    it('should handle DELETE_RUN_ERROR', () => {
        expect(reducers.DeleteRunsReducer(
            {
                deleting: true,
                deleted: false,
                error: null,
            },
            {
                type: 'DELETE_RUN_ERROR',
                error: 'This is an error',
            },
        )).toEqual({
            deleting: false,
            deleted: false,
            error: 'This is an error',
        });
    });
});
