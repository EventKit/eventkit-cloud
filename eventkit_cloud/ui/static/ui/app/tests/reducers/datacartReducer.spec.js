import * as reducers from '../../reducers/datacartReducer';

describe('exportAoiInfo reducer', () => {
    const geojson = {
        features: [
            {
                geometry: {
                    coordinates: [
                        [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
                            [100.0, 1.0], [100.0, 0.0]],
                    ],
                    type: 'Polygon',
                },
                type: 'Feature',
            },
        ],
        type: 'FeatureCollection',
    };

    it('should return initial state', () => {
        expect(reducers.exportAoiInfoReducer(undefined, {})).toEqual({
            buffer: 0,
            description: null,
            geojson: {},
            geomType: null,
            originalGeojson: {},
            selectionType: null,
            title: null,
        });
    });

    it('should handle UPDATE_AOI_INFO', () => {
        expect(reducers.exportAoiInfoReducer(
            {},
            {
                buffer: 12,
                description: 'description',
                geojson,
                geomType: 'Polygon',
                selectionType: 'type',
                title: 'title',
                type: 'UPDATE_AOI_INFO',
            },
        )).toEqual({
            buffer: 12,
            description: 'description',
            geojson,
            geomType: 'Polygon',
            selectionType: 'type',
            title: 'title',
        });
    });

    it('should handle CLEAR_AOI_INFO', () => {
        expect(reducers.exportAoiInfoReducer(
            {
                description: 'test stuff',
                geojson,
                geomType: 'Polygon',
                title: 'test',
            },
            { type: 'CLEAR_AOI_INFO' },
        )).toEqual({
            buffer: 0,
            description: null,
            geojson: {},
            geomType: null,
            originalGeojson: {},
            selectionType: null,
            title: null,
        });
    });
});

describe('exportInfo reducer', () => {
    it('should return initial state', () => {
        expect(reducers.exportInfoReducer(undefined, {})).toEqual({
            areaStr: '',
            datapackDescription: '',
            exportName: '',
            exportOptions: {},
            formats: ['gpkg'],
            projectName: '',
            projections: [],
            providerEstimates: {},
            providers: [],
        });
    });

    it('should handle UPDATE_EXPORT_INFO', () => {
        expect(reducers.exportInfoReducer(
            {
                areaStr: '',
                datapackDescription: '',
                exportName: '',
                exportOptions: {},
                layers: '',
                projectName: '',
                projections: [],
                providers: [],
            },
            {
                exportInfo: {
                    areaStr: 'string',
                    datapackDescription: 'description',
                    exportName: 'name',
                    layers: 'layer',
                    projectName: 'project',
                    providers: ['provider'],
                },
                type: 'UPDATE_EXPORT_INFO',
            },
        )).toEqual({
            areaStr: 'string',
            datapackDescription: 'description',
            exportName: 'name',
            exportOptions: {},
            layers: 'layer',
            projectName: 'project',
            projections: [],
            providers: ['provider'],
        });
    });

    it('should handle CLEAR_EXPORT_INFO', () => {
        expect(reducers.exportInfoReducer(
            {
                areaStr: 'string',
                datapackDescription: 'description',
                exportName: 'name',
                layers: 'layer',
                projectName: 'project',
                providers: ['provider'],
            },
            { type: 'CLEAR_EXPORT_INFO' },
        )).toEqual({
            areaStr: '',
            datapackDescription: '',
            exportName: '',
            exportOptions: {},
            formats: ['gpkg'],
            projectName: '',
            projections: [],
            providerEstimates: {},
            providers: [],
        });
    });
});

