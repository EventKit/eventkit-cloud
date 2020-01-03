import * as reducers from '../../reducers/providerReducer';
import { types } from '../../actions/providerActions';

describe('getProvidersReducer', () => {
    it('should return initial state', () => {
        expect(reducers.getProvidersReducer(undefined, {})).toEqual([]);
    });

    it('should handle GETTING_PROVIDERS', () => {
        expect(reducers.getProvidersReducer(
            ['one', 'two', 'three'],
            { type: types.GETTING_PROVIDERS },
        )).toEqual([]);
    });

    it('should handle PROVIDERS RECEIVED', () => {
        expect(reducers.getProvidersReducer(
            [],
            { type: types.PROVIDERS_RECEIVED, providers: ['one', 'two', 'three'] },
        )).toEqual(['one', 'two', 'three']);
    });
});

describe('cancelProviderTask Reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.cancelProviderTask(undefined, {})).toEqual({
            canceled: false,
            canceling: false,
            error: null,
        });
    });

    it('should handle CANCELING_PROVIDER_TASK', () => {
        expect(reducers.cancelProviderTask(
            {
                canceled: false,
                canceling: false,
                error: null,
            },
            {
                type: types.CANCELING_PROVIDER_TASK,
            },
        )).toEqual({
            canceled: false,
            canceling: true,
            error: null,
        });
    });

    it('should handle CANCELED_PROVIDER_TASK', () => {
        expect(reducers.cancelProviderTask(
            {
                canceled: false,
                canceling: true,
                error: null,
            },
            {
                type: types.CANCELED_PROVIDER_TASK,
            },
        )).toEqual({
            canceled: true,
            canceling: false,
            error: null,
        });
    });

    it('should handle CANCEL_PROVIDER_TASK_ERROR', () => {
        expect(reducers.cancelProviderTask(
            {
                canceled: false,
                canceling: true,
                error: null,
            },
            {
                error: 'This is an error',
                type: types.CANCEL_PROVIDER_TASK_ERROR,
            },
        )).toEqual({
            canceled: false,
            canceling: false,
            error: 'This is an error',
        });
    });
});

describe('providerTasks Reducer', () => {
    it('should return the initial state', () => {
        expect(reducers.providerTasksReducer(undefined, {})).toEqual(reducers.initialStateProviderTasks);
    });

    it('should handle GETTING', () => {
        expect(reducers.providerTasksReducer(
            { ...reducers.initialStateProviderTasks },
            {
                type: types.GETTING_PROVIDER_TASK,
            },
        )).toEqual({
            ...reducers.initialStateProviderTasks,
            fetching: true,
        });
    });

    it('should handle RECEIVED', () => {
        const data = { key: 'value' };
        expect(reducers.providerTasksReducer(
            { ...reducers.initialStateProviderTasks, fetching: true },
            {
                data,
                type: types.RECEIVED_PROVIDER_TASK,
                uid: 'id',
            },
        )).toEqual({
            ...reducers.initialStateProviderTasks,
            data: { id: data },
            fetched: true,
        });
    });

    it('should handle ERROR', () => {
        const error = 'oh no an error';
        expect(reducers.providerTasksReducer(
            { ...reducers.initialStateProviderTasks, fetching: true },
            {
                error,
                type: types.GETTING_PROVIDER_TASK_ERROR,
            },
        )).toEqual({
            ...reducers.initialStateProviderTasks,
            error,
        });
    });
});
