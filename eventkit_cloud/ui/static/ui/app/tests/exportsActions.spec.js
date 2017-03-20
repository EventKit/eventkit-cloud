import * as actions from '../actions/exportsActions'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import nock from 'nock'
import types from '../actions/actionTypes'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter';
const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

describe('export actions', () => {
    let bbox = [-180, -90, 180, 90];

    let geojson = { "type": "FeatureCollection",
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
        };
    let mode = "DRAW_MODE_NORMAL";

    let jobData = {
        name: 'testJobName',
        description: 'testJobDesc',
        event: 'testJobEvent',
        include_zipfile : false,
        published : false,
        provider_tasks : {'provider': ['provider1'], 'formats': ['gpkg']},
        xmin : -180,
        ymin : -90,
        xmax : 180,
        ymax : 90,
        tags : [],

    };

    it('updateBbox should return passed in bbox', () => {
        expect(actions.updateBbox(bbox)).toEqual({
            type: 'UPDATE_BBOX',
            bbox: bbox
        });
    });

    it('updateAoiInfo should return passed in json', () => {
        expect(actions.updateAoiInfo(geojson, 'Polygon', 'title', 'description')).toEqual({
            type: 'UPDATE_AOI_INFO',
            geojson: geojson,
            geomType: 'Polygon',
            title: 'title',
            description: 'description',
        });
    });

    it('updateExportInfo should return passed in json', () => {
        expect(actions.updateExportInfo('exportName', 'datapackDescription', 'projectName', true, ['provider1'], 'area_str', ['layer1'])).toEqual({
            type: 'UPDATE_EXPORT_INFO',
            exportName: 'exportName',
            datapackDescription: 'datapackDescription',
            projectName: 'projectName',
            makePublic: true,
            providers: ['provider1'],
            area_str: 'area_str',
            layers: ['layer1'],
        });
    });

    it('valid job should post', () => {
        const mock = new MockAdapter(axios, {delayResponse: 1000});

        mock.onGet('/api/jobs').reply(200, {});
        mock.onPost('/api/jobs').reply(200, { uid: '123456789' });

        const expectedActions = [{type: types.SUBMITTING_JOB},  { jobuid:'123456789', type: types.JOB_SUBMITTED_SUCCESS, }];

        const store = mockStore({jobSubmit: {jobuid: {}}})
        return store.dispatch(actions.submitJob(jobData))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })
    });

    it('clearAoiInfo should return type CLEAR_AOI_INFO and no action', () => {
        expect(actions.clearAoiInfo()).toEqual({
            type: 'CLEAR_AOI_INFO',
        });
    });

    it('updateMode should return the passed in mode string', () => {
        expect(actions.updateMode(mode)).toEqual({
            type: 'SET_MODE',
            mode: mode
        });
    });

    it('closeDrawer should return type CLOSE_DRAWER', () => {
        expect(actions.closeDrawer()).toEqual({
            type: 'CLOSE_DRAWER'
        });
    });

    it('openDrawer should return type OPEN_DRAWER', () => {
        expect(actions.openDrawer()).toEqual({
            type: 'OPEN_DRAWER'
        });
    });

    it('exportInfoDone should return EXPORT_INFO_DONE and setExportPackageFlag to true', () => {
        expect(actions.exportInfoDone()).toEqual({
            type: 'EXPORT_INFO_DONE',
            setExportPackageFlag: true
        });
    });

    it('stepperNextDisabled should return MAKE_STEPPER_INACTIVE and false', () => {
        expect(actions.stepperNextDisabled()).toEqual({
            type: 'MAKE_STEPPER_INACTIVE',
            stepperNextEnabled: false
        });
    });

    it('stepperNextEnabled should return MAKE_STEPPER_ACTIVE and true', () => {
        expect(actions.stepperNextEnabled()).toEqual({
            type: 'MAKE_STEPPER_ACTIVE',
            stepperNextEnabled: true
        });
    });

});

