import sinon from 'sinon';
import * as actions from '../../actions/datapackActions';
import Normalizer from '../../utils/normalizers';
import * as utils from '../../utils/generic';

const getRun = () => ({
    uid: '6870234f-d876-467c-a332-65fdf0399a0d',
    url: 'http://cloud.eventkit.test/api/runs/6870234f-d876-467c-a332-65fdf0399a0d',
    started_at: '2017-03-10T15:52:35.637331Z',
    finished_at: '2017-03-10T15:52:39.837Z',
    user: 'admin',
    status: 'COMPLETED',
    job: {
        uid: '7643f806-1484-4446-b498-7ddaa65d011a',
        name: 'Test1',
        event: 'Test1 event',
        description: 'Test1 description',
        url: 'http://cloud.eventkit.test/api/jobs/7643f806-1484-4446-b498-7ddaa65d011a',
        permissions: {
            value: 'PRIVATE',
            groups: {},
            members: {},
        },
    },
    expiration: '2017-03-24T15:52:35.637258Z',
});

const getApiRun = () => ({
    uid: '6870234f-d876-467c-a332-65fdf0399a0d',
    url: 'http://cloud.eventkit.test/api/runs/6870234f-d876-467c-a332-65fdf0399a0d',
    started_at: '2017-03-10T15:52:35.637331Z',
    finished_at: '2017-03-10T15:52:39.837Z',
    user: 'admin',
    status: 'COMPLETED',
    job: {
        uid: '7643f806-1484-4446-b498-7ddaa65d011a',
        name: 'Test1',
        event: 'Test1 event',
        description: 'Test1 description',
        url: 'http://cloud.eventkit.test/api/jobs/7643f806-1484-4446-b498-7ddaa65d011a',
        permissions: {
            value: 'PRIVATE',
            groups: {},
            members: {},
        },
    },
    expiration: '2017-03-24T15:52:35.637258Z',
});

const normalizer = new Normalizer();
const normalRun = normalizer.normalizeRun(getRun());

