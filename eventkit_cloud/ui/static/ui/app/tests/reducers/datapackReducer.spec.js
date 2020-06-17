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
                    type: 'ADD_RUN',
                    payload: {
                        id: '1234',
                        runs: { 1234: { uid: '1234', user: 'test' } },
                        jobs: { 1234: { uid: '1234' } },
                        provider_tasks: { 1234: { uid: '1234' } },
                        tasks: { 1234: { uid: '1234' } },
                        username: 'test',
                    },
                },
            )).toEqual({
                ...reducers.exports,
                data: {
                    ...reducers.exports.data,
                    runs: {
                        1234: { uid: '1234', user: 'test' },
                    },
                    jobs: {
                        1234: { uid: '1234' },
                    },
                    provider_tasks: {
                        1234: { uid: '1234' },
                    },
                    tasks: {
                        1234: { uid: '1234' },
                    },
                },
                allInfo: {
                    ...reducers.exports.allInfo,
                    ids: ['1234'],
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
                    type: 'FETCHING_RUNS',
                    cancelSource: 'test',
                },
            )).toEqual({
                ...reducers.exports,
                allInfo: {
                    ...reducers.exports.allInfo,
                    status: {
                        ...reducers.exports.allInfo.status,
                        fetching: true,
                        fetched: false,
                        error: null,
                        cancelSource: 'test',
                    },
                },
            });
        });

        it('should handle RECEIVED_RUNS', () => {
            expect(reducers.runsReducer(
                { ...reducers.exports },
                {
                    type: 'RECEIVED_RUNS',
                    payload: {
                        orderedIds: ['1', '2'],
                        nextPage: true,
                        range: '12/24',
                    },
                },
            )).toEqual({
                ...reducers.exports,
                orderedIds: ['1', '2'],
                allInfo: {
                    ...reducers.exports.allInfo,
                    status: {
                        ...reducers.exports.allInfo.status,
                        fetched: true,
                        fetching: false,
                    },
                    meta: {
                        ...reducers.exports.allInfo.meta,
                        nextPage: true,
                        range: '12/24',
                    },
                },
            });
        });

        it('should handle FETCH_RUNS_ERROR', () => {
            expect(reducers.runsReducer(
                { ...reducers.exports },
                {
                    type: 'FETCH_RUNS_ERROR', error: 'This is an error message',
                },
            )).toEqual({
                ...reducers.exports,
                allInfo: {
                    ...reducers.exports.allInfo,
                    status: {
                        ...reducers.exports.allInfo.status,
                        fetched: false,
                        fetching: false,
                        orderedIds: [],
                        range: '',
                        nextPage: false,
                        error: 'This is an error message',
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
                    type: 'FETCHING_FEATURED_RUNS',
                    cancelSource: 'test',
                },
            )).toEqual({
                ...reducers.exports,
                featuredInfo: {
                    ...reducers.exports.featuredInfo,
                    status: {
                        ...reducers.exports.featuredInfo.status,
                        fetching: true,
                        fetched: false,
                        error: null,
                        cancelSource: 'test',
                    },
                },
            });
        });

        it('should handle RECEIVED_RUNS', () => {
            expect(reducers.runsReducer(
                { ...reducers.exports },
                {
                    type: 'RECEIVED_FEATURED_RUNS',
                    payload: {
                        ids: ['1', '2'],
                        nextPage: true,
                        range: '12/24',
                    },
                },
            )).toEqual({
                ...reducers.exports,
                featuredInfo: {
                    ...reducers.exports.featuredInfo,
                    ids: ['1', '2'],
                    status: {
                        ...reducers.exports.featuredInfo.status,
                        fetched: true,
                        fetching: false,
                    },
                    meta: {
                        ...reducers.exports.featuredInfo.meta,
                        nextPage: true,
                        range: '12/24',
                    },
                },
            });
        });

        it('should handle FETCH_RUNS_ERROR', () => {
            expect(reducers.runsReducer(
                { ...reducers.exports },
                {
                    type: 'FETCH_FEATURED_RUNS_ERROR', error: 'This is an error message',
                },
            )).toEqual({
                ...reducers.exports,
                featuredInfo: {
                    ...reducers.exports.featuredInfo,
                    status: {
                        ...reducers.exports.featuredInfo.status,
                        fetched: false,
                        fetching: false,
                        orderedIds: [],
                        range: '',
                        nextPage: false,
                        error: 'This is an error message',
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
                    type: 'FETCHING_VIEWED_JOBS',
                    cancelSource: 'test',
                },
            )).toEqual({
                ...reducers.exports,
                viewedInfo: {
                    ...reducers.exports.viewedInfo,
                    status: {
                        ...reducers.exports.viewedInfo.status,
                        fetching: true,
                        fetched: false,
                        error: null,
                        cancelSource: 'test',
                    },
                },
            });
        });

        it('should handle RECEIVED_VIEWED_JOBS', () => {
            expect(reducers.runsReducer(
                { ...reducers.exports },
                {
                    type: 'RECEIVED_VIEWED_JOBS',
                    payload: {
                        ids: ['1', '2'],
                        nextPage: true,
                        range: '12/24',
                    },
                },
            )).toEqual({
                ...reducers.exports,
                viewedInfo: {
                    ...reducers.exports.viewedInfo,
                    ids: ['1', '2'],
                    status: {
                        ...reducers.exports.viewedInfo.status,
                        fetched: true,
                        fetching: false,
                    },
                    meta: {
                        ...reducers.exports.viewedInfo.meta,
                        nextPage: true,
                        range: '12/24',
                    },
                },
            });
        });

        it('should handle FETCH_VIEWED_JOBS_ERROR', () => {
            expect(reducers.runsReducer(
                { ...reducers.exports },
                {
                    type: 'FETCH_VIEWED_JOBS_ERROR', error: 'This is an error message',
                },
            )).toEqual({
                ...reducers.exports,
                viewedInfo: {
                    ...reducers.exports.viewedInfo,
                    status: {
                        ...reducers.exports.viewedInfo.status,
                        fetched: false,
                        fetching: false,
                        orderedIds: [],
                        range: '',
                        nextPage: false,
                        error: 'This is an error message',
                    },
                },
            });
        });
    });
});

describe('dataCartDetails reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.getDatacartDetailsReducer(undefined, {})).toEqual({
            status: {
                fetching: false,
                fetched: false,
                error: null,
            },
            ids: [],
        });
    });

    it('should handle GETTING_DATACART_DETAILS', () => {
        expect(reducers.getDatacartDetailsReducer(
            reducers.initialState.datacartDetails,
            {
                type: 'GETTING_DATACART_DETAILS',
            },
        )).toEqual({
            status: {
                fetching: true,
                fetched: false,
                error: null,
            },
            ids: [],
        });
    });

    it('should handle DATACART_DETAILS_RECEIVED', () => {
        expect(reducers.getDatacartDetailsReducer(
            reducers.initialState.datacartDetails,
            {
                type: 'DATACART_DETAILS_RECEIVED',
                ids: ['1', '2'],
            },
        )).toEqual({
            status: {
                fetching: false,
                fetched: true,
                error: null,
            },
            ids: ['1', '2'],
        });
    });

    it('should handle DATACART_DETAILS_ERROR', () => {
        expect(reducers.getDatacartDetailsReducer(
            reducers.initialState.datacartDetails,
            {
                type: 'DATACART_DETAILS_ERROR', error: 'This is an error message',
            },
        )).toEqual({
            status: {
                fetching: false,
                fetched: false,
                error: 'This is an error message',
            },
            ids: [],
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
