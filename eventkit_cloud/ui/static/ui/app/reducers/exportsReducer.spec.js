import * as reducers from './exportsReducer'

describe('exportJobs reducer', () => {
    it('should return initial state', () => {
        expect(reducers.exportJobsReducer(undefined, {})).toEqual([])
    })

    it('should handle LOAD_JOBS_SUCCESS', () => {
        expect(reducers.exportJobsReducer(
            [],
            {type: 'LOAD_JOBS_SUCCESS', jobs: [{ 'jobs1': {}, 'job2': {} }]}
        )).toEqual([{ 'jobs1': {}, 'job2': {} }])
    })
})

describe('exportMode reducer', () => {
    it('should return initial state', () => {
        expect(reducers.exportModeReducer(undefined, {})).toEqual('DRAW_NORMAL')
    })

    it('should handle SET_MODE', () => {
        expect(reducers.exportModeReducer(
            'DRAW_NORMAL',
            {type: 'SET_MODE', mode: 'DRAW_BBOX'}
        )).toEqual('DRAW_BBOX')
    })
})

describe('exportBboxReducer', () => {
    it('should return initial state', () => {
        expect(reducers.exportBboxReducer(undefined, {})).toEqual([])
    })

    it('should handle UPDATE_BBOX', () => {
        expect(reducers.exportBboxReducer(
            [],
            {type: 'UPDATE_BBOX', bbox: [-1,-1,1,1]}
        )).toEqual([-1,-1,1,1])
    })
})

describe('exportGeojson reducer', () => {
    it('should return initial state', () => {
        expect(reducers.exportGeojsonReducer(undefined, {})).toEqual({})
    })

    it('should handle UPDATE_GEOJSON', () => {
        let geojson ={ "type": "FeatureCollection",
                        "features": [
                            { "type": "Feature",
                                "geometry": {
                                    "type": "Polygon",
                                    "coordinates": [
                                        [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
                                        [100.0, 1.0], [100.0, 0.0] ]
                                    ]
                                },
                            }
                        ]
                    }
        expect(reducers.exportGeojsonReducer(
            {},
            {type: 'UPDATE_GEOJSON', geojson: geojson}
        )).toEqual(geojson)
    })
})

describe('exportSetAOI reducer', () => {
    it('should return initial state', () => {
        expect(reducers.exportSetAOIReducer(undefined, {})).toEqual(false)
    })

    it('should handle SET_AOI', () => {
        expect(reducers.exportSetAOIReducer(
            false,
            {type: 'SET_AOI'}
        )).toEqual(true)
    })

    it('should handle UNSET_AOI', () => {
        expect(reducers.exportSetAOIReducer(
            true,
            {type: 'UNSET_AOI'}
        )).toEqual(false)
    })
})