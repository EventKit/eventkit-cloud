import * as reducers from '../../reducers/exportsReducer'

describe('drawerMenu Reducer', () => {
    it('should return initial state', () => {
        expect(reducers.drawerMenuReducer(undefined, {})).toEqual('closed');
    });

    it('should handle OPENING_DRAWER', () => {
        expect(reducers.drawerMenuReducer(
            'closed',
            {type: 'OPENING_DRAWER'}
        )).toEqual('opening');
    });

    it('should handle OPENED_DRAWER', () => {
        expect(reducers.drawerMenuReducer(
            'opening',
            {type: 'OPENED_DRAWER'}
        )).toEqual('open');
    });

    it('should handle CLOSING_DRAWER', () => {
        expect(reducers.drawerMenuReducer(
            'open',
            {type: 'CLOSING_DRAWER'}
        )).toEqual('closing');
    });

    it('should handle CLOSED_DRAWER', () => {
        expect(reducers.drawerMenuReducer(
            'closing',
            {type: 'CLOSED_DRAWER'}
        )).toEqual('closed');
    });
});

describe('stepperReducer', () => {
    it('should return intial state', () => {
         expect(reducers.stepperReducer(undefined, {})).toEqual(false);
    });

    it('should handle MAKE_STEPPER_ACTIVE', () => {
        expect(reducers.stepperReducer(
            false,
            {type: 'MAKE_STEPPER_ACTIVE'}
        )).toEqual(true);
    });

    it('should handle MAKE_STEPPER_INACTIVE', () => {
        expect(reducers.stepperReducer(
            true,
            {type: 'MAKE_STEPPER_INACTIVE'}
        )).toEqual(false);
    });
});

describe('exportAoiInfo reducer', () => {
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

    it('should return initial state', () => {
        expect(reducers.exportAoiInfoReducer(undefined, {})).toEqual({
            geojson: {},
            originalGeojson: {},
            geomType: null,
            title: null,
            description: null,
            selectionType: null,
        });
    });

    it('should handle UPDATE_AOI_INFO', () => {
        expect(reducers.exportAoiInfoReducer(
            {},
            {
                type: 'UPDATE_AOI_INFO',
                geojson,
                geomType: 'Polygon',
                title: 'title',
                description: 'description',
                selectionType: 'type',
            },
        )).toEqual({
            geojson,
            geomType: 'Polygon',
            title: 'title',
            description: 'description',
            selectionType: 'type',
        });
    });

    it('should handle CLEAR_AOI_INFO', () => {
        expect(reducers.exportAoiInfoReducer(
            {
                geojson,
                geomType: 'Polygon',
                title: 'test',
                description: 'test stuff',
            },
            { type: 'CLEAR_AOI_INFO' },
        )).toEqual({
            geojson: {},
            originalGeojson: {},
            geomType: null,
            title: null,
            description: null,
            selectionType: null,
        });
    });
});

describe('exportInfo reducer', () => {
    it('should return initial state', () => {
        expect(reducers.exportInfoReducer(undefined, {})).toEqual({
            exportName: '',
            datapackDescription: '',
            projectName: '',
            makePublic: false,
            providers: [],
            areaStr: '',
            formats: [],
        });
    });

    it('should handle UPDATE_EXPORT_INFO', () => {
        expect(reducers.exportInfoReducer(
            {
                exportName: '',
                datapackDescription: '',
                projectName: '',
                makePublic: false,
                providers: [],
                areaStr: '',
                layers: '',
            },
            {
                type: 'UPDATE_EXPORT_INFO',
                exportInfo: {
                    exportName: 'name',
                    datapackDescription: 'description',
                    projectName: 'project',
                    makePublic: true,
                    providers: ['provider'],
                    areaStr: 'string',
                    layers: 'layer',
                },
            },
        )).toEqual({
            exportName: 'name',
            datapackDescription: 'description',
            projectName: 'project',
            makePublic: true,
            providers: ['provider'],
            areaStr: 'string',
            layers: 'layer',
        });
    });

    it('should handle CLEAR_EXPORT_INFO', () => {
        expect(reducers.exportInfoReducer(
            {
                exportName: 'name',
                datapackDescription: 'description',
                projectName: 'project',
                makePublic: true,
                providers: ['provider'],
                areaStr: 'string',
                layers: 'layer',
            },
            { type: 'CLEAR_EXPORT_INFO' },
        )).toEqual({
            exportName: '',
            datapackDescription: '',
            projectName: '',
            makePublic: false,
            providers: [],
            areaStr: '',
            layers: '',
        });
    });
});

describe('getProvidersReducer', () => {
    it('should return initial state', () => {
        expect(reducers.getProvidersReducer(undefined, {})).toEqual([])
    });

    it('should handle GETTING_PROVIDERS', () => {
        expect(reducers.getProvidersReducer(
            ['one', 'two', 'three'],
            { type: 'GETTING_PROVIDERS' },
        )).toEqual([]);
    });

    it('should handle PROVIDERS RECEIVED', () => {
        expect(reducers.getProvidersReducer(
            [],
            {type: 'PROVIDERS_RECEIVED', providers: ['one', 'two', 'three']}
        )).toEqual(['one', 'two', 'three']);
    });
});

describe('submitJobReducer', () => {
    it('should return the intial state', () => {
        expect(reducers.submitJobReducer(undefined, {})).toEqual({
            fetching: false, 
            fetched: false, 
            jobuid: '', 
            error: null
        });
    });

    it('should handle SUBMITTING JOB', () => {
        expect(reducers.submitJobReducer(
            {
                fetching: false,
                fetched: false,
                jobuid: '',
                error: null
            },
            {type: 'SUBMITTING_JOB'}
        )).toEqual(
            {
                fetching: true,
                fetched: false,
                jobuid: '',
                error: null
            }
        );
    });

    it('should handle JOB SUBMITTED SUCCESS', () => {
        expect(reducers.submitJobReducer(
            {
                fetching: true,
                fetched: false,
                jobuid: '',
                error: null
            },
            {
                type: 'JOB_SUBMITTED_SUCCESS',
                jobuid: '1234'
            }
        )).toEqual({
            fetching: false,
            fetched: true,
            jobuid: '1234',
            error: null
        });
    });

    it('should handle JOB SUBMITTED ERROR', () => {
        expect(reducers.submitJobReducer(
            {
                fetching: true,
                fetched: false,
                jobuid: '',
                error: null
            },
            {
                type: 'JOB_SUBMITTED_ERROR',
                error: 'Oh no a bad error',
            }
        )).toEqual({
            fetching: false,
            fetched: false,
            jobuid: '',
            error: 'Oh no a bad error'
        });
    });

    it('should handle CLEAR JOB INFO', () => {
        expect(reducers.submitJobReducer(
            {
                fetching: false,
                fetched: true,
                jobuid: '12345',
                error: null
            },
            {type: 'CLEAR_JOB_INFO'}
        )).toEqual({
            fetching: false,
            fetched: false,
            jobuid: '',
            error: null
        });
    });
});
