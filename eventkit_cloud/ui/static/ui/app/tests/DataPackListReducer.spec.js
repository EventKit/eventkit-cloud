import * as reducers from '../reducers/DataPackListReducer';

describe('DataPackList reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.DataPackListReducer(undefined, {})).toEqual(
            {
                fetching: false,
                fetched: false,
                runs: [],
                error: null,
                nextPage: false
            }
        );
    });

    it('should handle FETCHING RUNS', () => {
        expect(reducers.DataPackListReducer(
            {
                fetching: false,
                fetched: false,
                runs: [],
                error: null,
                nextPage: false
            },
            {
                type: 'FETCHING_RUNS'
            }
        )).toEqual(
            {
                fetching: true,
                fetched: false,
                runs: [],
                error: null,
                nextPage: false
            }
        );
    });

    it('should handle RECEIVED_RUNS', () => {
        expect(reducers.DataPackListReducer(
            {
                fetching: true,
                fetched: false,
                runs: [],
                error: null,
                nextPage: false
            },
            {
                type: 'RECEIVED_RUNS', runs: [{thisIs: 'a fake run'}], nextPage: true
            }
        )).toEqual(
            {
                fetching: false,
                fetched: true,
                runs: [{thisIs: 'a fake run'}],
                error: null,
                nextPage: true
            }
        );
    });
    it('should handle FETCH_RUNS_ERROR', () => {
        expect(reducers.DataPackListReducer(
            {
                fetching: true,
                fetched: false,
                runs: [],
                error: null,
                nextPage: false
            },
            {
                type: 'FETCH_RUNS_ERROR', error: 'This is an error message'
            }
        )).toEqual(
            {
                fetching: false,
                fetched: false,
                runs: [],
                error: 'This is an error message',
                nextPage: false
            }
        );
    })
});

describe('DeleteRuns Reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.DeleteRunsReducer(undefined, {})).toEqual(
            {
                deleting: false,
                deleted: false,
                error: null
            }
        );
    });

    it('should handle DELETING_RUN', () => {
        expect(reducers.DeleteRunsReducer(
            {
                deleting: false,
                deleted: false,
                error: null
            },
            {
                type: 'DELETING_RUN'
            }
        )).toEqual(
            {
                deleting: true,
                deleted: false,
                error: null
            }
        );
    });
    it('should handle DELETED_RUN', () => {
        expect(reducers.DeleteRunsReducer(
            {
                deleting: true,
                deleted: false,
                error: null
            },
            {
                type: 'DELETED_RUN'
            }
        )).toEqual(
            {
                deleting: false,
                deleted: true,
                error: null
            }
        );
    });
    it('should handle DELETE_RUN_ERROR', () => {
        expect(reducers.DeleteRunsReducer(
            {
                deleting: true,
                deleted: false,
                error: null
            },
            {
                type: 'DELETE_RUN_ERROR',
                error: 'This is an error'
            }
        )).toEqual(
            {
                deleting: false,
                deleted: false,
                error: 'This is an error'
            }
        );
    });
})