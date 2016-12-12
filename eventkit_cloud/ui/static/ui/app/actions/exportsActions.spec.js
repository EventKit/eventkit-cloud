import * as actions from './exportsActions'

describe('export actions', () => {

    let jobs = {
        uuid: '12345',
        name: 'test-job-name'
    }

    it('loadJobSuccess should create LOAD_JOB_SUCCESS action', () => {
        expect(actions.loadJobsSuccess(jobs)).toEqual({
            type: 'LOAD_JOBS_SUCCESS',
            jobs: jobs,
        })
    })
})