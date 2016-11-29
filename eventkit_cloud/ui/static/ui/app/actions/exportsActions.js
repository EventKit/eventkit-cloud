import {Config} from '../config'
import * as types from './actionTypes'
import ExportApi from '../api/ExportsApi';

export function loadJobsSuccess(jobs) {
    return {type: types.LOAD_JOBS_SUCCESS, jobs};
}


export function loadExports() {

    // make async call to api, handle promise, dispatch action when promise is resolved
    return function(dispatch) {
        return ExportApi.getAllJobs().then(jobs => {
            dispatch(loadJobsSuccess(jobs));
        }).catch(error => {
            throw(error);
        });
    };
}



