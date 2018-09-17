import * as reducers from '../../reducers/providerReducer';

describe('getProvidersReducer', () => {
    it('should return initial state', () => {
        expect(reducers.getProvidersReducer(undefined, {})).toEqual([]);
    });

    it('should handle GETTING_PROVIDERS', () => {
        expect(reducers.getProvidersReducer(
            ['one', 'two', 'three'],
            { type: 'GETTING_PROVIDERS' },
        )).toEqual([]);
    });

    it('should handle PROVIDERS RECEIVED', () => {
        expect(reducers.getProvidersReducer(
            [],
            { type: 'PROVIDERS_RECEIVED', providers: ['one', 'two', 'three'] },
        )).toEqual(['one', 'two', 'three']);
    });
});

describe('cancelProviderTask Reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.cancelProviderTask(undefined, {})).toEqual({
            canceling: false,
            canceled: false,
            error: null,
        });
    });

    it('should handle CANCELING_PROVIDER_TASK', () => {
        expect(reducers.cancelProviderTask(
            {
                canceling: false,
                canceled: false,
                error: null,
            },
            {
                type: 'CANCELING_PROVIDER_TASK',
            },
        )).toEqual({
            canceling: true,
            canceled: false,
            error: null,
        });
    });

    it('should handle CANCELED_PROVIDER_TASK', () => {
        expect(reducers.cancelProviderTask(
            {
                canceling: true,
                canceled: false,
                error: null,
            },
            {
                type: 'CANCELED_PROVIDER_TASK',
            },
        )).toEqual({
            canceling: false,
            canceled: true,
            error: null,
        });
    });

    it('should handle CANCEL_PROVIDER_TASK_ERROR', () => {
        expect(reducers.cancelProviderTask(
            {
                canceling: true,
                canceled: false,
                error: null,
            },
            {
                type: 'CANCEL_PROVIDER_TASK_ERROR',
                error: 'This is an error',
            },
        )).toEqual({
            canceling: false,
            canceled: false,
            error: 'This is an error',
        });
    });
});
