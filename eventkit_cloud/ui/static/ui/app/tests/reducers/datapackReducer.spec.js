import * as reducers from '../../reducers/datapackReducer';

describe('Runs reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.runsReducer(undefined, {})).toEqual({ ...reducers.exports });
    });

    describe('When handling ADD run data', () => {
        it('handles ADD_RUN', () => {
            expect(reducers.runsReducer(
                { ...reducers.exports },
                {
                    payload: {
                        id: '1234',
                        jobs: { 1234: { uid: '1234' } },
                        provider_tasks: { 1234: { uid: '1234' } },
                        runs: { 1234: { uid: '1234', user: 'test' } },
                        tasks: { 1234: { uid: '1234' } },
                        username: 'test',
                    },
                    type: 'ADD_RUN',
                },
            )).toEqual({
                ...reducers.exports,
                allInfo: {
                    ...reducers.exports.allInfo,
                    ids: ['1234'],
                },
                data: {
                    ...reducers.exports.data,
                    jobs: {
                        1234: { uid: '1234' },
                    },
                    provider_tasks: {
                        1234: { uid: '1234' },
                    },
                    runs: {
                        1234: { uid: '1234', user: 'test' },
                    },
                    tasks: {
                        1234: { uid: '1234' },
                    },
                },
                ownInfo: {
                    ids: ['1234'],
                },
            });
        });
    });

    describe('When handling standard RUNS', () => {
        it('should handle FETCHING RUNS', () => {
            expect(reducers.runsReducer(
                { ...reducers.exports },
                {
                    cancelSource: 'test',
                    type: 'FETCHING_RUNS',
                },
            )).toEqual({
                ...reducers.exports,
                allInfo: {
                    ...reducers.exports.allInfo,
                    status: {
                        ...reducers.exports.allInfo.status,
                        cancelSource: 'test',
                        fetching: true,
                    },
                },
            });
        });

        it('should handle RECEIVED_RUNS', () => {
            expect(reducers.runsReducer(
                { ...reducers.exports },
                {
                    payload: {
                        nextPage: true,
                        orderedIds: ['1', '2'],
                        range: '12/24',
                    },
                    type: 'RECEIVED_RUNS',
                },
            )).toEqual({
                ...reducers.exports,
                allInfo: {
                    ...reducers.exports.allInfo,
                    meta: {
                        ...reducers.exports.allInfo.meta,
                        nextPage: true,
                        range: '12/24',
                    },
                    status: {
                        ...reducers.exports.allInfo.status,
                        fetched: true,
                        fetching: false,
                    },
                },
                orderedIds: ['1', '2'],
            });
        });

        it('should handle FETCH_RUNS_ERROR', () => {
            expect(reducers.runsReducer(
                { ...reducers.exports },
                {
                    error: 'This is an error message',
                    type: 'FETCH_RUNS_ERROR',
                },
            )).toEqual({
                ...reducers.exports,
                allInfo: {
                    ...reducers.exports.allInfo,
                    status: {
                        ...reducers.exports.allInfo.status,
                        error: 'This is an error message',
                        fetched: false,
                        fetching: false,
                    },
                },
            });
        });
    });

    describe('When handling FEATURED RUNS', () => {
        it('should handle FETCHING RUNS', () => {
            expect(reducers.runsReducer(
                { ...reducers.exports },
                {
                    cancelSource: 'test',
                    type: 'FETCHING_FEATURED_RUNS',
                },
            )).toEqual({
                ...reducers.exports,
                featuredInfo: {
                    ...reducers.exports.featuredInfo,
                    status: {
                        ...reducers.exports.featuredInfo.status,
                        cancelSource: 'test',
                        fetching: true,
                    },
                },
            });
        });

        it('should handle RECEIVED_RUNS', () => {
            expect(reducers.runsReducer(
                { ...reducers.exports },
                {
                    payload: {
                        ids: ['1', '2'],
                        nextPage: true,
                        range: '12/24',
                    },
                    type: 'RECEIVED_FEATURED_RUNS',
                },
            )).toEqual({
                ...reducers.exports,
                featuredInfo: {
                    ...reducers.exports.featuredInfo,
                    ids: ['1', '2'],
                    meta: {
                        ...reducers.exports.featuredInfo.meta,
                        nextPage: true,
                        range: '12/24',
                    },
                    status: {
                        ...reducers.exports.featuredInfo.status,
                        fetched: true,
                        fetching: false,
                    },
                },
            });
        });

        it('should handle FETCH_RUNS_ERROR', () => {
            expect(reducers.runsReducer(
                { ...reducers.exports },
                {
                    error: 'This is an error message',
                    type: 'FETCH_FEATURED_RUNS_ERROR',
                },
            )).toEqual({
                ...reducers.exports,
                featuredInfo: {
                    ...reducers.exports.featuredInfo,
                    status: {
                        ...reducers.exports.featuredInfo.status,
                        error: 'This is an error message',
                        fetched: false,
                        fetching: false,
                    },
                },
            });
        });
    });

    describe('When handling VIEWD RUNS', () => {
        it('should handle FETCHING VIEWED JOBS', () => {
            expect(reducers.runsReducer(
                { ...reducers.exports },
                {
                    cancelSource: 'test',
                    type: 'FETCHING_VIEWED_JOBS',
                },
            )).toEqual({
                ...reducers.exports,
                viewedInfo: {
                    ...reducers.exports.viewedInfo,
                    status: {
                        ...reducers.exports.viewedInfo.status,
                        cancelSource: 'test',
                        fetching: true,
                    },
                },
            });
        });

        it('should handle RECEIVED_VIEWED_JOBS', () => {
            expect(reducers.runsReducer(
                { ...reducers.exports },
                {
                    payload: {
                        ids: ['1', '2'],
                        nextPage: true,
                        range: '12/24',
                    },
                    type: 'RECEIVED_VIEWED_JOBS',
                },
            )).toEqual({
                ...reducers.exports,
                viewedInfo: {
                    ...reducers.exports.viewedInfo,
                    ids: ['1', '2'],
                    meta: {
                        ...reducers.exports.viewedInfo.meta,
                        nextPage: true,
                        range: '12/24',
                    },
                    status: {
                        ...reducers.exports.viewedInfo.status,
                        fetched: true,
                        fetching: false,
                    },
                },
            });
        });

        it('should handle FETCH_VIEWED_JOBS_ERROR', () => {
            expect(reducers.runsReducer(
                { ...reducers.exports },
                {
                    error: 'This is an error message',
                    type: 'FETCH_VIEWED_JOBS_ERROR',
                },
            )).toEqual({
                ...reducers.exports,
                viewedInfo: {
                    ...reducers.exports.viewedInfo,
                    status: {
                        ...reducers.exports.viewedInfo.status,
                        error: 'This is an error message',
                        fetched: false,
                        fetching: false,
                    },
                },
            });
        });
    });
});

