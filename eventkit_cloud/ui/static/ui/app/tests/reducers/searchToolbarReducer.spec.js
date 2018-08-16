import * as reducers from '../../reducers/searchToolbarReducer';

describe('getGeocode reducer', () => {
    it('should return initial state', () => {
        expect(reducers.getGeocodeReducer(undefined, {})).toEqual({
            fetching: false,
            fetched: false,
            data: [],
            error: null,
        });
    });

    it('should handle FETCHING_GEOCODE', () => {
        expect(reducers.getGeocodeReducer(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            },
            { type: 'FETCHING_GEOCODE' },
        )).toEqual({
            fetching: true,
            fetched: false,
            data: [],
            error: null,
        });
    });

    it('should handle RECEIVED_GEOCODE', () => {
        expect(reducers.getGeocodeReducer(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            },
            { type: 'RECEIVED_GEOCODE', data: ['name1', 'name2'] },
        )).toEqual({
            fetching: false,
            fetched: true,
            data: ['name1', 'name2'],
            error: null,
        });
    });

    it('should handle FETCH_GEOCODE_ERROR', () => {
        expect(reducers.getGeocodeReducer(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            },
            { type: 'FETCH_GEOCODE_ERROR', error: 'Oh no I had an error' },
        )).toEqual({
            fetching: false,
            fetched: false,
            data: [],
            error: 'Oh no I had an error',
        });
    });
});
