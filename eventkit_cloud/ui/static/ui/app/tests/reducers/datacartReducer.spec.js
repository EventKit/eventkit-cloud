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
            providerEstimates: {},
            exportOptions: {},
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
            providerEstimates: {},
            exportOptions: {},
        });
    });
});

describe('submitJobReducer', () => {
    it('should return the intial state', () => {
        expect(reducers.submitJobReducer(undefined, {})).toEqual({
            fetching: null,
            fetched: null,
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

describe('rerunExport Reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.rerunExportReducer(undefined, {})).toEqual({
            fetching: null,
            fetched: null,
            data: [],
            error: null,
        });
    });

    it('should handle RERUNNING_EXPORT', () => {
        expect(reducers.rerunExportReducer(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            },
            {
                type: 'RERUNNING_EXPORT',
            },
        )).toEqual({
            fetching: true,
            fetched: false,
            data: '',
            error: null,
        });
    });

    it('should handle RERUN_EXPORT_SUCCESS', () => {
        expect(reducers.rerunExportReducer(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            },
            {
                type: 'RERUN_EXPORT_SUCCESS', exportReRun: { data: [{ thisIs: 'a fake export rerun' }] },
            },
        )).toEqual({
            fetching: false,
            fetched: true,
            data: [{ thisIs: 'a fake export rerun' }],
            error: null,
        });
    });

    it('should handle RERUN_EXPORT_ERROR', () => {
        expect(reducers.rerunExportReducer(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            },
            {
                type: 'RERUN_EXPORT_ERROR',
                error: 'This is an error',
            },
        )).toEqual({
            fetching: false,
            fetched: false,
            data: '',
            error: 'This is an error',
        });
    });

    it('should handle CLEAR_RERUN_INFO', () => {
        expect(reducers.rerunExportReducer(
            {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            },
            {
                type: 'CLEAR_RERUN_INFO',

            },
        )).toEqual({
            fetching: false,
            fetched: false,
            data: '',
            error: null,
        });
    });
});

describe('updatePermissions Reducer', () => {
    it('it should return the initial state', () => {
        expect(reducers.updatePermissionReducer(undefined, {})).toEqual({
            updating: null,
            updated: null,
            error: null,
        });
    });

    it('should handle UPDATING_PERMISSION', () => {
        expect(reducers.updatePermissionReducer(
            {
                updating: false,
                updated: false,
                error: null,
            },
            {
                type: 'UPDATING_PERMISSION',
            },
        )).toEqual({
            updating: true,
            updated: false,
            error: null,
        });
    });

    it('should handle UPDATE_PERMISSION_SUCCESS', () => {
        expect(reducers.updatePermissionReducer(
            {
                updating: false,
                updated: false,
                error: null,
            },
            {
                type: 'UPDATE_PERMISSION_SUCCESS',
            },
        )).toEqual({
            updating: false,
            updated: true,
            error: null,
        });
    });

    it('should handle UPDATE_PERMISSION_ERROR', () => {
        expect(reducers.updatePermissionReducer(
            {
                updating: true,
                updated: false,
                error: null,
            },
            {
                type: 'UPDATE_PERMISSION_ERROR',
                error: 'This is an error',
            },
        )).toEqual({
            updating: false,
            updated: false,
            error: 'This is an error',
        });
    });
});
