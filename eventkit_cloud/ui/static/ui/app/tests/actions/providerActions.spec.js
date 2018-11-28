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
});
