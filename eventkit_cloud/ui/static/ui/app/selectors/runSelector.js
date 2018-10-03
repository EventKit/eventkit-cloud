import { createSelector } from 'reselect';

const getRun = (state, props) => state.exports.data.runs[props.runId];

const getJobs = state => state.exports.data.jobs;

const getProviderTasks = state => state.exports.data.provider_tasks;

const getExportTasks = state => state.exports.data.tasks;

const getRunProviderTasks = () => createSelector(
    [getRun, getProviderTasks],
    (run, providerTasks) => run.provider_tasks.map(id => providerTasks[id]),
);

const getJob = createSelector(
    [getRun, getJobs],
    (run, jobs) => jobs[run.job],
);

export const makeFullRunSelector = () => createSelector(
    [getRun, getJob, getRunProviderTasks()],
    (run, job, providerTasks) => ({
        ...run,
        job,
        provider_task: providerTasks,
    }),
);
