import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Paper from 'material-ui/Paper'
import CircularProgress from 'material-ui/CircularProgress';
import { StatusDownload } from '../../components/StatusDownloadPage/StatusDownload';
import  DataCartDetails from '../../components/StatusDownloadPage/DataCartDetails';
import '../../components/tap_events'
import CustomScrollbar from '../../components/CustomScrollbar';
import TimerMixin from 'react-timer-mixin';
import {browserHistory} from 'react-router';

describe('StatusDownload component', () => {
    beforeAll(() => {
        DataCartDetails.prototype._initializeOpenLayers = new sinon.spy();
    });

    afterAll(() => {
        DataCartDetails.prototype._initializeOpenLayers.restore();
    });
    const muiTheme = getMuiTheme();

    const tasks = [
        {
            "duration": "0:00:15.317672",
            "errors": [],
            "estimated_finish": "",
            "finished_at": "2017-05-15T15:29:04.356182Z",
            "name": "OverpassQuery",
            "progress": 100,
            "result": {},
            "started_at": "2017-05-15T15:28:49.038510Z",
            "status": "SUCCESS",
            "uid": "fcfcd526-8949-4c26-a669-a2cf6bae1e34",
            "result": {
                "url": "http://cloud.eventkit.dev/api/tasks/fcfcd526-8949-4c26-a669-a2cf6bae1e34",
            },
        }
    ];
    const tasksRunning = [
        {
            "duration": "0:00:15.317672",
            "errors": [],
            "estimated_finish": "",
            "finished_at": "2017-05-15T15:29:04.356182Z",
            "name": "OverpassQuery",
            "progress": 100,
            "result": {},
            "started_at": "2017-05-15T15:28:49.038510Z",
            "status": "PENDING",
            "uid": "fcfcd526-8949-4c26-a669-a2cf6bae1e34",
            "result": {
                "url": "http://cloud.eventkit.dev/api/tasks/fcfcd526-8949-4c26-a669-a2cf6bae1e34",
            },
        }
    ];
    const providerTasks = [{
        "name": "OpenStreetMap Data (Themes)",
        "status": "COMPLETED",
        "tasks": tasks,
        "uid": "e261d619-2a02-4ba5-a58c-be0908f97d04",
        "url": "http://cloud.eventkit.dev/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04"
    }];
    const providerTasksRunning = [{
        "name": "OpenStreetMap Data (Themes)",
        "status": "COMPLETED",
        "tasks": tasksRunning,
        "uid": "e261d619-2a02-4ba5-a58c-be0908f97d04",
        "url": "http://cloud.eventkit.dev/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04"
    }];
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
            "provider_tasks": providerTasks,
            "zipfile_url": "http://cloud.eventkit.dev/downloads/6870234f-d876-467c-a332-65fdf0399a0d/TestGPKG-WMTS-TestProject-eventkit-20170310.zip",
            "expiration": "2017-03-24T15:52:35.637258Z"
        }];
    const exampleRunTaskRunning = [
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
            "provider_tasks": providerTasksRunning,
            "zipfile_url": "http://cloud.eventkit.dev/downloads/6870234f-d876-467c-a332-65fdf0399a0d/TestGPKG-WMTS-TestProject-eventkit-20170310.zip",
            "expiration": "2017-03-24T15:52:35.637258Z"
        }];

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
        let props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('form')).toHaveLength(1);
        expect(wrapper.find(Paper)).toHaveLength(1);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(DataCartDetails)).toHaveLength(0);
        let nextProps = getProps();
        nextProps.datacartDetails.fetched = true;
        nextProps.datacartDetails.data = exampleRun;
        wrapper.setProps(nextProps);
        expect(wrapper.find(DataCartDetails)).toHaveLength(1);
    });

    it('should render a loading icon if data has not been received yet', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
        expect(wrapper.state().isLoading).toBe(true);
    });

    it('should call browserHistory push if a run has been deleted', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const updateSpy = new sinon.spy(StatusDownload.prototype, 'componentWillReceiveProps');
        // const pushSpy = new sinon.spy(browserHistory, 'push');
        browserHistory.push = new sinon.spy();
        const nextProps = getProps();
        nextProps.runDeletion.deleted = true;
        wrapper.setProps(nextProps);
        expect(updateSpy.calledOnce).toBe(true);
        expect(browserHistory.push.calledOnce).toBe(true);
        expect(browserHistory.push.calledWith('/exports')).toBe(true);
        updateSpy.restore();
    });

    it('should display the circular progress if deleting', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        let nextProps = getProps();
        nextProps.datacartDetails.fetched = true;
        nextProps.datacartDetails.data = exampleRun;
        wrapper.setProps(nextProps);
        expect(wrapper.find(CircularProgress)).toHaveLength(0);
        nextProps = getProps();
        nextProps.runDeletion.deleting = true;
        wrapper.setProps(nextProps);
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
    });

    it('should call getDatacartDetails, startTimer, and addEventListener when mounted', () => {
        let props = getProps();
        props.getDatacartDetails = new sinon.spy();
        let startTimerSpy = new sinon.spy(StatusDownload.prototype, 'startTimer');
        const mountSpy = new sinon.spy(StatusDownload.prototype, 'componentDidMount');
        const eventSpy = new sinon.spy(window, 'addEventListener');
        const wrapper = getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(props.getDatacartDetails.calledOnce).toBe(true);
        expect(props.getDatacartDetails.calledWith('123456789')).toBe(true);
        expect(startTimerSpy.calledOnce).toBe(true);
        expect(eventSpy.calledOnce).toBe(true);
        expect(eventSpy.calledWith('resize', wrapper.instance().handleResize)).toBe(true);
        startTimerSpy.restore();
        mountSpy.restore();
        eventSpy.restore();
    });

    it('should remove timer and eventlistener before unmounting', () => {
        const props = getProps();
        const timerSpy = new sinon.spy(TimerMixin, 'clearInterval');
        const eventSpy = new sinon.spy(window, 'removeEventListener');
        const wrapper = getWrapper(props);
        const timer = wrapper.instance().timer;
        const resize = wrapper.instance().handleResize;
        wrapper.unmount();
        expect(timerSpy.calledOnce).toBe(true);
        expect(timerSpy.calledWith(timer)).toBe(true);
        expect(eventSpy.calledOnce).toBe(true);
        expect(eventSpy.calledWith('resize', resize)).toBe(true);
        eventSpy.restore();
        timerSpy.restore();
    });

    it('startTimer should create a timer interval', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const intervalSpy = new sinon.spy(TimerMixin, 'setInterval');
        expect(intervalSpy.called).toBe(false);
        wrapper.instance().startTimer();
        expect(intervalSpy.calledOnce).toBe(true);
        intervalSpy.restore();
    });

    it('should handle fetched datacartDetails and remove loading icon', () => {
        jest.useFakeTimers();
        const props = getProps();
        let nextProps = getProps();
        nextProps.datacartDetails.fetched = true;
        nextProps.datacartDetails.data = exampleRun;
        const propsSpy = new sinon.spy(StatusDownload.prototype, 'componentWillReceiveProps');
        const stateSpy = new sinon.spy(StatusDownload.prototype, 'setState');
        const clearSpy = new sinon.spy(TimerMixin, 'clearInterval');
        const wrapper = getWrapper(props);
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
        wrapper.setProps(nextProps);
        expect(wrapper.find(CircularProgress)).toHaveLength(0);
        expect(propsSpy.calledOnce).toBe(true);
        expect(stateSpy.calledTwice).toBe(true);
        expect(stateSpy.calledWith({datacartDetails: exampleRun})).toBe(true);
        expect(stateSpy.calledWith({isLoading: false})).toBe(true);
        expect(clearSpy.calledOnce).toBe(true);
        expect(clearSpy.calledWith(wrapper.instance().timer)).toBe(true);
        expect(setTimeout.mock.calls.length).toBe(7);
        expect(setTimeout.mock.calls[3][1]).toBe(270000);
        stateSpy.restore();
        propsSpy.restore();
        clearSpy.restore();
        propsSpy.restore();
    });

    it('should handle fetched datacartDetails and not clear interval when tasks are not completed', () => {
        jest.useFakeTimers();
        const props = getProps();
        let nextProps = getProps();
        nextProps.datacartDetails.fetched = true;
        nextProps.datacartDetails.data = exampleRunTaskRunning;
        const propsSpy = new sinon.spy(StatusDownload.prototype, 'componentWillReceiveProps');
        const stateSpy = new sinon.spy(StatusDownload.prototype, 'setState');
        const clearSpy = new sinon.spy(TimerMixin, 'clearInterval');
        const wrapper = getWrapper(props);
        wrapper.setProps(nextProps);
        expect(propsSpy.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({datacartDetails: exampleRunTaskRunning})).toBe(true);
        expect(clearSpy.calledOnce).toBe(false);
        expect(clearSpy.calledWith(wrapper.instance().timer)).toBe(false);
        expect(setTimeout.mock.calls.length).toBe(3);
        expect(setTimeout.mock.calls[0][1]).toBe(0);
        StatusDownload.prototype.setState.restore();
        StatusDownload.prototype.componentWillReceiveProps.restore();
        clearSpy.restore();
        propsSpy.restore();
    });

    it('should handle reRun of datacartDetails', () => {
        const props = getProps();
        let nextProps = getProps();
        nextProps.exportReRun.fetched = true;
        nextProps.exportReRun.data = exampleRun[0];
        const propsSpy = new sinon.spy(StatusDownload.prototype, 'componentWillReceiveProps');
        const stateSpy = new sinon.spy(StatusDownload.prototype, 'setState');
        const wrapper = getWrapper(props);
        const timerSpy = new sinon.spy(StatusDownload.prototype, 'startTimer');
        wrapper.setProps(nextProps);
        expect(propsSpy.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({datacartDetails: exampleRun})).toBe(true);
        expect(timerSpy.calledOnce).toBe(true);
        StatusDownload.prototype.setState.restore();
        StatusDownload.prototype.componentWillReceiveProps.restore();
        timerSpy.restore();
        propsSpy.restore();
    });

    it('should handle Clone of datacartDetails', () => {
        let props = getProps();
        props.cloneExport = new sinon.spy();
        const cloneSpy = new sinon.spy(StatusDownload.prototype, 'handleClone');
        const wrapper = getWrapper(props);
        wrapper.instance().handleClone();
        expect(cloneSpy.calledOnce).toBe(true);
        expect(props.cloneExport.calledOnce).toBe(true);
        cloneSpy.restore();
    });

    it('screenSizeUpdate should force the component to update', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const updateSpy = new sinon.spy(StatusDownload.prototype, 'forceUpdate');
        wrapper.instance().handleResize();
        expect(updateSpy.calledOnce).toBe(true);
        updateSpy.restore();
    });

});
