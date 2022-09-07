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

        it('should attach correct parameters when called with filters', () => {
            const selectedTopics = ['transportation'];
            const selectedArea = 'test';
            expect(actions.getProviders(selectedArea, selectedTopics).data).toEqual({
                topics: [...selectedTopics],
                geojson: selectedArea,
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
            const response = { data: { task: 'example task' } };
            expect(actions.getProviderTask().onSuccess(response)).toEqual({
                data: response.data,
            });
        });
    });

    describe('updateProviderFavorite action', () => {
        it('should return the correct types', () => {
            expect(actions.updateProviderFavorite('test', true).types).toEqual([
                actions.types.PATCHING_PROVIDER_FAVORITE,
                actions.types.PATCHED_PROVIDER_FAVORITE,
                actions.types.PATCH_PROVIDER_FAVORITE_ERROR,
            ]);
        });
    });
});