describe('DataPackList actions', () => {
    describe('getDatacartDetails action', () => {
        it('should return the correct types', () => {
            expect(actions.getDatacartDetails('').types).toEqual([
                actions.types.GETTING_DATACART_DETAILS,
                actions.types.DATACART_DETAILS_RECEIVED,
                actions.types.DATACART_DETAILS_ERROR,
            ]);
        });

        it('onSuccess should return just first run ids', () => {
            const rep = { data: [{ uid: '1' }, { uid: '2' }] };
            expect(actions.getDatacartDetails('').onSuccess(rep)).toEqual({
                ids: ['1'],
            });
        });

        it('batchSuccess should return an array of add actions with usernames', () => {
            const rep = { data: [getApiRun()] };
            const state = { user: { data: { user: { username: 'test' } } } };
            expect(actions.getDatacartDetails('').batchSuccess(rep, state)).toEqual([
                {
                    type: 'ADD_RUN',
                    payload: {
                        id: normalRun.result,
                        username: 'test',
                        ...normalRun.entities,
                    },
                },
            ]);
        });
    });

    describe('getRuns action', () => {
        it('should have the correct types', () => {
            expect(actions.getRuns({}).types).toEqual([
                actions.types.FETCHING_RUNS,
                actions.types.RECEIVED_RUNS,
                actions.types.FETCH_RUNS_ERROR,
            ]);
        });

        it('should pass in the correct params', () => {
            const args = {
                status: { a: '1', b: '2' },
                providers: { provider_one: {}, provider_two: {} },
                page_size: 11,
                ordering: 'featured',
                ownerFilter: 'test_user',
                minDate: 'minDate',
                maxDate: 'maxDate',
                search: 'search_query',
            };
            const params = {
                status: 'A,B',
                providers: 'provider_one,provider_two',
                page_size: 11,
                ordering: 'featured,-started_at',
                user: 'test_user',
                min_date: args.minDate,
                max_date: args.maxDate,
                search_term: args.search,
                slim: 'true',
            };
            expect(actions.getRuns(args).params).toEqual(params);
        });

        it('should pass in the correct data', () => {
            const args = {
                geojson: {
                    feature: 'feature',
                },
                permissions: {
                    members: { one: 'ADMIN' },
                    groups: { two: 'ADMIN' },
                    value: 'SHARED',
                },
            };
            const data = {
                geojson: JSON.stringify(args.geojson),
                permissions: {
                    members: Object.keys(args.permissions.members),
                    groups: Object.keys(args.permissions.groups),
                },
            };
            expect(actions.getRuns(args).data).toEqual(data);
        });

        it('getCancelSource should return source', () => {
            const state = { exports: { allInfo: { status: { cancelSource: 'test' } } } };
            expect(actions.getRuns({}).getCancelSource(state)).toEqual('test');
        });

        it('onSuccess should return the correct payload', () => {
            const getStub = sinon.stub(utils, 'getHeaderPageInfo').returns({ nextPage: true, range: '1-1' });
            const rep = { data: [getApiRun()] };
            expect(actions.getRuns({}).onSuccess(rep)).toEqual({
                payload: {
                    range: '1-1',
                    nextPage: true,
                    orderedIds: [getApiRun().uid],
                },
            });
            expect(getStub.calledOnce).toBe(true);
            getStub.restore();
        });

        it('batchSuccess should return an array with add run and username', () => {
            const rep = { data: [getApiRun()] };
            const state = { user: { data: { user: { username: 'test' } } } };
            expect(actions.getRuns({}).batchSuccess(rep, state)).toEqual([
                {
                    type: 'ADD_RUN',
                    payload: {
                        id: normalRun.result,
                        username: 'test',
                        ...normalRun.entities,
                    },
                },
            ]);
        });
    });

    describe('getFeaturedRuns action', () => {
        it('should have the correct types', () => {
            expect(actions.getFeaturedRuns({}).types).toEqual([
                actions.types.FETCHING_FEATURED_RUNS,
                actions.types.RECEIVED_FEATURED_RUNS,
                actions.types.FETCH_FEATURED_RUNS_ERROR,
            ]);
        });

        it('getCancelSource should return source', () => {
            const state = { exports: { featuredInfo: { status: { cancelSource: 'test' } } } };
            expect(actions.getFeaturedRuns({}).getCancelSource(state)).toEqual('test');
        });

        it('onSuccess should return the correct payload', () => {
            const getStub = sinon.stub(utils, 'getHeaderPageInfo').returns({ nextPage: true, range: '1-1' });
            const rep = { data: [getApiRun()] };
            expect(actions.getFeaturedRuns({}).onSuccess(rep)).toEqual({
                payload: {
                    range: '1-1',
                    nextPage: true,
                    ids: [getApiRun().uid],
                },
            });
            expect(getStub.calledOnce).toBe(true);
            getStub.restore();
        });

        it('batchSuccess should return an array with add run and username', () => {
            const rep = { data: [getApiRun()] };
            const state = { user: { data: { user: { username: 'test' } } } };
            expect(actions.getFeaturedRuns({}).batchSuccess(rep, state)).toEqual([
                {
                    type: 'ADD_FEATURED_RUN',
                    payload: {
                        id: normalRun.result,
                        username: 'test',
                        ...normalRun.entities,
                    },
                },
            ]);
        });
    });

    describe('deleteRun action', () => {
        it('should have the correct types', () => {
            expect(actions.deleteRun('123').types).toEqual([
                actions.types.DELETING_RUN,
                actions.types.DELETED_RUN,
                actions.types.DELETE_RUN_ERROR,
            ]);
        });

        it('onSuccess should return the correct payload', () => {
            expect(actions.deleteRun('123').onSuccess()).toEqual({
                payload: {
                    id: '123',
                },
            });
        });
    });

    describe('updateExpiration action', () => {
        it('should have the correct types', () => {
            expect(actions.updateExpiration('123', '').types).toEqual([
                actions.types.UPDATING_EXPIRATION,
                actions.types.UPDATE_EXPIRATION_SUCCESS,
                actions.types.UPDATE_EXPIRATION_ERROR,
            ]);
        });
    });

    it('clearDataCartDetails should return CLEAR_DATACART_DETAILS', () => {
        expect(actions.clearDataCartDetails()).toEqual({ type: actions.types.CLEAR_DATACART_DETAILS });
    });
});

