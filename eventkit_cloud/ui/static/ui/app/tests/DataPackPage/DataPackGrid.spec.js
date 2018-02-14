import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import {DataPackGridItem} from '../../components/DataPackPage/DataPackGridItem';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {GridList, GridTile} from 'material-ui/GridList'
import DataPackGrid from '../../components//DataPackPage/DataPackGrid';

const providers = [
    {
        "id": 2,
        "model_url": "http://cloud.eventkit.dev/api/providers/osm",
        "type": "osm",
        "license": null,
        "created_at": "2017-08-15T19:25:10.844911Z",
        "updated_at": "2017-08-15T19:25:10.844919Z",
        "uid": "bc9a834a-727a-4779-8679-2500880a8526",
        "name": "OpenStreetMap Data (Themes)",
        "slug": "osm",
        "preview_url": "",
        "service_copyright": "",
        "service_description": "OpenStreetMap vector data provided in a custom thematic schema. \n\nData is grouped into separate tables (e.g. water, roads...).",
        "layer": null,
        "level_from": 0,
        "level_to": 10,
        "zip": false,
        "display": true,
        "export_provider_type": 2
    },
]

beforeAll(() => {
    DataPackGridItem.prototype.initMap = new sinon.spy();
});

afterAll(() => {
    DataPackGridItem.prototype.initMap.restore();
});

describe('DataPackGrid component', () => {
    const muiTheme = getMuiTheme();
    const props = {runs: getRuns(),providers: providers, user: {data: {user: {username: 'admin'}}}, onRunDelete: () => {}};

    it('should render a DataPackGridItem for each run passed in', () => {
        const getColumnSpy = new sinon.spy(DataPackGrid.prototype, 'getColumns');
        const wrapper = mount(<DataPackGrid {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
        expect(wrapper.find(GridList)).toHaveLength(1);
        expect(wrapper.find(DataPackGridItem)).toHaveLength(3);
        expect(getColumnSpy.calledOnce).toBe(true);
        getColumnSpy.restore();
    });

    it('getColumns should return 2, 3, or 4 depending on screensize', () => {
        const wrapper = shallow(<DataPackGrid {...props}/>);
        window.resizeTo(700, 800);
        expect(window.innerWidth).toEqual(700);
        let cols = wrapper.instance().getColumns();
        expect(cols).toEqual(2);

        window.resizeTo(1000, 1100);
        expect(window.innerWidth).toEqual(1000);
        cols = wrapper.instance().getColumns();
        expect(cols).toEqual(3);

        window.resizeTo(1300, 1400);
        expect(window.innerWidth).toEqual(1300);
        cols = wrapper.instance().getColumns();
        expect(cols).toEqual(4);
    });
});

function getRuns() {
    return [
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
    },
    {
        "uid": "c7466114-8c0c-4160-8383-351414b11e37",
        "url": "http://cloud.eventkit.dev/api/runs/c7466114-8c0c-4160-8383-351414b11e37",
        "started_at": "2017-03-10T15:52:29.311523Z",
        "finished_at": "2017-03-10T15:52:33.612Z",
        "duration": "0:00:04.301278",
        "user": "notAdmin",
        "status": "COMPLETED",
        "job": {
            "uid": "5488a864-89f2-4e9c-8370-18291ecdae4a",
            "name": "Test2",
            "event": "Test2 event",
            "description": "Test2 description",
            "url": "http://cloud.eventkit.dev/api/jobs/5488a864-89f2-4e9c-8370-18291ecdae4a",
            "extent": {
                "type": "Feature",
                "properties": {
                    "uid": "5488a864-89f2-4e9c-8370-18291ecdae4a",
                    "name": "Test2"
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
            "published": true
        },
        "provider_tasks": [],
        "zipfile_url": "http://cloud.eventkit.dev/downloads/c7466114-8c0c-4160-8383-351414b11e37/TestGPKG-WMS-TestProject-eventkit-20170310.zip",
        "expiration": "2017-03-24T15:52:29.311458Z"
    },
    {
        "uid": "282816a6-7d16-4f59-a1a9-18764c6339d6",
        "url": "http://cloud.eventkit.dev/api/runs/282816a6-7d16-4f59-a1a9-18764c6339d6",
        "started_at": "2017-03-10T15:52:18.796929Z",
        "finished_at": "2017-03-10T15:52:27.500Z",
        "duration": "0:00:08.703092",
        "user": "admin",
        "status": "COMPLETED",
        "job": {
            "uid": "78bbd59a-4066-4e30-8460-c7b0093a0d7a",
            "name": "Test3",
            "event": "Test3 event",
            "description": "Test3 description",
            "url": "http://cloud.eventkit.dev/api/jobs/78bbd59a-4066-4e30-8460-c7b0093a0d7a",
            "extent": {
                "type": "Feature",
                "properties": {
                    "uid": "78bbd59a-4066-4e30-8460-c7b0093a0d7a",
                    "name": "Test3"
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
            "published": true
        },
        "provider_tasks": [],
        "zipfile_url": "http://cloud.eventkit.dev/downloads/282816a6-7d16-4f59-a1a9-18764c6339d6/TestGPKG-OSM-CLIP-TestProject-eventkit-20170310.zip",
        "expiration": "2017-03-24T15:52:18.796854Z"
    },]
}
