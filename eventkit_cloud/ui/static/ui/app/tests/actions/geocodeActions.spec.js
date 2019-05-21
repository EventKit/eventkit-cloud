import * as actions from '../../actions/geocodeActions';

describe('geocodeActions', () => {
    describe('getGeocode action', () => {
        it('should return the correct types', () => {
            expect(actions.getGeocode().types).toEqual([
                actions.types.FETCHING_GEOCODE,
                actions.types.RECEIVED_GEOCODE,
                actions.types.FETCH_GEOCODE_ERROR,
            ]);
        });

        it('getCancelSource should return the source', () => {
            const state = { geocode: { cancelSource: 'test' } };
            expect(actions.getGeocode().getCancelSource(state)).toEqual('test');
        });

        it('should pass the query as a param', () => {
            const query = 'search q';
            expect(actions.getGeocode(query).params).toEqual({ query });
        });

        it('onSuccess should return feature with properties copied', () => {
            const ret = {
                data: {
                    features: [
                        { geometry: {}, properties: { one: 'one', two: 'two' } },
                    ],
                },
            };
            const expected = {
                data: [
                    {
                        geometry: {},
                        properties: { one: 'one', two: 'two' },
                        one: 'one',
                        two: 'two',
                    },
                ],
            };
            expect(actions.getGeocode().onSuccess(ret)).toEqual(expected);
        });

        it('onSuccess should return empty data', () => {
            const ret = { data: { features: undefined } };
            expect(actions.getGeocode().onSuccess(ret)).toEqual({
                data: [],
            });
        });

        it('onSuccess should skip features with no geometry', () => {
            const ret = {
                data: {
                    features: [
                        { geometry: undefined, properties: { one: 'one' } },
                    ],
                },
            };
            expect(actions.getGeocode().onSuccess(ret)).toEqual({
                data: [],
            });
        });

        it('onError should return generic error string', () => {
            expect(actions.getGeocode().onError({ response: {} })).toEqual({
                error: 'An unknown error has occured',
            });
        });

        it('onError should return the response error msg', () => {
            const ret = { response: { data: 'error msg' } };
            expect(actions.getGeocode().onError(ret)).toEqual({
                error: 'error msg',
            });
        });
    });
});
