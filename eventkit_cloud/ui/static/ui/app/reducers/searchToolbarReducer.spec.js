import * as reducers from './searchToolbarReducer'

describe('getGeonames reducer', () => {
    it('should return initial state', () => {
        expect(reducers.getGeonamesReducer(undefined, {})).toEqual(
            {
                fetching: false,
                fetched: false,
                geonames: [],
                error: null,
            }
        )
    })

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
        )
    })

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
        )
    })

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
        )
    })
})

describe('searchBbox reducer', () => {
    it('should return initial state', () => {
        expect(reducers.searchBboxReducer(undefined, {})).toEqual([])
    })

    it('should handle DRAW_SEARCH_BBOX', () => {
        expect(reducers.searchBboxReducer(
            [],
            {type: 'DRAW_SEARCH_BBOX', searchBbox: [-1,-1,1,1]}
        )).toEqual([-1,-1,1,1])
    })

    it('should handle CLEAR_SEARCH_BBOX', () => {
        expect(reducers.searchBboxReducer(
            [-1,-1,1,1],
            {type: 'CLEAR_SEARCH_BBOX'}
        )).toEqual([])
    })
})