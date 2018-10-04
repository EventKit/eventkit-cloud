import { createSelector } from 'reselect';

const getRun = (state, props) => state.featuredExports.data.runs[props.runId];

const getJobs = state => state.featuredExports.data.jobs;

const getProviderTasks = state => state.featuredExports.data.provider_tasks;

const getExportTasks = state => state.featuredExports.data.tasks;

const getRunProviderTasks = () => createSelector(
    [getRun, getProviderTasks],
    (run, providerTasks) => run.provider_tasks.map(id => providerTasks[id]),
);

const getJob = createSelector(
    [getRun, getJobs],
    (run, jobs) => jobs[run.job],
);

export const makeFullFeaturedRunSelector = () => createSelector(
    [getRun, getJob, getRunProviderTasks()],
    (run, job, providerTasks) => ({
        ...run,
        job,
        provider_task: providerTasks,
    }),
);
