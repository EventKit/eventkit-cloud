import Normalizer from '../utils/normalizers';
import { getHeaderPageInfo } from '../utils/generic';

export const types = {
    FETCHING_VIEWED_JOBS: 'FETCHING_VIEWED_JOBS',
    FETCH_VIEWED_JOBS_ERROR: 'FETCH_VIEWED_JOBS_ERROR',
    RECEIVED_VIEWED_JOBS: 'RECEIVED_VIEWED_JOBS',
    VIEWED_JOB: 'VIEWED_JOB',
    VIEWED_JOB_ERROR: 'VIEWED_JOB_ERROR',
    VIEWED_JOB_SUCCESS: 'VIEWED_JOB_SUCCESS',
};

export function viewedJob(jobuid) {
    return {
        data: { job_uid: jobuid },
        method: 'POST',
        payload: { jobuid },
        types: [
            types.VIEWED_JOB,
            types.VIEWED_JOB_ERROR,
            types.VIEWED_JOB_SUCCESS,
        ],
        url: '/api/user/activity/jobs?activity=viewed',
    };
}

export function getViewedJobs(args = {}) {
    const params = {
        activity: 'viewed',
        page_size: args.pageSize || 12,
        slim: 'true',
    };
    return {
        auto: args.isAuto,
        batchSuccess: (response, state) => {
            const runs = response.data.map((entry) => {
                const run = entry.last_export_run;
                return run;
            });

            const normalizer = new Normalizer();
            const actions = runs.map((run) => {
                const { result, entities } = normalizer.normalizeRun(run);
                return {
                    payload: {
                        id: result,
                        username: state.user.data.user.username,
                        ...entities,
                    },
                    type: 'ADD_VIEWED_RUN',
                };
            });
            return actions;
        },
        cancellable: true,
        getCancelSource: state => state.exports.viewedInfo.status.cancelSource,
        method: 'GET',
        onSuccess: (response) => {
            const { nextPage, range } = getHeaderPageInfo(response);
            const runs = response.data.map((entry) => {
                const run = entry.last_export_run;
                return run;
            });
            return {
                payload: {
                    ids: runs.map(run => run.uid),
                    nextPage,
                    range,
                },
            };
        },
        params,
        types: [
            types.FETCHING_VIEWED_JOBS,
            types.RECEIVED_VIEWED_JOBS,
            types.FETCH_VIEWED_JOBS_ERROR,
        ],
        url: '/api/user/activity/jobs',
    };
}
