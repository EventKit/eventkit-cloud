import fetch from 'isomorphic-fetch';
import types from './actionTypes';

export function getJobs() {
    return (dispatch) => {
        dispatch({type: types.FETCHING_JOBS});
        return fetch('/api/jobs?format=json', {
            method: 'GET',
        }).then(response => {
            console.log(response);
            // response.json().then(data => {
            //     console.log(data);
            //     return data;
            }).then(jobs => {
                dispatch({type: types.RECEIVED_JOBS, jobs: fakeData})
            // })
        }).catch(error => {
            dispatch({type: types.FETCH_JOBS_ERROR, error: error});
        });
    }
}

const fakeData = [{
        "uid": "83cd02d4-5249-48ef-b019-48e81a8df411",
        "url": "https://cloud.eventkit.dev/api/jobs/83cd02d4-5249-48ef-b019-48e81a8df411",
        "name": "Bentiu_SouthSudan_imagery",
        "description": "Support to RFT South Sudan project",
        "event": "RFT_SS",
        "created_at": "2017-02-16T22:26:01.498628Z",
        "owner": "owner",
        "extent": {
            "type": "Feature",
            "properties": {
                "name": "Bentiu_SouthSudan_imagery",
                "uid": "83cd02d4-5249-48ef-b019-48e81a8df411"
            },
            "geometry": {
                "coordinates": [
                    [
                        [
                            29.764538,
                            9.203782
                        ],
                        [
                            29.764538,
                            9.306116
                        ],
                        [
                            29.841785,
                            9.306116
                        ],
                        [
                            29.841785,
                            9.203782
                        ],
                        [
                            29.764538,
                            9.203782
                        ]
                    ]
                ],
                "type": "Polygon"
            }
        },
        "region": null,
        "published": false
    },
    {
        "uid": "4a5a805f-b7a4-428c-b4d9-0a273e6f9013",
        "url": "https://cloud.eventkit.dev/api/jobs/4a5a805f-b7a4-428c-b4d9-0a273e6f9013",
        "name": "Homs_16Feb_OSM",
        "description": "Demo5 workflow, OSM data and tiles only",
        "event": "Demo5",
        "created_at": "2017-02-16T17:52:07.027265Z",
        "owner": "stranger",
        "extent": {
            "type": "Feature",
            "properties": {
                "name": "Homs_16Feb_OSM",
                "uid": "4a5a805f-b7a4-428c-b4d9-0a273e6f9013"
            },
            "geometry": {
                "coordinates": [
                    [
                        [
                            36.62138,
                            34.641682
                        ],
                        [
                            36.62138,
                            34.805629
                        ],
                        [
                            36.793728,
                            34.805629
                        ],
                        [
                            36.793728,
                            34.641682
                        ],
                        [
                            36.62138,
                            34.641682
                        ]
                    ]
                ],
                "type": "Polygon"
            }
        },
        "region": null,
        "published": true
    },
    {
        "uid": "c9f9f98c-2522-41eb-9296-7a2a0f14b3c8",
        "url": "https://cloud.eventkit.dev/api/jobs/c9f9f98c-2522-41eb-9296-7a2a0f14b3c8",
        "name": "Homs_16Feb_Imagery",
        "description": "Demo5 workflow, imagery only",
        "event": "Demo5",
        "created_at": "2017-02-16T16:59:07.408367Z",
        "owner": "owner",
        "extent": {
            "type": "Feature",
            "properties": {
                "name": "Homs_16Feb_Imagery",
                "uid": "c9f9f98c-2522-41eb-9296-7a2a0f14b3c8"
            },
            "geometry": {
                "coordinates": [
                    [
                        [
                            36.62138,
                            34.641682
                        ],
                        [
                            36.62138,
                            34.805629
                        ],
                        [
                            36.793728,
                            34.805629
                        ],
                        [
                            36.793728,
                            34.641682
                        ],
                        [
                            36.62138,
                            34.641682
                        ]
                    ]
                ],
                "type": "Polygon"
            }
        },
        "region": null,
        "published": true
    },
    {
        "uid": "b849e77c-947a-4100-8953-1a766c904c1c",
        "url": "https://cloud.eventkit.dev/api/jobs/b849e77c-947a-4100-8953-1a766c904c1c",
        "name": "Homs_demo",
        "description": "demo test",
        "event": "Syria tests",
        "created_at": "2017-02-15T15:54:45.143502Z",
        "owner": "stranger",
        "extent": {
            "type": "Feature",
            "properties": {
                "name": "Homs_demo",
                "uid": "b849e77c-947a-4100-8953-1a766c904c1c"
            },
            "geometry": {
                "coordinates": [
                    [
                        [
                            36.705093,
                            34.722426
                        ],
                        [
                            36.705093,
                            34.742741
                        ],
                        [
                            36.729126,
                            34.742741
                        ],
                        [
                            36.729126,
                            34.722426
                        ],
                        [
                            36.705093,
                            34.722426
                        ]
                    ]
                ],
                "type": "Polygon"
            }
        },
        "region": null,
        "published": true
    },]