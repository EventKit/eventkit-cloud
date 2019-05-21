import { createSelector } from 'reselect';
import sinon from 'sinon';
import * as selectors from '../../selectors/runSelector';

describe('Run Selector', () => {
    const getState = () => ({
        exports: {
            data: {
                runs: {
                    111: { uid: '111', job: '111', provider_tasks: ['111', '222'] },
                    222: { uid: '222', job: '222', provider_tasks: ['111', '222'] },
                },
                jobs: { 111: { uid: 111 }, 222: { uid: 222 } },
                provider_tasks: { 111: { tasks: ['111', '222'] }, 222: { tasks: ['333', '444'] } },
                tasks: { 111: { uid: '111' }, 222: { uid: '222' }, 333: { uid: '333' }, 444: { uid: '444' } },
            },
        },
        datacartDetails: {
            ids: ['111'],
        },
    });

    const getFullMockRun = (id) => {
        const s = getState();
        const run = s.exports.data.runs[id];
        const providerTasks = run.provider_tasks.map(providerId => {
            const provider = { ...s.exports.data.provider_tasks[providerId] };
            provider.tasks = provider.tasks.map(taskId => ({ ...s.exports.data.tasks[taskId] }));
            return provider;
        });
        return {
            ...run,
            job: { ...s.exports.data.jobs[run.job] },
            provider_tasks: providerTasks,
        };
    };

    let state;

    beforeEach(() => { state = getState(); });

    it('getAllRuns should return all runs in state', () => {
        expect(selectors.getAllRuns(state)).toEqual(state.exports.data.runs);
    });

    it('getPropsRun should return the correct run', () => {
        const runId = '111';
        expect(selectors.getPropsRun(state, { runId })).toEqual(state.exports.data.runs[runId]);
    });

    it('getDatacartIds should return all ids', () => {
        expect(selectors.getDatacartIds(state)).toEqual(state.datacartDetails.ids);
    });

    it('getAllJobs should return all jobs in state', () => {
        expect(selectors.getAllJobs(state)).toEqual(state.exports.data.jobs);
    });

    it('getAllProviderTasks should return all provider tasks in state', () => {
        expect(selectors.getAllProviderTasks(state)).toEqual(state.exports.data.provider_tasks);
    });

    it('getAllExportTasks should return all export tasks in state', () => {
        expect(selectors.getAllExportTasks(state)).toEqual(state.exports.data.tasks);
    });

    it('getPropsProvderTasks should return all provider tasks of prop run', () => {
        const runId = '111';
        const expected = state.exports.data.runs[runId].provider_tasks.map(providerId => {
            const provider = { ...state.exports.data.provider_tasks[providerId] };
            provider.tasks = provider.tasks.map(taskId => ({ ...state.exports.data.tasks[taskId] }));
            return provider;
        });
        const providerSelector = selectors.getPropsProviderTasks();
        const providers = providerSelector(state, { runId });
        expect(providers).toEqual(expected);
    });

    it('getPropsJob should return the job associated with a run id', () => {
        const runId = '222';
        expect(selectors.getPropsJob(state, { runId })).toEqual(state.exports.data.jobs[state.exports.data.runs[runId].job]);
    });

    it('toFullProviderTask should add the full tasks to a provider task', () => {
        const expected = { ...state.exports.data.provider_tasks['222'] };
        expected.tasks = expected.tasks.map(id => state.exports.data.tasks[id]);
        expect(selectors.toFullProviderTask(state.exports.data.provider_tasks['222'], state.exports.data.tasks)).toEqual(expected);
    });

    it('toFullRun should return a run with complete job and provider tasks with sub tasks', () => {
        const runId = '111';
        const expected = getFullMockRun(runId);
        expect(selectors.toFullRun(
            state.exports.data.runs[runId],
            state.exports.data.jobs,
            state.exports.data.provider_tasks,
            state.exports.data.tasks,
        )).toEqual(expected);
    });

    it('toFullRun should return the simple run if no provider tasks provided', () => {
        const runId = '111';
        const inputRun = { ...state.exports.data.runs[runId] };
        inputRun.provider_tasks = null;
        expect(selectors.toFullRun(
            inputRun,
            state.exports.data.jobs,
        )).toEqual({ ...inputRun, job: state.exports.data.jobs[inputRun.job] });
    });

    it('makeFullRunSelector should return a run with job', () => {
        const runId = '222';
        const expected = { ...state.exports.data.runs[runId], job: state.exports.data.jobs['222'] };
        const fullRunSelector = selectors.makeFullRunSelector();
        expect(fullRunSelector(state, { runId })).toEqual(expected);
    });

    it('makeAllRunsSelector should return all runs', () => {
        const expected = Object.values(state.exports.data.runs)
            .map((run: { job: string }) => ({ ...run, job: state.exports.data.jobs[run.job] }));
        const allRunsSelector = selectors.makeAllRunsSelector();
        expect(allRunsSelector(state)).toEqual(expected);
    });

    it('getDatacarts should get all runs in datacart ids', () => {
        expect(selectors.getDatacarts(state)).toEqual(state.datacartDetails.ids.map(id => state.exports.data.runs[id]));
    });

    it('makeDatacartSelector should return full runs for each id in datacart ids', () => {
        const expected = state.datacartDetails.ids.map(id => getFullMockRun(id));
        const datacartSelector = selectors.makeDatacartSelector();
        expect(datacartSelector(state)).toEqual(expected);
    });
});
