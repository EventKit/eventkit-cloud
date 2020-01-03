
import * as actions from '../../actions/datacartActions';

describe('export actions', () => {
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

    it('updateAoiInfo should return passed in json', () => {
        expect(actions.updateAoiInfo({
            description: 'description',
            geojson,
            geomType: 'Polygon',
            title: 'title',
        })).toEqual({
            description: 'description',
            geojson,
            geomType: 'Polygon',
            title: 'title',
            type: 'UPDATE_AOI_INFO',
        });
    });

    it('updateExportInfo should return passed in json', () => {
        expect(actions.updateExportInfo({
            areaStr: 'areaStr',
            datapackDescription: 'datapackDescription',
            exportName: 'exportName',
            layers: ['layer1'],
            projectName: 'projectName',
            providers: ['provider1'],
        })).toEqual({
            exportInfo: {
                areaStr: 'areaStr',
                datapackDescription: 'datapackDescription',
                exportName: 'exportName',
                layers: ['layer1'],
                projectName: 'projectName',
                providers: ['provider1'],
            },
            type: 'UPDATE_EXPORT_INFO',
        });
    });

    it('clearExportInfo should return CLEAR_EXPORT_INFO', () => {
        expect(actions.clearExportInfo()).toEqual({
            type: 'CLEAR_EXPORT_INFO',
        });
    });

    describe('submitJob action', () => {
        it('should return the proper types', () => {
            expect(actions.submitJob().types).toEqual([
                actions.types.JOB_SUBMITTED_ERROR,
                actions.types.JOB_SUBMITTED_SUCCESS,
                actions.types.SUBMITTING_JOB,
            ]);
        });

        it('onSuccess should return uid', () => {
            const rep = { data: { uid: '123' } };
            expect(actions.submitJob().onSuccess(rep)).toEqual({ jobuid: '123' });
        });

        it('should return the passed in data', () => {
            const data = { stuff: 'other stuff' };
            expect(actions.submitJob(data).data).toEqual(data);
        });
    });

    it('clearAoiInfo should return type CLEAR_AOI_INFO and no action', () => {
        expect(actions.clearAoiInfo()).toEqual({
            type: 'CLEAR_AOI_INFO',
        });
    });

    it('clearJobInfo should dispatch CLEAR_JOB_INFO', () => {
        expect(actions.clearJobInfo()).toEqual({
            type: 'CLEAR_JOB_INFO',
        });
    });

    describe('updateDataCartPermissions', () => {
        it('should return the correct types', () => {
            expect(actions.updateDataCartPermissions('', {}).types).toEqual([
                actions.types.UPDATE_PERMISSION_ERROR,
                actions.types.UPDATE_PERMISSION_SUCCESS,
                actions.types.UPDATING_PERMISSION,
            ]);
        });

        it('should return the correct data', () => {
            const permissions = { value: 'test' };
            expect(actions.updateDataCartPermissions('', permissions).data).toEqual({
                permissions,
                visibility: permissions.value,
            });
        });
    });

    describe('rerunExport', () => {
        it('should return the correct types', () => {
            expect(actions.rerunExport('').types).toEqual([
                actions.types.RERUN_EXPORT_ERROR,
                actions.types.RERUN_EXPORT_SUCCESS,
                actions.types.RERUNNING_EXPORT,
            ]);
        });

        it('onSuccess should return the data as exportReRun', () => {
            const rep = { data: { test: 'data' } };
            expect(actions.rerunExport('').onSuccess(rep)).toEqual({
                exportReRun: { data: rep.data },
            });
        });
    });

    it('clearReRunInfo should return type CLEAR_RERUN_INFO and no action', () => {
        expect(actions.clearReRunInfo()).toEqual({
            type: 'CLEAR_RERUN_INFO',
        });
    });
});
