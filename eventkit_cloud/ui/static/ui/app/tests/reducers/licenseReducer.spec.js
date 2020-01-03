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
        )).toEqual({ ...state, fetched: false, fetching: true });
    });

    it('should return fetched true with the license data', () => {
        expect(licenseReducer(
            { ...state, fetching: true },
            {
                licenses: [{ name: 'license 1', text: 'some text', slug: '1' }],
                type: types.RECEIVED_LICENSES,
            },
        )).toEqual({
            ...state,
            fetched: true,
            fetching: false,
            licenses: [{ name: 'license 1', text: 'some text', slug: '1' }],
        });
    });

    it('should return the error message', () => {
        expect(licenseReducer(
            { ...state, fetching: true },
            {
                error: 'Oh no a big scary error',
                type: types.FETCH_LICENSES_ERROR,
            },
        )).toEqual({ ...state, fetching: false, error: 'Oh no a big scary error' });
    });
});