describe('submitJobReducer', () => {
    it('should return the intial state', () => {
        expect(reducers.submitJobReducer(undefined, {})).toEqual({
            error: null,
            fetched: null,
            fetching: null,
            jobuid: '',
        });
    });

    it('should handle SUBMITTING JOB', () => {
        expect(reducers.submitJobReducer(
            {
                error: null,
                fetched: false,
                fetching: false,
                jobuid: '',
            },
            { type: 'SUBMITTING_JOB' },
        )).toEqual({
            error: null,
            fetched: false,
            fetching: true,
            jobuid: '',
        });
    });

    it('should handle JOB SUBMITTED SUCCESS', () => {
        expect(reducers.submitJobReducer(
            {
                error: null,
                fetched: false,
                fetching: true,
                jobuid: '',
            },
            {
                jobuid: '1234',
                type: 'JOB_SUBMITTED_SUCCESS',
            },
        )).toEqual({
            error: null,
            fetched: true,
            fetching: false,
            jobuid: '1234',
        });
    });

    it('should handle JOB SUBMITTED ERROR', () => {
        expect(reducers.submitJobReducer(
            {
                error: null,
                fetched: false,
                fetching: true,
                jobuid: '',
            },
            {
                error: 'Oh no a bad error',
                type: 'JOB_SUBMITTED_ERROR',
            },
        )).toEqual({
            error: 'Oh no a bad error',
            fetched: false,
            fetching: false,
            jobuid: '',
        });
    });

    it('should handle CLEAR JOB INFO', () => {
        expect(reducers.submitJobReducer(
            {
                error: null,
                fetched: true,
                fetching: false,
                jobuid: '12345',
            },
            { type: 'CLEAR_JOB_INFO' },
        )).toEqual({
            error: null,
            fetched: false,
            fetching: false,
            jobuid: '',
        });
    });
});

describe('rerunExport Reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.rerunExportReducer(undefined, {})).toEqual({
            data: [],
            error: null,
            fetched: null,
            fetching: null,
        });
    });

    it('should handle RERUNNING_EXPORT', () => {
        expect(reducers.rerunExportReducer(
            {
                data: [],
                error: null,
                fetched: false,
                fetching: false,
            },
            {
                type: 'RERUNNING_EXPORT',
            },
        )).toEqual({
            data: '',
            error: null,
            fetched: false,
            fetching: true,
        });
    });

    it('should handle RERUN_EXPORT_SUCCESS', () => {
        expect(reducers.rerunExportReducer(
            {
                data: [],
                error: null,
                fetched: false,
                fetching: false,
            },
            {
                exportReRun: { data: [{ thisIs: 'a fake export rerun' }] },
                type: 'RERUN_EXPORT_SUCCESS',
            },
        )).toEqual({
            data: [{ thisIs: 'a fake export rerun' }],
            error: null,
            fetched: true,
            fetching: false,
        });
    });

    it('should handle RERUN_EXPORT_ERROR', () => {
        expect(reducers.rerunExportReducer(
            {
                data: [],
                error: null,
                fetched: false,
                fetching: false,
            },
            {
                error: 'This is an error',
                type: 'RERUN_EXPORT_ERROR',
            },
        )).toEqual({
            data: '',
            error: 'This is an error',
            fetched: false,
            fetching: false,
        });
    });

    it('should handle CLEAR_RERUN_INFO', () => {
        expect(reducers.rerunExportReducer(
            {
                data: [],
                error: null,
                fetched: false,
                fetching: false,
            },
            {
                type: 'CLEAR_RERUN_INFO',

            },
        )).toEqual({
            data: '',
            error: null,
            fetched: false,
            fetching: false,
        });
    });
});

describe('updatePermissions Reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.updatePermissionReducer(undefined, {})).toEqual({
            error: null,
            updated: null,
            updating: null,
        });
    });

    it('should handle UPDATING_PERMISSION', () => {
        expect(reducers.updatePermissionReducer(
            {
                error: null,
                updated: false,
                updating: false,
            },
            {
                type: 'UPDATING_PERMISSION',
            },
        )).toEqual({
            error: null,
            updated: false,
            updating: true,
        });
    });

    it('should handle UPDATE_PERMISSION_SUCCESS', () => {
        expect(reducers.updatePermissionReducer(
            {
                error: null,
                updated: false,
                updating: false,
            },
            {
                type: 'UPDATE_PERMISSION_SUCCESS',
            },
        )).toEqual({
            error: null,
            updated: true,
            updating: false,
        });
    });

    it('should handle UPDATE_PERMISSION_ERROR', () => {
        expect(reducers.updatePermissionReducer(
            {
                error: null,
                updated: false,
                updating: true,
            },
            {
                error: 'This is an error',
                type: 'UPDATE_PERMISSION_ERROR',
            },
        )).toEqual({
            error: 'This is an error',
            updated: false,
            updating: false,
        });
    });
});
