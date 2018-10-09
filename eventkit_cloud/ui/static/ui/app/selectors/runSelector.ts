import { createSelector } from 'reselect';

const getAllRuns = state => state.exports.data.runs;

const getPropsRun = (state, props) => state.exports.data.runs[props.runId];

const getDatacartIds = state => state.datacartDetails.ids;

const getAllJobs = state => state.exports.data.jobs;

const getAllProviderTasks = state => state.exports.data.provider_tasks;

const getAllExportTasks = state => state.exports.data.tasks;

const getPropsProviderTasks = () => createSelector(
    [getPropsRun, getAllProviderTasks],
    (run, providerTasks) => run ? run.provider_tasks.map(id => providerTasks[id]) : null,
);

const getPropsJob = createSelector(
    [getPropsRun, getAllJobs],
    (run, jobs) => run ? jobs[run.job] : null,
);

const toFullProviderTask = (providerTask, exportTasks) => {
    const tasks = providerTask.tasks.map(id => exportTasks[id]);
    return {
        ...providerTask,
        tasks,
    };
};

const toFullRun = (run, jobs, providerTasks, exportTasks) => {
    const runJob = jobs[run.job];
    const runTasks = run.provider_tasks.map(id => toFullProviderTask(providerTasks[id], exportTasks));
    return {
        ...run,
        job: runJob,
        provider_tasks: runTasks,
    };
};

export const makeFullRunSelector = () => createSelector(
    [getPropsRun, getPropsJob, getPropsProviderTasks()],
    (run, job, providerTasks) => run ? ({
        ...run,
        job,
        provider_tasks: providerTasks,
    }) : null,
);

export const makeAllRunsSelector = () => createSelector(
    [getAllRuns, getAllJobs, getAllProviderTasks, getAllExportTasks],
    (runs, jobs, providerTasks, exportTasks) => {
        return Object.values(runs).map(run => toFullRun(run, jobs, providerTasks, exportTasks));
    }
);

const getDatacarts = createSelector(
    [getDatacartIds, getAllRuns],
    (ids, runs) => ids.map(id => runs[id]),
);

export const makeDatacartSelector = () => createSelector(
    [getDatacarts, getAllJobs, getAllProviderTasks, getAllExportTasks],
    (runs, jobs, providerTasks, exportTasks) => {
        return runs.map(run => toFullRun(run, jobs, providerTasks, exportTasks));
    }
);
