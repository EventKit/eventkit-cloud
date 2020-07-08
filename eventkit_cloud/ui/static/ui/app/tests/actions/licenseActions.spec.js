import { types, getLicenses } from '../../actions/licenseActions';

describe('license actions', () => {
    it('should return the correct types', () => {
        expect(getLicenses().types).toEqual([
            types.FETCHING_LICENSES,
            types.RECEIVED_LICENSES,
            types.FETCH_LICENSES_ERROR,
        ]);
    });

    it('onSuccess should return licenses', () => {
        const ret = { data: ['one', 'two'] };
        expect(getLicenses().onSuccess(ret)).toEqual({
            licenses: ret.data,
        });
    });
});
