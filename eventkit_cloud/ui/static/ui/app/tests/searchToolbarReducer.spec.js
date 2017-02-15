import * as reducers from '../reducers/searchToolbarReducer'

describe('getGeonames reducer', () => {
    it('should return initial state', () => {
        expect(reducers.getGeonamesReducer(undefined, {})).toEqual(
            {
                fetching: false,
                fetched: false,
                geonames: [],
                error: null,
            }
        );
    });

    it('should handle FETCHING_GEONAMES', () => {
        expect(reducers.getGeonamesReducer( 
            {
                fetching: false,
                fetched: false,
                geonames: [],
                error: null,
            },
            {type: 'FETCHING_GEONAMES'}
        )).toEqual(
            {
                fetching: true,
                fetched: false,
                geonames: [],
                error: null,
            }
        );
    });

    it('should handle RECEIVED_GEONAMES', () => {
        expect(reducers.getGeonamesReducer(
            {
                fetching: false,
                fetched: false,
                geonames: [],
                error: null,
            },
            {type: 'RECEIVED_GEONAMES', geonames: ['name1', 'name2']}
        )).toEqual(
            {
                fetching: false,
                fetched: true,
                geonames: ['name1', 'name2'],
                error: null,
            }
        );
    });

    it('should handle FETCH_GEONAMES_ERROR', () => {
        expect(reducers.getGeonamesReducer(
            {
                fetching: false,
                fetched: false,
                geonames: [],
                error: null,
            },
            {type: 'FETCH_GEONAMES_ERROR', error: 'Oh no I had an error'}
        )).toEqual(
            {
                fetching: false,
                fetched: false,
                geonames: [],
                error: 'Oh no I had an error',
            }
        );
    });
});
