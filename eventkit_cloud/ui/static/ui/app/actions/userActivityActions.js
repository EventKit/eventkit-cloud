import axios from 'axios/index';
import cookie from 'react-cookie';
import actions from './actionTypes';

export function viewedJob(jobuid) {
    return (dispatch) => {
        dispatch({
            type: actions.VIEWED_JOB,
            jobuid: jobuid,
        });

        return axios({
            url: '/api/user/activity/jobs?activity=viewed',
            method: 'POST',
            data: { job_uid: jobuid },
            headers: { 'X-CSRFToken': cookie.load('csrftoken') }
        }).then(() => {
            dispatch({
                type: actions.VIEWED_JOB_SUCCESS,
                jobuid: jobuid,
            });
        }).catch((error) => {
            console.error(error.message);
            dispatch({
                type: actions.VIEWED_JOB_ERROR,
                jobuid: jobuid,
            });
        });
    };
}

export function getViewedJobs(args = {}) {
    return (dispatch, getState) => {
        // Check if we should cancel the previous request due to a user action.
        const state = getState();
        if (state.userActivity.viewedJobs.fetching && state.userActivity.viewedJobs.cancelSource) {
            if (args.isAuto) {
                // Just ignore this request.
                return null;
            } else {
                // Cancel the last request.
                state.userActivity.viewedJobs.cancelSource.cancel('Request is no longer valid, cancelling.');
            }
        }

        const cancelSource = axios.CancelToken.source();

        dispatch({
            type: actions.FETCHING_VIEWED_JOBS,
            cancelSource: cancelSource,
        });

        const pageSize = args.pageSize || 10;

        return axios({
            url: `/api/user/activity/jobs?activity=viewed&page_size=${pageSize}`,
            method: 'GET',
            cancelToken: cancelSource.token,
        }).then((response) => {
            let nextPage = false;
            let links = [];

            if (response.headers.link) {
                links = response.headers.link.split(',');
            }
            for (const i in links) {
                if (links[i].includes('rel="next"')) {
                    nextPage = true;
                }
            }
            let range = '';
            if (response.headers['content-range']) {
                range = response.headers['content-range'].split('-')[1];
            }

            const viewedJobs = response.data.map((viewedJob) => {
                const newViewedJob = { ...viewedJob };
                const run = newViewedJob.last_export_run;
                run.job.permissions = {
                    value: run.job.visibility,
                    groups: run.job.permissions.groups,
                    members: run.job.permissions.users,
                };
                return newViewedJob;
            });

            dispatch({
                type: actions.RECEIVED_VIEWED_JOBS,
                viewedJobs,
                nextPage,
                range,
            });
        }).catch((error) => {
            if (axios.isCancel(error)) {
                console.log(error.message);
            } else {
                dispatch({
                    type: actions.FETCH_VIEWED_JOBS_ERROR,
                    error: error.response.data,
                });
            }
        });
    }
}