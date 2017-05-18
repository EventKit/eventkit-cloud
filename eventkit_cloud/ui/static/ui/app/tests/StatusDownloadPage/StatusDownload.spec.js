import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Paper from 'material-ui/Paper'
import { StatusDownload } from '../../components/StatusDownloadPage/StatusDownload';
import  DataCartDetails from '../../components/StatusDownloadPage/DataCartDetails';
import '../../components/tap_events'
import isEqual from 'lodash/isEqual';

describe('StatusDownload component', () => {
    const muiTheme = getMuiTheme();
    const exampleRun = [
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

    const exampleRunObject = {
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
        };

    const getProps = () => {
        return {
            params: {
                jobuid: '123456789'
            },
            jobuid: '123456789',
            datacartDetails: {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            },
            runDeletion: {
            deleting: false,
                deleted: false,
                error: null,
            },
            exportReRun: {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            },
            getDatacartDetails: (jobuid) => {},
            deleteRun: (jobuid) => {},
            rerunExport: (jobuid) => {},
            clearReRunInfo: () => {},
            cloneExport: (cartDetails, providerArray) => {},
        }
    };

    const getWrapper = (props) => {
        return mount(<StatusDownload {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object
            }
        });
    }

    it('should render all the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(Paper)).toHaveLength(1);

    });

    it('should call startTimer when mounted', () => {
        let props = getProps();
        let startTimerSpy = new sinon.spy(StatusDownload.prototype, 'startTimer');
        const mountSpy = new sinon.spy(StatusDownload.prototype, 'componentDidMount');
        const wrapper = getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(startTimerSpy.calledOnce).toBe(true);
        startTimerSpy.restore();
    });

    it('should handle fetched datacartDetails', () => {
        const props = getProps();
        const wrapper = shallow(<StatusDownload {...props}/>);
        let nextProps = getProps();
        nextProps.datacartDetails.fetched = true;
        nextProps.datacartDetails.data = exampleRun;
        const propsSpy = new sinon.spy(StatusDownload.prototype, 'componentWillReceiveProps');
        const stateSpy = new sinon.spy(StatusDownload.prototype, 'setState');
        wrapper.setProps(nextProps);
        expect(propsSpy.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        StatusDownload.prototype.setState.restore();
        StatusDownload.prototype.componentWillReceiveProps.restore();
    });

    it('should handle reRun of datacartDetails', () => {
        const props = getProps();
        const wrapper = shallow(<StatusDownload {...props}/>);
        let nextProps = getProps();
        nextProps.exportReRun.fetched = true;
        nextProps.exportReRun.data = exampleRun;
        const propsSpy = new sinon.spy(StatusDownload.prototype, 'componentWillReceiveProps');
        const stateSpy = new sinon.spy(StatusDownload.prototype, 'setState');
        wrapper.setProps(nextProps);
        expect(propsSpy.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        StatusDownload.prototype.setState.restore();
        StatusDownload.prototype.componentWillReceiveProps.restore();
    });

});
