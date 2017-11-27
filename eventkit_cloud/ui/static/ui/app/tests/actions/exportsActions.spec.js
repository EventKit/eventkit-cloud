import * as actions from '../../actions/exportsActions'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import nock from 'nock'
import types from '../../actions/actionTypes'
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
        selection: {"type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "bbox": [1,1,1,1],
                        "geometry" : {
                            "type": "Polygon",
                            "coordinates": [[[1,1],[1,1],[1,1],[1,1]]]
                        }}]},
        tags : [],

    };

    it('updateAoiInfo should return passed in json', () => {
        expect(actions.updateAoiInfo({
            geojson,
            geomType: 'Polygon',
            title: 'title',
            description: 'description',
        })).toEqual({
            type: 'UPDATE_AOI_INFO',
            geojson,
            geomType: 'Polygon',
            title: 'title',
            description: 'description',
        });
    });

    it('updateExportInfo should return passed in json', () => {
        expect(actions.updateExportInfo({
            exportName: 'exportName', 
            datapackDescription: 'datapackDescription', 
            projectName: 'projectName', 
            makePublic: true, 
            providers: ['provider1'], 
            areaStr: 'areaStr', 
            layers: ['layer1']
        })).toEqual({
            type: 'UPDATE_EXPORT_INFO',
            exportInfo: {
                exportName: 'exportName', 
                datapackDescription: 'datapackDescription', 
                projectName: 'projectName', 
                makePublic: true, 
                providers: ['provider1'], 
                areaStr: 'areaStr', 
                layers: ['layer1']
            }
        });
    });

    it('clearExportInfo should return CLEAR_EXPORT_INFO', () => {
        expect(actions.clearExportInfo()).toEqual({
            type: 'CLEAR_EXPORT_INFO'
        });
    });

    it('valid job should post', () => {
        const mock = new MockAdapter(axios, {delayResponse: 1000});

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

    it('closeDrawer should close drawer', () => {
        const expectedActions = [
            {type: types.CLOSING_DRAWER},
            {type: types.CLOSED_DRAWER},
        ];

        const store = mockStore({drawer: 'open'});
        return store.dispatch(actions.closeDrawer())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('openDrawer should open drawer', () => {
        const expectedActions = [
            {type: types.OPENING_DRAWER},
            {type: types.OPENED_DRAWER},
        ];

        const store = mockStore({drawer: 'closed'});
        return store.dispatch(actions.openDrawer())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
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

