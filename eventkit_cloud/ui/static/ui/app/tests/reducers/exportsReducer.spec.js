import * as reducers from '../../reducers/exportsReducer'

describe('exportAoiInfo reducer', () => {
    it('should return initial state', () => {
        expect(reducers.exportAoiInfoReducer(undefined, {})).toEqual({geojson: {}, geomType: null, title: null, description:null, selectionType: null})
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
            {type: 'UPDATE_AOI_INFO', geojson: geojson, geomType: 'Polygon', title: 'title', description: 'description', selectionType: 'type'}
        )).toEqual({geojson: geojson, geomType: 'Polygon', title: 'title', description: 'description', selectionType: 'type'});
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
            area_str: '',
            layers: 'Geopackage'
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
                area_str: '',
                layers: ''
            },
            {
                type: 'UPDATE_EXPORT_INFO',
                exportInfo: {
                    exportName: 'name',
                    datapackDescription: 'description',
                    projectName: 'project',
                    makePublic: true,
                    providers: ['provider'],
                    area_str: 'string',
                    layers: 'layer'
                }
            }
        )).toEqual({
            exportName: 'name',
            datapackDescription: 'description',
            projectName: 'project',
            makePublic: true,
            providers: ['provider'],
            area_str: 'string',
            layers: 'layer'
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
                area_str: 'string',
                layers: 'layer'
            },
            {type: 'CLEAR_EXPORT_INFO'}
        )).toEqual(
            {
                exportName: '',
                datapackDescription: '',
                projectName: '',
                makePublic: false,
                providers: [],
                area_str: '',
                layers: ''
            }
        )
    });
});

describe('drawerMenu Reducer', () => {
    it('should return initial state', () => {
        expect(reducers.drawerMenuReducer(undefined, {})).toEqual(false);
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
