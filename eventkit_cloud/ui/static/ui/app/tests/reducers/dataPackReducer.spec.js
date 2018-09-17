import * as reducers from '../../reducers/datapackReducer';

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
});

describe('featuredRuns reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.featuredRunsReducer(undefined, {})).toEqual({
            fetching: false,
            fetched: false,
            runs: [],
            error: null,
            nextPage: false,
            range: '',
            cancelSource: null,
        });
    });

    it('should handle FETCHING RUNS', () => {
        expect(reducers.featuredRunsReducer(
            {
                fetching: false,
                fetched: false,
                runs: [],
                error: null,
                nextPage: false,
                range: '',
                cancelSource: null,
            },
            {
                type: 'FETCHING_FEATURED_RUNS',
                cancelSource: 'test',
            },
        )).toEqual({
            fetching: true,
            fetched: false,
            runs: [],
            error: null,
            nextPage: false,
            range: '',
            cancelSource: 'test',
        });
    });

    it('should handle RECEIVED_FEATURED_RUNS', () => {
        expect(reducers.featuredRunsReducer(
            {
                fetching: true,
                fetched: false,
                runs: [],
                error: null,
                nextPage: false,
                range: '',
                cancelSource: 'test',
            },
            {
                type: 'RECEIVED_FEATURED_RUNS',
                runs: [{ thisIs: 'a fake run' }],
                nextPage: true,
                range: '12/24',
            },
        )).toEqual({
            fetching: false,
            fetched: true,
            runs: [{ thisIs: 'a fake run' }],
            error: null,
            nextPage: true,
            range: '12/24',
            cancelSource: null,
        });
    });

    it('should handle FETCH_FEATURED_RUNS_ERROR', () => {
        expect(reducers.featuredRunsReducer(
            {
                fetching: true,
                fetched: false,
                runs: [],
                error: null,
                nextPage: false,
                range: '',
                cancelSource: 'test',
            },
            {
                type: 'FETCH_FEATURED_RUNS_ERROR', error: 'This is an error message',
            },
        )).toEqual({
            fetching: false,
            fetched: false,
            runs: [],
            error: 'This is an error message',
            nextPage: false,
            range: '',
            cancelSource: null,
        });
    });
});

describe('dataCartDetails reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.getDatacartDetailsReducer(undefined, {})).toEqual({
            fetching: false,
            fetched: false,
            data: [],
            error: null,
        });
    });

    it('should handle GETTING_DATACART_DETAILS', () => {
        expect(reducers.getDatacartDetailsReducer(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            },
            {
                type: 'GETTING_DATACART_DETAILS',
            },
        )).toEqual({
            fetching: true,
            fetched: false,
            data: [],
            error: null,
        });
    });

    it('should handle DATACART_DETAILS_RECEIVED', () => {
        expect(reducers.getDatacartDetailsReducer(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            },
            {
                type: 'DATACART_DETAILS_RECEIVED', datacartDetails: { data: [{ thisIs: 'a fake datacart' }] },
            },
        )).toEqual({
            fetching: false,
            fetched: true,
            data: [{ thisIs: 'a fake datacart' }],
            error: null,
        });
    });

    it('should handle DATACART_DETAILS_ERROR', () => {
        expect(reducers.getDatacartDetailsReducer(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            },
            {
                type: 'DATACART_DETAILS_ERROR', error: 'This is an error message',
            },
        )).toEqual({
            fetching: false,
            fetched: false,
            data: [],
            error: 'This is an error message',
        });
    });
    it('should handle CLEAR_DATACART_DETAILS', () => {
        expect(reducers.getDatacartDetailsReducer(
            {
                fetching: false,
                fetched: true,
                data: [{ some: 'data' }],
                error: null,
            },
            { type: 'CLEAR_DATACART_DETAILS' },
        )).toEqual({
            fetching: false,
            fetched: false,
            data: [],
            error: null,
        });
    });
});

describe('deleteRun Reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.deleteRunReducer(undefined, {})).toEqual({
            deleting: false,
            deleted: false,
            error: null,
        });
    });

    it('should handle DELETING_RUN', () => {
        expect(reducers.deleteRunReducer(
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
        expect(reducers.deleteRunReducer(
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
        expect(reducers.deleteRunReducer(
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

describe('updateExpiration Reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.updateExpirationReducer(undefined, {})).toEqual({
            updating: false,
            updated: false,
            error: null,
        });
    });

    it('should handle UPDATING_EXPIRATION', () => {
        expect(reducers.updateExpirationReducer(
            {
                updating: false,
                updated: false,
                error: null,
            },
            {
                type: 'UPDATING_EXPIRATION',
            },
        )).toEqual({
            updating: true,
            updated: false,
            error: null,
        });
    });

    it('should handle UPDATE_EXPIRATION_SUCCESS', () => {
        expect(reducers.updateExpirationReducer(
            {
                updating: true,
                updated: false,
                error: null,
            },
            {
                type: 'UPDATE_EXPIRATION_SUCCESS',
            },
        )).toEqual({
            updating: false,
            updated: true,
            error: null,
        });
    });

    it('should handle UPDATE_EXPIRATION_ERROR', () => {
        expect(reducers.updateExpirationReducer(
            {
                updating: true,
                updated: false,
                error: null,
            },
            {
                type: 'UPDATE_EXPIRATION_ERROR',
                error: 'This is an error',
            },
        )).toEqual({
            updating: false,
            updated: false,
            error: 'This is an error',
        });
    });
});
