import { licenseReducer, initialState as state } from '../../reducers/licenseReducer';
import { types } from '../../actions/licenseActions';

describe('License Reducer', () => {
    it('should return the initialState', () => {
        expect(licenseReducer(
            undefined,
            {},
        )).toEqual(state);
    });

    it('should return fetching true', () => {
        expect(licenseReducer(
            state,
            {
                type: types.FETCHING_LICENSES,
            },
        )).toEqual({ ...state, fetching: true });
    });

    it('should return fetched true with the license data', () => {
        expect(licenseReducer(
            { ...state, fetching: true },
            {
                type: types.RECEIVED_LICENSES,
                licenses: [{ name: 'license 1', text: 'some text', slug: '1' }],
            },
        )).toEqual({ ...state, fetched: true, licenses: [{ name: 'license 1', text: 'some text', slug: '1' }] });
    });

    it('should return the error message', () => {
        expect(licenseReducer(
            { ...state, fetching: true },
            {
                type: types.FETCH_LICENSES_ERROR,
                error: 'Oh no a big scary error',
            },
        )).toEqual({ ...state, error: 'Oh no a big scary error' });
    });
});
