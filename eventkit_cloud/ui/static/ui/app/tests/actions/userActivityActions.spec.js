import sinon from 'sinon';
import * as actions from '../../actions/userActivityActions';
import Normalizer from '../../utils/normalizers';
import * as utils from '../../utils/generic';


const apiPermissions = {
    value: '',
    groups: [],
    members: [],
};

const mockApiJobs = [{
    last_export_run: {
        uid: '123',
        job: { uid: '111', permissions: apiPermissions },
        provider_tasks: [],
    },
},
{
    last_export_run: {
        uid: '456',
        job: { uid: '222', permissions: apiPermissions },
        provider_tasks: [],
    },
}];

const normalizer = new Normalizer();
const run1 = normalizer.normalizeRun(mockApiJobs[0].last_export_run);
const run2 = normalizer.normalizeRun(mockApiJobs[1].last_export_run);


describe('userActivityActions', () => {
    describe('viewedJob action', () => {
        it('should return the correct types', () => {
            expect(actions.viewedJob().types).toEqual([
                actions.types.VIEWED_JOB,
                actions.types.VIEWED_JOB_SUCCESS,
                actions.types.VIEWED_JOB_ERROR,
            ]);
        });

        it('should add jobuid to data and payload', () => {
            const uid = '123';
            const config = actions.viewedJob(uid);
            expect(config.data).toEqual({ job_uid: uid });
            expect(config.payload).toEqual({ jobuid: uid });
        });
    });

    describe('getViewedJobs action', () => {
        it('should return the correct actions', () => {
            expect(actions.getViewedJobs().types).toEqual([
                actions.types.FETCHING_VIEWED_JOBS,
                actions.types.RECEIVED_VIEWED_JOBS,
                actions.types.FETCH_VIEWED_JOBS_ERROR,
            ]);
        });

        it('getCancelSource should return the source', () => {
            const s = { exports: { viewedInfo: { status: { cancelSource: 'test' } } } };
            expect(actions.getViewedJobs().getCancelSource(s)).toEqual('test');
        });

        it('should return pagesize and "viewed" in the params', () => {
            const pageSize = 13;
            expect(actions.getViewedJobs({ pageSize }).params).toEqual({
                page_size: pageSize,
                activity: 'viewed',
                slim: 'true',
            });
        });

        it('onSuccess should return headers and ids in the payload', () => {
            const headerStub = sinon.stub(utils, 'getHeaderPageInfo').returns({
                nextPage: true,
                range: '1-1',
            });
            const ret = {
                data: mockApiJobs,
            };
            expect(actions.getViewedJobs().onSuccess(ret)).toEqual({
                payload: {
                    nextPage: true,
                    range: '1-1',
                    ids: [
                        mockApiJobs[0].last_export_run.uid,
                        mockApiJobs[1].last_export_run.uid,
                    ],
                },
            });
            headerStub.restore();
        });

        it('batchSuccess should return and array of ADD actions', () => {
            const ret = {
                data: mockApiJobs,
            };
            const s = { user: { data: { user: { username: 'test user' } } } };
            expect(actions.getViewedJobs().batchSuccess(ret, s)).toEqual([
                {
                    type: 'ADD_VIEWED_RUN',
                    payload: {
                        id: run1.result,
                        username: 'test user',
                        ...run1.entities,
                    },
                },
                {
                    type: 'ADD_VIEWED_RUN',
                    payload: {
                        id: run2.result,
                        username: 'test user',
                        ...run2.entities,
                    },
                },
            ]);
        });
    });
});