describe('dataCartDetails reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.getDatacartDetailsReducer(undefined, {})).toEqual({
            ids: [],
            status: {
                error: null,
                fetched: false,
                fetching: false,
            },
        });
    });

    it('should handle GETTING_DATACART_DETAILS', () => {
        expect(reducers.getDatacartDetailsReducer(
            reducers.initialState.datacartDetails,
            {
                type: 'GETTING_DATACART_DETAILS',
            },
        )).toEqual({
            ids: [],
            status: {
                error: null,
                fetched: false,
                fetching: true,
            },
        });
    });

    it('should handle DATACART_DETAILS_RECEIVED', () => {
        expect(reducers.getDatacartDetailsReducer(
            reducers.initialState.datacartDetails,
            {
                ids: ['1', '2'],
                type: 'DATACART_DETAILS_RECEIVED',
            },
        )).toEqual({
            ids: ['1', '2'],
            status: {
                error: null,
                fetched: true,
                fetching: false,
            },
        });
    });

    it('should handle DATACART_DETAILS_ERROR', () => {
        expect(reducers.getDatacartDetailsReducer(
            reducers.initialState.datacartDetails,
            {
                error: 'This is an error message',
                type: 'DATACART_DETAILS_ERROR',
            },
        )).toEqual({
            ids: [],
            status: {
                error: 'This is an error message',
                fetched: false,
                fetching: false,
            },
        });
    });
    it('should handle CLEAR_DATACART_DETAILS', () => {
        expect(reducers.getDatacartDetailsReducer(
            reducers.initialState.datacartDetails,
            { type: 'CLEAR_DATACART_DETAILS' },
        )).toEqual(reducers.initialState.datacartDetails);
    });
});

describe('deleteRun Reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.deleteRunReducer(undefined, {})).toEqual({
            deleted: false,
            deleting: false,
            error: null,
        });
    });

    it('should handle DELETING_RUN', () => {
        expect(reducers.deleteRunReducer(
            {
                deleted: false,
                deleting: false,
                error: null,
            },
            {
                type: 'DELETING_RUN',
            },
        )).toEqual({
            deleted: false,
            deleting: true,
            error: null,
        });
    });

    it('should handle DELETED_RUN', () => {
        expect(reducers.deleteRunReducer(
            {
                deleted: false,
                deleting: true,
                error: null,
            },
            {
                type: 'DELETED_RUN',
            },
        )).toEqual({
            deleted: true,
            deleting: false,
            error: null,
        });
    });

    it('should handle DELETE_RUN_ERROR', () => {
        expect(reducers.deleteRunReducer(
            {
                deleted: false,
                deleting: true,
                error: null,
            },
            {
                error: 'This is an error',
                type: 'DELETE_RUN_ERROR',
            },
        )).toEqual({
            deleted: false,
            deleting: false,
            error: 'This is an error',
        });
    });
});

describe('updateExpiration Reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.updateExpirationReducer(undefined, {})).toEqual({
            error: null,
            updated: false,
            updating: false,
        });
    });

    it('should handle UPDATING_EXPIRATION', () => {
        expect(reducers.updateExpirationReducer(
            {
                error: null,
                updated: false,
                updating: false,
            },
            {
                type: 'UPDATING_EXPIRATION',
            },
        )).toEqual({
            error: null,
            updated: false,
            updating: true,
        });
    });

    it('should handle UPDATE_EXPIRATION_SUCCESS', () => {
        expect(reducers.updateExpirationReducer(
            {
                error: null,
                updated: false,
                updating: true,
            },
            {
                type: 'UPDATE_EXPIRATION_SUCCESS',
            },
        )).toEqual({
            error: null,
            updated: true,
            updating: false,
        });
    });

    it('should handle UPDATE_EXPIRATION_ERROR', () => {
        expect(reducers.updateExpirationReducer(
            {
                error: null,
                updated: false,
                updating: true,
            },
            {
                error: 'This is an error',
                type: 'UPDATE_EXPIRATION_ERROR',
            },
        )).toEqual({
            error: 'This is an error',
            updated: false,
            updating: false,
        });
    });
});
