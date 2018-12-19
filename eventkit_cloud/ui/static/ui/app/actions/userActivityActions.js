import Normalizer from '../utils/normalizers';
import { getHeaderPageInfo } from '../utils/generic';

export const types = {
    VIEWED_JOB: 'VIEWED_JOB',
    VIEWED_JOB_SUCCESS: 'VIEWED_JOB_SUCCESS',
    VIEWED_JOB_ERROR: 'VIEWED_JOB_ERROR',
    FETCHING_VIEWED_JOBS: 'FETCHING_VIEWED_JOBS',
    RECEIVED_VIEWED_JOBS: 'RECEIVED_VIEWED_JOBS',
    FETCH_VIEWED_JOBS_ERROR: 'FETCH_VIEWED_JOBS_ERROR',
};

export function viewedJob(jobuid) {
    return {
        types: [
            types.VIEWED_JOB,
            types.VIEWED_JOB_SUCCESS,
            types.VIEWED_JOB_ERROR,
        ],
        url: '/api/user/activity/jobs?activity=viewed',
        method: 'POST',
        data: { job_uid: jobuid },
        payload: { jobuid },
    };
}

export function getViewedJobs(args = {}) {
    const params = {
        slim: 'true',
        activity: 'viewed',
        page_size: args.pageSize || 12,
    };
    return {
        types: [
            types.FETCHING_VIEWED_JOBS,
            types.RECEIVED_VIEWED_JOBS,
            types.FETCH_VIEWED_JOBS_ERROR,
        ],
        auto: args.isAuto,
        cancellable: true,
        url: '/api/user/activity/jobs',
        method: 'GET',
        params,
        getCancelSource: state => state.exports.viewedInfo.status.cancelSource,
        onSuccess: (response) => {
            const { nextPage, range } = getHeaderPageInfo(response);
            const runs = response.data.map((entry) => {
                const run = entry.last_export_run;
                return run;
            });
            return {
                payload: {
                    nextPage,
                    range,
                    ids: runs.map(run => run.uid),
                },
            };
        },
        batchSuccess: (response, state) => {
            const runs = response.data.map((entry) => {
                const run = entry.last_export_run;
                return run;
            });

            const normalizer = new Normalizer();
            const actions = runs.map((run) => {
                const { result, entities } = normalizer.normalizeRun(run);
                return {
                    type: 'ADD_VIEWED_RUN',
                    payload: {
                        id: result,
                        username: state.user.data.user.username,
                        ...entities,
                    },
                };
            });
            return actions;
        },
    };
}
