import sinon from 'sinon';
import * as actions from '../../actions/userActivityActions';
import Normalizer from '../../utils/normalizers';
import * as utils from '../../utils/generic';


const apiPermissions = {
    groups: [],
    members: [],
    value: '',
};

const mockApiJobs = [{
    last_export_run: {
        job: {
            permissions: apiPermissions,
            uid: '111'
        },
        provider_tasks: [],
        uid: '123',
    },
},
{
    last_export_run: {
        job: {
            permissions: apiPermissions,
            uid: '222'
        },
        provider_tasks: [],
        uid: '456',
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
                actions.types.VIEWED_JOB_ERROR,
                actions.types.VIEWED_JOB_SUCCESS,
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
                activity: 'viewed',
                page_size: pageSize,
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
                    ids: [
                        mockApiJobs[0].last_export_run.uid,
                        mockApiJobs[1].last_export_run.uid,
                    ],
                    nextPage: true,
                    range: '1-1',
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
                    payload: {
                        id: run1.result,
                        username: 'test user',
                        ...run1.entities,
                    },
                    type: 'ADD_VIEWED_RUN',
                },
                {
                    payload: {
                        id: run2.result,
                        username: 'test user',
                        ...run2.entities,
                    },
                    type: 'ADD_VIEWED_RUN',
                },
            ]);
        });
    });
});
