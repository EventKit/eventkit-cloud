import axios from 'axios/index';
import cookie from 'react-cookie';
import Normalizer from '../utils/normalizers';

export const types = {
    VIEWED_JOB: 'VIEWED_JOB',
    VIEWED_JOB_SUCCESS: 'VIEWED_JOB_SUCCESS',
    VIEWED_JOB_ERROR: 'VIEWED_JOB_ERROR',
    FETCHING_VIEWED_JOBS: 'FETCHING_VIEWED_JOBS',
    RECEIVED_VIEWED_JOBS: 'RECEIVED_VIEWED_JOBS',
    FETCH_VIEWED_JOBS_ERROR: 'FETCH_VIEWED_JOBS_ERROR',
};

export function viewedJob(jobuid) {
    return (dispatch) => {
        dispatch({
            type: types.VIEWED_JOB,
            jobuid,
        });

        return axios({
            url: '/api/user/activity/jobs?activity=viewed',
            method: 'POST',
            data: { job_uid: jobuid },
            headers: { 'X-CSRFToken': cookie.load('csrftoken') },
        }).then(() => {
            dispatch({
                type: types.VIEWED_JOB_SUCCESS,
                jobuid,
            });
        }).catch((error) => {
            console.error(error.message);
            dispatch({
                type: types.VIEWED_JOB_ERROR,
                jobuid,
            });
        });
    };
}

export function getViewedJobs(args = {}) {
    return (dispatch, getState) => {
        // Check if we should cancel the previous request due to a user action.
        const state = getState();
        if (state.exports.viewedInfo.status.fetching && state.exports.viewedInfo.status.cancelSource) {
            if (args.isAuto) {
                // Just ignore this request.
                return null;
            }
            // Cancel the last request.
            state.exports.viewedInfo.status.cancelSource.cancel('Request is no longer valid, cancelling.');
        }

        const cancelSource = axios.CancelToken.source();

        dispatch({
            type: types.FETCHING_VIEWED_JOBS,
            cancelSource,
        });

        const params = {
            activity: 'viewed',
            page_size: args.pageSize || 12,
        };

        return axios({
            url: '/api/user/activity/jobs',
            method: 'GET',
            params,
            cancelToken: cancelSource.token,
        }).then((response) => {
            let nextPage = false;
            let links = [];

            if (response.headers.link) {
                links = response.headers.link.split(',');
            }

            links.forEach((link) => {
                if (link.includes('rel="next"')) {
                    nextPage = true;
                }
            });

            let range = '';
            if (response.headers['content-range']) {
                [, range] = response.headers['content-range'].split('-');
            }

            const runs = response.data.map((entry) => {
                const run = entry.last_export_run;
                run.job.permissions = {
                    value: run.job.permissions.value,
                    groups: run.job.permissions.groups,
                    members: run.job.permissions.users,
                };
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

            dispatch([
                {
                    type: types.RECEIVED_VIEWED_JOBS,
                    payload: {
                        nextPage,
                        range,
                        ids: runs.map(run => run.uid),
                    },
                },
                ...actions,
            ]);
        }).catch((error) => {
            if (axios.isCancel(error)) {
                console.log(error.message);
            } else {
                dispatch({
                    type: types.FETCH_VIEWED_JOBS_ERROR,
                    error: error.response.data,
                });
            }
        });
    };
}
