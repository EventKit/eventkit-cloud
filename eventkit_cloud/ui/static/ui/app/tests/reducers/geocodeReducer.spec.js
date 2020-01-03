import * as reducers from '../../reducers/geocodeReducer';

describe('getGeocode reducer', () => {
    it('should return initial state', () => {
        expect(reducers.geocodeReducer(undefined, {})).toEqual({
            cancelSource: null,
            data: [],
            error: null,
            fetched: null,
            fetching: null,
        });
    });

    it('should handle FETCHING_GEOCODE', () => {
        expect(reducers.geocodeReducer(
            {
                cancelSource: null,
                data: [],
                error: null,
                fetched: false,
                fetching: false,
            },
            { type: 'FETCHING_GEOCODE', cancelSource: 'test' },
        )).toEqual({
            cancelSource: 'test',
            data: [],
            error: null,
            fetched: false,
            fetching: true,
        });
    });

    it('should handle RECEIVED_GEOCODE', () => {
        expect(reducers.geocodeReducer(
            {
                cancelSource: 'test',
                data: [],
                error: null,
                fetched: false,
                fetching: false,
            },
            { type: 'RECEIVED_GEOCODE', data: ['name1', 'name2'] },
        )).toEqual({
            cancelSource: null,
            data: ['name1', 'name2'],
            error: null,
            fetched: true,
            fetching: false,
        });
    });

    it('should handle FETCH_GEOCODE_ERROR', () => {
        expect(reducers.geocodeReducer(
            {
                cancelSource: 'test',
                data: [],
                error: null,
                fetched: false,
                fetching: false,
            },
            { type: 'FETCH_GEOCODE_ERROR', error: 'Oh no I had an error' },
        )).toEqual({
            cancelSource: null,
            data: [],
            error: 'Oh no I had an error',
            fetched: false,
            fetching: false,
        });
    });
});
