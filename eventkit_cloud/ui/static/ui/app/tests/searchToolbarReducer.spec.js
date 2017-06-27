import * as reducers from '../reducers/searchToolbarReducer'

describe('getGeonames reducer', () => {
    it('should return initial state', () => {
        expect(reducers.getGeocodeReducer(undefined, {})).toEqual(
            {
                fetching: false,
                fetched: false,
                geocode: [],
                error: null,
            }
        );
    });

    it('should handle FETCHING_GEONAMES', () => {
        expect(reducers.getGeocodeReducer(
            {
                fetching: false,
                fetched: false,
                geocode: [],
                error: null,
            },
            {type: 'FETCHING_GEONAMES'}
        )).toEqual(
            {
                fetching: true,
                fetched: false,
                geocode: [],
                error: null,
            }
        );
    });

    it('should handle RECEIVED_GEONAMES', () => {
        expect(reducers.getGeocodeReducer(
            {
                fetching: false,
                fetched: false,
                geocode: [],
                error: null,
            },
            {type: 'RECEIVED_GEONAMES', geocode: ['name1', 'name2']}
        )).toEqual(
            {
                fetching: false,
                fetched: true,
                geocode: ['name1', 'name2'],
                error: null,
            }
        );
    });

    it('should handle FETCH_GEONAMES_ERROR', () => {
        expect(reducers.getGeocodeReducer(
            {
                fetching: false,
                fetched: false,
                geocode: [],
                error: null,
            },
            {type: 'FETCH_GEONAMES_ERROR', error: 'Oh no I had an error'}
        )).toEqual(
            {
                fetching: false,
                fetched: false,
                geocode: [],
                error: 'Oh no I had an error',
            }
        );
    });
});
