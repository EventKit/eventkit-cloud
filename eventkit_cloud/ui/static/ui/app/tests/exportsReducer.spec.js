import * as reducers from '../reducers/exportsReducer'

describe('exportJobs reducer', () => {
    it('should return initial state', () => {
        expect(reducers.exportJobsReducer(undefined, {})).toEqual([])
    });

    it('should handle LOAD_JOBS_SUCCESS', () => {
        expect(reducers.exportJobsReducer(
            [],
            {type: 'LOAD_JOBS_SUCCESS', jobs: [{ 'jobs1': {}, 'job2': {} }]}
        )).toEqual([{ 'jobs1': {}, 'job2': {} }])
    });
});

describe('exportMode reducer', () => {
    it('should return initial state', () => {
        expect(reducers.exportModeReducer(undefined, {})).toEqual('DRAW_NORMAL')
    });

    it('should handle SET_MODE', () => {
        expect(reducers.exportModeReducer(
            'DRAW_NORMAL',
            {type: 'SET_MODE', mode: 'DRAW_BBOX'}
        )).toEqual('DRAW_BBOX')
    });
});

describe('exportBboxReducer', () => {
    it('should return initial state', () => {
        expect(reducers.exportBboxReducer(undefined, {})).toEqual([])
    });

    it('should handle UPDATE_BBOX', () => {
        expect(reducers.exportBboxReducer(
            [],
            {type: 'UPDATE_BBOX', bbox: [-1,-1,1,1]}
        )).toEqual([-1,-1,1,1])
    });
});

describe('exportAoiInfo reducer', () => {
    it('should return initial state', () => {
        expect(reducers.exportAoiInfoReducer(undefined, {})).toEqual({geojson: {}, geomType: null, title: null, description:null})
    });

    it('should handle UPDATE_AOI_INFO', () => {
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
        expect(reducers.exportAoiInfoReducer(
            {},
            {type: 'UPDATE_AOI_INFO', geojson: geojson, geomType: 'Polygon', title: 'title', description: 'description'}
        )).toEqual({geojson: geojson, geomType: 'Polygon', title: 'title', description: 'description'});
    });
});

describe('drawerMenu Reducer', () => {
    it('should return initial state', () => {
        expect(reducers.drawerMenuReducer(undefined, {})).toEqual(true);
    });

    it('should handle OPEN_DRAWER', () => {
        expect(reducers.drawerMenuReducer(
            false,
            {type: 'OPEN_DRAWER'}
        )).toEqual(true);
    });
    
    it('should handle CLOSE_DRAWER', () => {
        expect(reducers.drawerMenuReducer(
            true,
            {type: 'CLOSE_DRAWER'}
        )).toEqual(false);
    });
});
