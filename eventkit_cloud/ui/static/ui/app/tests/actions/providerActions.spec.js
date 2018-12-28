import * as actions from '../../actions/providerActions';

describe('providerActions', () => {
    describe('getProviders action', () => {
        it('should return the correct types', () => {
            expect(actions.getProviders().types).toEqual([
                actions.types.GETTING_PROVIDERS,
                actions.types.PROVIDERS_RECEIVED,
                actions.types.GETTING_PROVIDERS_ERROR,
            ]);
        });

        it('onSuccess should return providers', () => {
            const ret = { data: ['one', 'two'] };
            expect(actions.getProviders().onSuccess(ret)).toEqual({
                providers: ret.data,
            });
        });
    });

    describe('cancelProviderTask action', () => {
        it('should return the correct types', () => {
            expect(actions.cancelProviderTask().types).toEqual([
                actions.types.CANCELING_PROVIDER_TASK,
                actions.types.CANCELED_PROVIDER_TASK,
                actions.types.CANCEL_PROVIDER_TASK_ERROR,
            ]);
        });
    });

    describe('getProviderTask action', () => {
        it('should return the correct types', () => {
            expect(actions.getProviderTask().types).toEqual([
                actions.types.GETTING_PROVIDER_TASK,
                actions.types.RECEIVED_PROVIDER_TASK,
                actions.types.GETTING_PROVIDER_TASK_ERROR,
            ]);
        });

        it('shouldCallApi should return true', () => {
            const uid = '12345';
            const state = { providerTasks: { data: { item: {} } } };
            expect(actions.getProviderTask(uid).shouldCallApi(state)).toBe(true);
        });

        it('onSuccess should return first item of data array', () => {
            const response = { data: [{ task: 'example task' }] };
            expect(actions.getProviderTask().onSuccess(response)).toEqual({
                data: response.data[0],
            });
        });
    });
});
