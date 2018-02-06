import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import TimerMixin from 'react-timer-mixin';
import { browserHistory } from 'react-router';
import Paper from 'material-ui/Paper';
import CircularProgress from 'material-ui/CircularProgress';
import { StatusDownload } from '../../components/StatusDownloadPage/StatusDownload';
import DataCartDetails from '../../components/StatusDownloadPage/DataCartDetails';
import CustomScrollbar from '../../components/CustomScrollbar';


describe('StatusDownload component', () => {
    beforeAll(() => {
        DataCartDetails.prototype.initializeOpenLayers = sinon.stub();
    });

    afterAll(() => {
        DataCartDetails.prototype.initializeOpenLayers.restore();
    });
    const muiTheme = getMuiTheme();

    const config = { MAX_DATAPACK_EXPIRATION_DAYS: '30' };
    const providers = [
        {
            "id": 2,
            "model_url": "http://cloud.eventkit.dev/api/providers/osm",
            "type": "osm",
            "license": {
                "slug": "osm",
                "name": "Open Database License (ODbL) v1.0",
                "text": "ODC Open Database License (ODbL)."
            },
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
    const tasks = [
        {
            "duration": "0:00:15.317672",
            "errors": [],
            "estimated_finish": "",
            "finished_at": "2017-05-15T15:29:04.356182Z",
            "name": "OverpassQuery",
            "progress": 100,
            "started_at": "2017-05-15T15:28:49.038510Z",
            "status": "SUCCESS",
            "uid": "fcfcd526-8949-4c26-a669-a2cf6bae1e34",
            "result": {
                "size": "1.234 MB",
                "url": "http://cloud.eventkit.dev/api/tasks/fcfcd526-8949-4c26-a669-a2cf6bae1e34",
            },
            "display": true,
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
            "started_at": "2017-05-15T15:28:49.038510Z",
            "status": "PENDING",
            "uid": "fcfcd526-8949-4c26-a669-a2cf6bae1e34",
            "result": {
                "size" : "1.234 MB",
                "url": "http://cloud.eventkit.dev/api/tasks/fcfcd526-8949-4c26-a669-a2cf6bae1e34",
            },
            "display": true,
        }
    ];
    const providerTasks = [{
        "name": "OpenStreetMap Data (Themes)",
        "status": "COMPLETED",
        "tasks": tasks,
        "uid": "e261d619-2a02-4ba5-a58c-be0908f97d04",
        "url": "http://cloud.eventkit.dev/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04",
        "slug":"osm"
    }];
    const providerTasksRunning = [{
        "name": "OpenStreetMap Data (Themes)",
        "status": "COMPLETED",
        "tasks": tasksRunning,
        "uid": "e261d619-2a02-4ba5-a58c-be0908f97d04",
        "url": "http://cloud.eventkit.dev/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04",
        "slug":"osm"
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
                "published": false,
                "formats": [
                    "Geopackage"
                ]
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
                "published": false,
                "formats": [
                    "Geopackage"
                ]
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
            updateExpiration: {
                updating: false,
                updated: false,
                error: null,
            },
            updatePermission: {
                updating: false,
                updated: false,
                error: null,
            },
            permissionState: {
                updating: false,
                updated: false,
                error: null,
            },
            expirationState: {
                updating: false,
                updated: false,
                error: null,
            },
            providers:providers,
            user: {
                data: {
                    user: {
                        username: 'admin'
                    },
                },
            },
            getDatacartDetails: (jobuid) => {},
            deleteRun: (jobuid) => {},
            rerunExport: (jobuid) => {},
            clearReRunInfo: () => {},
            updateExpirationDate: (uid, expiration) => {},
            updatePermission: (jobuid, value) => {},
            cloneExport: (cartDetails, providerArray) => {},
            cancelProviderTask: (providerUid) => {},
            getProviders: () => {},
        }
    };

    const getWrapper = (props) => {
        return mount(<StatusDownload {...props}/>, {
            context: {muiTheme, config: config},
            childContextTypes: {
                muiTheme: React.PropTypes.object
            }
        });
    };

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
        const updateSpy = sinon.spy(StatusDownload.prototype, 'componentWillReceiveProps');
        // const pushSpy = sinon.spy(browserHistory, 'push');
        browserHistory.push = sinon.spy();
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

    it('should call getDatacartDetails, getProviders, and startTimer when mounted', () => {
        let props = getProps();
        props.getDatacartDetails = sinon.spy();
        props.getProviders = sinon.spy();
        let startTimerSpy = sinon.spy(StatusDownload.prototype, 'startTimer');
        const mountSpy = sinon.spy(StatusDownload.prototype, 'componentDidMount');
        const wrapper = getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(props.getDatacartDetails.calledOnce).toBe(true);
        expect(props.getDatacartDetails.calledWith('123456789')).toBe(true);
        expect(props.getProviders.calledOnce).toBe(true);
        expect(startTimerSpy.calledOnce).toBe(true);
        startTimerSpy.restore();
        mountSpy.restore();
    });

    it('should remove timer before unmounting', () => {
        const props = getProps();
        const timerSpy = sinon.spy(TimerMixin, 'clearInterval');
        const wrapper = getWrapper(props);
        const timer = wrapper.instance().timer;
        wrapper.unmount();
        expect(timerSpy.calledOnce).toBe(true);
        expect(timerSpy.calledWith(timer)).toBe(true);
        timerSpy.restore();
    });

    it('startTimer should create a timer interval', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const intervalSpy = sinon.spy(TimerMixin, 'setInterval');
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
        const propsSpy = sinon.spy(StatusDownload.prototype, 'componentWillReceiveProps');
        const stateSpy = sinon.spy(StatusDownload.prototype, 'setState');
        const clearSpy = sinon.spy(TimerMixin, 'clearInterval');
        const wrapper = getWrapper(props);
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
        wrapper.setProps(nextProps);
        expect(wrapper.find(CircularProgress)).toHaveLength(0);
        expect(propsSpy.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({isLoading: false})).toBe(true);
        expect(clearSpy.calledOnce).toBe(true);
        expect(clearSpy.calledWith(wrapper.instance().timer)).toBe(true);
        expect(setTimeout.mock.calls.length).toBe(12);
        expect(setTimeout.mock.calls[4][1]).toBe(270000);
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
        const propsSpy = sinon.spy(StatusDownload.prototype, 'componentWillReceiveProps');
        const clearSpy = sinon.spy(TimerMixin, 'clearInterval');
        const wrapper = getWrapper(props);
        wrapper.setProps(nextProps);
        expect(propsSpy.calledOnce).toBe(true);
        expect(clearSpy.calledOnce).toBe(false);
        expect(clearSpy.calledWith(wrapper.instance().timer)).toBe(false);
        expect(setTimeout.mock.calls.length).toBe(11);
        expect(setTimeout.mock.calls[3][1]).toBe(0);
        StatusDownload.prototype.componentWillReceiveProps.restore();
        clearSpy.restore();
        propsSpy.restore();
    });

    it('should handle reRun of datacartDetails', () => {
        const props = getProps();
        let nextProps = getProps();
        nextProps.exportReRun.fetched = true;
        nextProps.exportReRun.data = exampleRun[0];
        const propsSpy = sinon.spy(StatusDownload.prototype, 'componentWillReceiveProps');
        const wrapper = getWrapper(props);
        const timerSpy = sinon.spy(StatusDownload.prototype, 'startTimer');
        wrapper.setProps(nextProps);
        expect(propsSpy.calledOnce).toBe(true);
        expect(timerSpy.calledOnce).toBe(true);
        StatusDownload.prototype.componentWillReceiveProps.restore();
        timerSpy.restore();
        propsSpy.restore();
    });

    it('should handle Clone of datacartDetails', () => {
        let props = getProps();
        props.cloneExport = sinon.spy();
        const cloneSpy = sinon.spy(StatusDownload.prototype, 'handleClone');
        const wrapper = getWrapper(props);
        wrapper.instance().handleClone();
        expect(cloneSpy.calledOnce).toBe(true);
        expect(props.cloneExport.calledOnce).toBe(true);
        cloneSpy.restore();
    });

    it('should call componentWillReceiveProps when Expiration is updated', () => {
        const props = getProps();
        const nextProps = getProps();
        nextProps.updateExpiration.updated = true;
        const updateSpy = sinon.spy(StatusDownload.prototype, 'componentWillReceiveProps');
        props.getDatacartDetails = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setProps(nextProps);
        expect(updateSpy.calledOnce).toBe(true);
        updateSpy.restore();
    });

    it('should call componentWillReceiveProps when Permission is updated', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const updateSpy = sinon.spy(StatusDownload.prototype, 'componentWillReceiveProps');
        const nextProps = getProps();
        nextProps.updatePermission.updated = true;
        wrapper.setProps(nextProps);
        expect(updateSpy.calledOnce).toBe(true);
        updateSpy.restore();
    });

    it('should set error state on export rerun error', () => {
        const props = getProps();
        const stateSpy = sinon.spy(StatusDownload.prototype, 'setState');
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        const error = [{ detail: 'this is an error' }];
        nextProps.exportReRun.error = error;
        wrapper.setProps(nextProps);
        expect(stateSpy.calledWith({ error })).toBe(true);
        stateSpy.restore();
    });

    it('getErrorMessage should return null if no error in state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.state().error).toBe(null);
        expect(wrapper.instance().getErrorMessage()).toBe(null);
    });

    it('getErrorMessage should return an array of error messages', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const error = [{ detail: 'one' }, { detail: 'two' }];
        wrapper.setState({ error });
        const ret = wrapper.instance().getErrorMessage();
        expect(ret).toHaveLength(2);
    });

    it('clearError should set error state to null', () => {
        const props = getProps();
        const stateSpy = sinon.spy(StatusDownload.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().clearError();
        expect(stateSpy.calledWith({ error: null })).toBe(true);
        stateSpy.restore();
    });
});
