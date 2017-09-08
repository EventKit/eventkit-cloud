import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as actions from '../../actions/statusDownloadActions';
import types from '../../actions/actionTypes';
import React from 'react';
import axios from 'axios';
import expect from 'expect';
import MockAdapter from 'axios-mock-adapter';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('statusDownload actions', () => {

    it('getDatacartDetails should return a specific run from "api/runs"', () => {
        var mock = new MockAdapter(axios, {delayResponse: 1000});
        mock.onGet('/api/runs?job_uid=123456789').reply(200, expectedRuns);
        const expectedActions = [
            {type: types.GETTING_DATACART_DETAILS},
            {type: types.DATACART_DETAILS_RECEIVED, datacartDetails: {data: expectedRuns}}
        ];

        const store = mockStore({datacartDetails: {}});

        return store.dispatch(actions.getDatacartDetails('123456789'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('deleteRun should dispatch deleting and deleted actions', () => {
        var mock = new MockAdapter(axios, {delayResponse: 1000});

        mock.onDelete('/api/runs/123456789').reply(204);
        const expectedActions = [
            {type: types.DELETING_RUN},
            {type: types.DELETED_RUN},
        ];

        const store = mockStore({deleteRuns: {}});

        return store.dispatch(actions.deleteRun('123456789'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('reRunExport should return a specific run from "api/runs"', () => {
        var mock = new MockAdapter(axios, {delayResponse: 1000});
        mock.onPost('/api/jobs/123456789/run').reply(200, expectedRuns);
        const expectedActions = [
            {type: types.RERUNNING_EXPORT},
            {type: types.RERUN_EXPORT_SUCCESS, exportReRun: {data: expectedRuns}}
        ];

        const store = mockStore({exportReRun: {}});

        return store.dispatch(actions.rerunExport('123456789'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('clearReRunInfo should return type CLEAR_RERUN_INFO and no action', () => {
        expect(actions.clearReRunInfo()).toEqual({
            type: 'CLEAR_RERUN_INFO',
        });
    });

    it('cancelProviderTask should dispatch canceling and canceled actions', () => {
        var mock = new MockAdapter(axios, {delayResponse: 1000});

        mock.onPatch('/api/provider_tasks/123456789').reply(204);
        const expectedActions = [
            {type: types.CANCELING_PROVIDER_TASK},
            {type: types.CANCELED_PROVIDER_TASK},
        ];

        const store = mockStore({cancelProviderTask: {}});

        return store.dispatch(actions.cancelProviderTask('123456789'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('updateExpiration should dispatch a patch and update the expiration date', () => {
        var mock = new MockAdapter(axios, {delayResponse: 1000});

        mock.onPatch('/api/runs/123456789').reply(204);
        const expectedActions = [
            {type: types.UPDATING_EXPIRATION},
            {type: types.UPDATE_EXPIRATION_SUCCESS},
        ];

        const store = mockStore({updateExpiration: {}});

        return store.dispatch(actions.updateExpiration('123456789', '2021/2/1'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('updatePermission should dispatch a patch and update the published state on the job', () => {
        var mock = new MockAdapter(axios, {delayResponse: 1000});

        mock.onPatch('/api/jobs/123456789').reply(204);
        const expectedActions = [
            {type: types.UPDATING_PERMISSION},
            {type: types.UPDATE_PERMISSION_SUCCESS},
        ];

        const store = mockStore({updatePermission: {}});

        return store.dispatch(actions.updatePermission('123456789', 'true'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });
});

const expectedRuns = [
    {
        "uid": "6870234f-d876-467c-a332-65fdf0399a0d",
        "url": "http://cloud.eventkit.dev/api/runs/6870234f-d876-467c-a332-65fdf0399a0d",
        "started_at": "2017-03-10T15:52:35.637331Z",
        "finished_at": "2017-03-10T15:52:39.837Z",
        "duration": "0:00:04.199825",
        "user": "admin",
        "status": "COMPLETED",
        "job": {
            "uid": "7643f806-1484-4446-b498-7ddaa65d011a",
            "name": "Test1",
            "event": "Test1 event",
            "description": "Test1 description",
            "url": "http://cloud.eventkit.dev/api/jobs/7643f806-1484-4446-b498-7ddaa65d011a",
            "extent": {
                "type": "Feature",
                "properties": {
                    "uid": "7643f806-1484-4446-b498-7ddaa65d011a",
                    "name": "Test1"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [
                                -0.077419,
                                50.778155
                            ],
                            [
                                -0.077419,
                                50.818517
                            ],
                            [
                                -0.037251,
                                50.818517
                            ],
                            [
                                -0.037251,
                                50.778155
                            ],
                            [
                                -0.077419,
                                50.778155
                            ]
                        ]
                    ]
                }
            },
            "selection": "",
            "published": false
        },
        "provider_tasks": [],
        "zipfile_url": "http://cloud.eventkit.dev/downloads/6870234f-d876-467c-a332-65fdf0399a0d/TestGPKG-WMTS-TestProject-eventkit-20170310.zip",
        "expiration": "2017-03-24T15:52:35.637258Z"
    }];
