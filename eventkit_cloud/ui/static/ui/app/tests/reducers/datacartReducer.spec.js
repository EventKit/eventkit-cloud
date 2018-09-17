import * as reducers from '../../reducers/datacartReducer';

describe('exportAoiInfo reducer', () => {
    const geojson = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
                            [100.0, 1.0], [100.0, 0.0]],
                    ],
                },
            },
        ],
    };

    it('should return initial state', () => {
        expect(reducers.exportAoiInfoReducer(undefined, {})).toEqual({
            geojson: {},
            originalGeojson: {},
            geomType: null,
            title: null,
            description: null,
            selectionType: null,
            buffer: 0,
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
                buffer: 12,
            },
        )).toEqual({
            geojson,
            geomType: 'Polygon',
            title: 'title',
            description: 'description',
            selectionType: 'type',
            buffer: 12,
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
            buffer: 0,
        });
    });
});

describe('exportInfo reducer', () => {
    it('should return initial state', () => {
        expect(reducers.exportInfoReducer(undefined, {})).toEqual({
            exportName: '',
            datapackDescription: '',
            projectName: '',
            providers: [],
            areaStr: '',
            formats: ['gpkg'],
        });
    });

    it('should handle UPDATE_EXPORT_INFO', () => {
        expect(reducers.exportInfoReducer(
            {
                exportName: '',
                datapackDescription: '',
                projectName: '',
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
                    providers: ['provider'],
                    areaStr: 'string',
                    layers: 'layer',
                },
            },
        )).toEqual({
            exportName: 'name',
            datapackDescription: 'description',
            projectName: 'project',
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
                providers: ['provider'],
                areaStr: 'string',
                layers: 'layer',
            },
            { type: 'CLEAR_EXPORT_INFO' },
        )).toEqual({
            exportName: '',
            datapackDescription: '',
            projectName: '',
            providers: [],
            areaStr: '',
            formats: ['gpkg'],
        });
    });
});

describe('getProvidersReducer', () => {
    it('should return initial state', () => {
        expect(reducers.getProvidersReducer(undefined, {})).toEqual([]);
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
            { type: 'PROVIDERS_RECEIVED', providers: ['one', 'two', 'three'] },
        )).toEqual(['one', 'two', 'three']);
    });
});

describe('getFormatsReducer', () => {
    it('should return the initial state', () => {
        expect(reducers.getFormatsReducer(undefined, {})).toEqual([]);
    });

    it('should handle GETTING_FORMATS', () => {
        expect(reducers.getFormatsReducer(
            { formats: [{ id: 'fakeformat' }] },
            { type: 'GETTING_FORMATS' },
        )).toEqual([]);
    });

    it('should handle FORMATS_RECEIVED', () => {
        expect(reducers.getFormatsReducer(
            { formats: [] },
            {
                type: 'FORMATS_RECEIVED',
                formats: [{ id: 'fakeformat' }],
            },
        )).toEqual([{ id: 'fakeformat' }]);
    });
});

describe('submitJobReducer', () => {
    it('should return the intial state', () => {
        expect(reducers.submitJobReducer(undefined, {})).toEqual({
            fetching: false,
            fetched: false,
            jobuid: '',
            error: null,
        });
    });

    it('should handle SUBMITTING JOB', () => {
        expect(reducers.submitJobReducer(
            {
                fetching: false,
                fetched: false,
                jobuid: '',
                error: null,
            },
            { type: 'SUBMITTING_JOB' },
        )).toEqual({
            fetching: true,
            fetched: false,
            jobuid: '',
            error: null,
        });
    });

    it('should handle JOB SUBMITTED SUCCESS', () => {
        expect(reducers.submitJobReducer(
            {
                fetching: true,
                fetched: false,
                jobuid: '',
                error: null,
            },
            {
                type: 'JOB_SUBMITTED_SUCCESS',
                jobuid: '1234',
            },
        )).toEqual({
            fetching: false,
            fetched: true,
            jobuid: '1234',
            error: null,
        });
    });

    it('should handle JOB SUBMITTED ERROR', () => {
        expect(reducers.submitJobReducer(
            {
                fetching: true,
                fetched: false,
                jobuid: '',
                error: null,
            },
            {
                type: 'JOB_SUBMITTED_ERROR',
                error: 'Oh no a bad error',
            },
        )).toEqual({
            fetching: false,
            fetched: false,
            jobuid: '',
            error: 'Oh no a bad error',
        });
    });

    it('should handle CLEAR JOB INFO', () => {
        expect(reducers.submitJobReducer(
            {
                fetching: false,
                fetched: true,
                jobuid: '12345',
                error: null,
            },
            { type: 'CLEAR_JOB_INFO' },
        )).toEqual({
            fetching: false,
            fetched: false,
            jobuid: '',
            error: null,
        });
    });
});
