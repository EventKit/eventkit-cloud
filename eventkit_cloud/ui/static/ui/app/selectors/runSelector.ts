import { createSelector } from 'reselect';

const getState = state => state;

const getProps = (state, props) => props;

const getRun = (state, props) => state.exports.data.runs[props.runId];

const getRunIds = state => state.exports.allInfo.ids;

const getJobs = state => state.exports.data.jobs;

const getProviderTasks = state => state.exports.data.provider_tasks;

const getExportTasks = state => state.exports.data.tasks;

const getRunProviderTasks = () => createSelector(
    [getRun, getProviderTasks],
    (run, providerTasks) => run ? run.provider_tasks.map(id => providerTasks[id]) : null,
);

const getJob = createSelector(
    [getRun, getJobs],
    (run, jobs) => run ? jobs[run.job] : null,
);

export const makeFullRunSelector = () => createSelector(
    [getRun, getJob, getRunProviderTasks()],
    (run, job, providerTasks) => run ? ({
        ...run,
        job,
        provider_task: providerTasks,
    }) : null,
);

export const makeAllRunsSelector = () => createSelector(
    [getState, getProps, getRunIds],
    (state, props, runIds) => {
        const getFullRun = makeFullRunSelector();
        return runIds.map(id => getFullRun(state, { ...props, runId: id }));
    }
);
