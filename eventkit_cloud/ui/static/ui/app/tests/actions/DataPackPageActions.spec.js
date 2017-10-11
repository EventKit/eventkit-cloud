import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as actions from '../../actions/DataPackPageActions';
import types from '../../actions/actionTypes';
import React from 'react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('DataPackList actions', () => {
    
    it('getRuns should return runs from "api/runs/filter"', () => {
        var mock = new MockAdapter(axios, {delayResponse: 1000});
        mock.onPost('/api/runs/filter').reply(200, expectedRuns, {link: '<www.link.com>; rel="next",something else', 'content-range': 'range 1-12/24'});
        const expectedActions = [
            {type: types.FETCHING_RUNS},
            {type: types.RECEIVED_RUNS, runs: expectedRuns, nextPage: true, range: '12/24'}
        ];

        const store = mockStore({runsList: {}});

        return store.dispatch(actions.getRuns())
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('deleteRuns should dispatch deleting and deleted actions', () => {
        var mock = new MockAdapter(axios, {delayResponse: 1000});

        mock.onDelete('/api/runs/123456789').reply(204);
        const expectedActions = [
            {type: types.DELETING_RUN},
            {type: types.DELETED_RUN},
        ];

        const store = mockStore({deleteRuns: {}});

        return store.dispatch(actions.deleteRuns('123456789'))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions);
            });
    });

    it('setPageOrder should return type SET_PAGE_ORDER and the order', () => {
        const order = 'featured';
        expect(actions.setPageOrder(order)).toEqual(
            {
                type: types.SET_PAGE_ORDER,
                order: order
            }
        );
    });

    it('setPageView should return type SET_PAGE_VIEW and the view', () => {
        const view = 'map';
        expect(actions.setPageView(view)).toEqual(
            {
                type: types.SET_PAGE_VIEW,
                view: view
            }
        );
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
