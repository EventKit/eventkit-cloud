import React from 'react';
import sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import { browserHistory } from 'react-router';
import Joyride from 'react-joyride';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';
import { StatusDownload } from '../../components/StatusDownloadPage/StatusDownload';
import DataCartDetails from '../../components/StatusDownloadPage/DataCartDetails';
import DataPackAoiInfo from '../../components/StatusDownloadPage/DataPackAoiInfo';
import CustomScrollbar from '../../components/CustomScrollbar';

describe('StatusDownload component', () => {
    let shallow;

    beforeAll(() => {
        shallow = createShallow();
    });

    const config = { MAX_DATAPACK_EXPIRATION_DAYS: '30' };
    const providers = [
        {
            id: 2,
            type: 'one',
            uid: '1',
            name: 'one',
            slug: 'osm',
            service_description: 'test one',
            display: true,
        },
    ];

    const tasks = [
        {
            duration: '0:00:15.317672',
            errors: [],
            estimated_finish: '',
            finished_at: '2017-05-15T15:29:04.356182Z',
            name: 'OverpassQuery',
            progress: 100,
            started_at: '2017-05-15T15:28:49.038510Z',
            status: 'SUCCESS',
            uid: 'fcfcd526-8949-4c26-a669-a2cf6bae1e34',
            result: {
                size: '1.234 MB',
                url: 'http://cloud.eventkit.test/api/tasks/fcfcd526-8949-4c26-a669-a2cf6bae1e34',
            },
            display: true,
        },
    ];

    const providerTasks = [{
        name: 'OpenStreetMap Data (Themes)',
        status: 'COMPLETED',
        tasks,
        uid: 'e261d619-2a02-4ba5-a58c-be0908f97d04',
        url: 'http://cloud.eventkit.test/api/provider_tasks/e261d619-2a02-4ba5-a58c-be0908f97d04',
        slug: 'osm',
    }];

    const exampleRun = {
        uid: '6870234f-d876-467c-a332-65fdf0399a0d',
        url: 'http://cloud.eventkit.test/api/runs/6870234f-d876-467c-a332-65fdf0399a0d',
        started_at: '2017-03-10T15:52:35.637331Z',
        finished_at: '2017-03-10T15:52:39.837Z',
        duration: '0:00:04.199825',
        user: 'admin',
        status: 'COMPLETED',
        job: {
            uid: '7643f806-1484-4446-b498-7ddaa65d011a',
            name: 'Test1',
            event: 'Test1 event',
            description: 'Test1 description',
            url: 'http://cloud.eventkit.test/api/jobs/7643f806-1484-4446-b498-7ddaa65d011a',
            selection: '',
            formats: [
                'Geopackage',
            ],
            permissions: {
                value: 'PRIVATE',
                groups: {},
                members: {},
            },
        },
        provider_tasks: providerTasks,
        zipfile_url: 'http://cloud.eventkit.test/downloads/68/TestGPKG-WMTS-TestProject-eventkit-20170310.zip',
        expiration: '2017-03-24T15:52:35.637258Z',
    };

    const location = {};

    const getProps = () => (
        {
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
            providers,
            user: {
                data: {
                    user: {
                        username: 'admin',
                    },
                },
            },
            users: {
                fetched: false,
                fetching: false,
                users: [],
                error: null,
            },
            groups: {
                fetched: false,
                fetching: false,
                groups: [],
                error: null,
            },
            router: {
                params: {
                    jobuid: '123456789',
                },
            },
            location,
            getDatacartDetails: () => {},
            clearDataCartDetails: () => {},
            deleteRun: () => {},
            rerunExport: () => {},
            clearReRunInfo: () => {},
            updateExpirationDate: () => {},
            updateDataCartPermissions: () => {},
            cloneExport: () => {},
            cancelProviderTask: () => {},
            getProviders: () => {},
            viewedJob: () => {},
            getUsers: () => {},
            getGroups: () => {},
            ...global.eventkit_test_props,
        }
    );

    const getWrapper = props => (
        shallow(<StatusDownload {...props} />, {
            context: { config },
        })
    );

    const didMount = StatusDownload.prototype.componentDidMount;

    beforeAll(() => {
        StatusDownload.prototype.componentDidMount = sinon.spy();
        DataPackAoiInfo.prototype.render = sinon.spy(() => null);
        DataPackAoiInfo.prototype.initializeOpenLayers = sinon.spy();
    });

    afterAll(() => {
        StatusDownload.prototype.componentDidMount = didMount;
        DataPackAoiInfo.prototype.render.restore();
        DataPackAoiInfo.prototype.initializeOpenLayers.restore();
    });

    it('should have the correct initial state', () => {
        const wrapper = getWrapper(getProps());
        expect(wrapper.state()).toEqual(wrapper.instance().getInitialState());
    });

    it('should render all the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('form')).toHaveLength(1);
        expect(wrapper.find(Paper)).toHaveLength(1);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(DataCartDetails)).toHaveLength(0);
        const nextProps = getProps();
        nextProps.datacartDetails.fetched = true;
        nextProps.datacartDetails.data = [{ ...exampleRun }];
        wrapper.setProps(nextProps);
        expect(wrapper.find(DataCartDetails)).toHaveLength(1);
        expect(wrapper.find(Joyride)).toHaveLength(1);
    });

    it('should render a loading icon if data has not been received yet', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
        expect(wrapper.state().isLoading).toBe(true);
    });

    it('should render the no datapack message', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        nextProps.datacartDetails.fetched = true;
        nextProps.datacartDetails.data = [];
        wrapper.setProps(nextProps);
        expect(wrapper.find('.qa-StatusDownload-NoDatapack')).toHaveLength(1);
        expect(wrapper.find(DataCartDetails)).toHaveLength(0);
    });

    it('should display the circular progress if deleting', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        let nextProps = getProps();
        nextProps.datacartDetails.fetched = true;
        nextProps.datacartDetails.data = [{ ...exampleRun }];
        nextProps.datacartDetails.data[0].zipfile_url = null;
        wrapper.setProps(nextProps);
        expect(wrapper.find(CircularProgress)).toHaveLength(0);
        nextProps = getProps();
        nextProps.runDeletion.deleting = true;
        wrapper.setProps(nextProps);
        expect(wrapper.find(CircularProgress)).toHaveLength(1);
    });

    it('should call getDatacartDetails, getProviders, joyrideAddSteps and startTimer when shallowed', () => {
        StatusDownload.prototype.componentDidMount = didMount;
        const props = getProps();
        props.getDatacartDetails = sinon.spy();
        props.getProviders = sinon.spy();
        const timerStub = sinon.stub(StatusDownload.prototype, 'startTimer');
        const joyrideSpy = sinon.spy(StatusDownload.prototype, 'joyrideAddSteps');
        getWrapper(props);
        expect(props.getDatacartDetails.calledOnce).toBe(true);
        expect(props.getDatacartDetails.calledWith('123456789')).toBe(true);
        expect(props.getProviders.calledOnce).toBe(true);
        expect(timerStub.calledOnce).toBe(true);
        expect(joyrideSpy.calledOnce).toBe(true);
        timerStub.restore();
        StatusDownload.prototype.componentDidMount = sinon.spy();
        joyrideSpy.restore();
    });

    it('componentWillReceiveProps should call browserHistory push if a run has been deleted', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        browserHistory.push = sinon.spy();
        const nextProps = getProps();
        nextProps.runDeletion.deleted = true;
        wrapper.setProps(nextProps);
        expect(browserHistory.push.calledOnce).toBe(true);
        expect(browserHistory.push.calledWith('/exports')).toBe(true);
    });

    it('componentWillReceiveProps should set error state on export rerun error', () => {
        const props = getProps();
        const stateStub = sinon.stub(StatusDownload.prototype, 'setState');
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        const error = [{ detail: 'this is an error' }];
        nextProps.exportReRun.error = error;
        wrapper.setProps(nextProps);
        expect(stateStub.calledWith({ error })).toBe(true);
        stateStub.restore();
    });

    it('componentWillReceiveProps should handle reRun of datacartDetails', () => {
        const props = getProps();
        props.getDatacartDetails = sinon.spy();
        const timerStub = sinon.stub(StatusDownload.prototype, 'startTimer');
        const nextProps = getProps();
        nextProps.exportReRun.fetched = true;
        nextProps.exportReRun.data = [{ ...exampleRun }];
        const wrapper = getWrapper(props);
        wrapper.setProps(nextProps);
        expect(props.getDatacartDetails.calledOnce).toBe(true);
        expect(timerStub.calledOnce).toBe(true);
        timerStub.restore();
    });

    it('componentWillReceiveProps should handle expiration update', () => {
        const props = getProps();
        props.getDatacartDetails = sinon.spy();
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        nextProps.expirationState.updated = true;
        wrapper.setProps(nextProps);
        expect(props.getDatacartDetails.calledOnce).toBe(true);
        expect(props.getDatacartDetails.calledWith(props.router.params.jobuid)).toBe(true);
    });

    it('componentWillReceiveProps should handle permission update', () => {
        const props = getProps();
        props.getDatacartDetails = sinon.spy();
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        nextProps.permissionState.updated = true;
        wrapper.setProps(nextProps);
        expect(props.getDatacartDetails.calledOnce).toBe(true);
        expect(props.getDatacartDetails.calledWith(props.router.params.jobuid)).toBe(true);
    });

    it('componentWillReceiveProps should handle fetched datacartDetails and set isLoading false', () => {
        jest.useFakeTimers();
        const props = getProps();
        props.getDatacartDetails = sinon.spy();
        const stateStub = sinon.stub(StatusDownload.prototype, 'setState');
        const clearStub = sinon.stub(global.window, 'clearInterval');
        const wrapper = getWrapper(props);
        const { timer } = wrapper.instance();
        const setStub = sinon.stub(global.window, 'setTimeout');
        setStub.onFirstCall().callsFake(callback => callback());
        const nextProps = getProps();
        nextProps.datacartDetails.fetched = true;
        nextProps.datacartDetails.data = [{ ...exampleRun }];
        wrapper.setProps(nextProps);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ isLoading: false })).toBe(true);
        expect(clearStub.calledOnce).toBe(true);
        expect(clearStub.calledWith(timer)).toBe(true);
        expect(setStub.called).toBe(true);
        expect(props.getDatacartDetails.calledOnce).toBe(true);
        setStub.restore();
        stateStub.restore();
        clearStub.restore();
    });

    it('componentWillReceiveProps should handle fetched datacartDetails and not clear interval zipfile_url is null', () => {
        jest.useFakeTimers();
        const props = getProps();
        const clearStub = sinon.stub(global.window, 'clearInterval');
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        nextProps.datacartDetails.fetched = true;
        nextProps.datacartDetails.data = [{ ...exampleRun }];
        nextProps.datacartDetails.data[0].zipfile_url = null;
        wrapper.setProps(nextProps);
        expect(clearStub.calledOnce).toBe(false);
        expect(clearStub.calledWith(wrapper.instance().timer)).toBe(false);
        clearStub.restore();
    });

    it('joyrideAddSteps should set state for steps in tour', () => {
        const steps = [
            {
                title: 'DataPack Info',
                text: 'This is the name of the datapack.',
                selector: '.qa-DataCartDetails-table-name',
                position: 'bottom',
                style: {},
                isFixed: true,
            },
        ];
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().joyrideAddSteps(steps);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ steps }));
        stateSpy.restore();
    });

    it('callback function should stop tour if close is clicked', () => {
        const callbackData = {
            action: 'close',
            index: 2,
            step: {
                position: 'bottom',
                selector: '.qa-DataPackLinkButton-Button',
                style: {},
                text: 'Click here to Navigate to Create a DataPack.',
                title: 'Create DataPack',
            },
            type: 'step:before',
        };
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.instance().joyride = { reset: sinon.spy() };
        const stateSpy = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().callback(callbackData);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ isRunning: false }));
        stateSpy.restore();
    });

    it('componentWillReceiveProps should handle fetched datacartDetails and not clear interval when tasks are not completed', () => {
        jest.useFakeTimers();
        const props = getProps();
        const clearStub = sinon.stub(global.window, 'clearInterval');
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        nextProps.datacartDetails.fetched = true;
        nextProps.datacartDetails.data = [{ ...exampleRun }];
        nextProps.datacartDetails.data[0].status = 'INCOMPLETE';
        nextProps.datacartDetails.data[0].provider_tasks[0].tasks[0].status = 'RUNNING';
        wrapper.setProps(nextProps);
        expect(clearStub.calledOnce).toBe(false);
        expect(clearStub.calledWith(wrapper.instance().timer)).toBe(false);
        clearStub.restore();
    });


    it('componentWillUnmount should clear cart details and timers', () => {
        const props = getProps();
        props.clearDataCartDetails = sinon.spy();
        const wrapper = getWrapper(props);
        const { timer } = wrapper.instance();
        const { timeout } = wrapper.instance();
        const timerStub = sinon.spy(global.window, 'clearInterval');
        const timeoutStub = sinon.stub(global.window, 'clearTimeout');
        wrapper.unmount();
        expect(timerStub.called).toBe(true);
        expect(timerStub.calledWith(timer)).toBe(true);
        expect(timeoutStub.called).toBe(true);
        expect(timeoutStub.calledWith(timeout)).toBe(true);
        expect(props.clearDataCartDetails.calledOnce).toBe(true);
        timerStub.restore();
        timeoutStub.restore();
    });

    it('getMarginPadding should return 0px if window size is <= 767', () => {
        const props = getProps();
        props.width = 'xs';
        const wrapper = getWrapper(props);
        let padding = wrapper.instance().getMarginPadding();
        expect(padding).toEqual('0px');
        wrapper.setProps({ width: 'lg' });
        padding = wrapper.instance().getMarginPadding();
        expect(padding).toEqual('30px');
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
        wrapper.update();
        const ret = wrapper.instance().getErrorMessage();
        expect(ret).toHaveLength(2);
    });

    it('handleClone should call props.cloneExport', () => {
        const props = getProps();
        props.cloneExport = sinon.spy();
        const wrapper = getWrapper(props);
        const cart = { uid: '123' };
        const p = ['1', '2'];
        wrapper.instance().handleClone(cart, p);
        expect(props.cloneExport.calledOnce).toBe(true);
        expect(props.cloneExport.calledWith(cart, p));
    });

    it('startTimer should create a timer interval', () => {
        const setIntMock = sinon.spy(callback => callback());
        const props = getProps();
        props.getDatacartDetails = sinon.spy();
        const wrapper = getWrapper(props);
        global.window.setInterval = setIntMock;
        wrapper.instance().startTimer();
        expect(setIntMock.calledOnce).toBe(true);
        expect(props.getDatacartDetails.calledOnce).toBe(true);
    });

    it('clearError should set error state to null', () => {
        const props = getProps();
        const stateStub = sinon.stub(StatusDownload.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().clearError();
        expect(stateStub.calledWith({ error: null })).toBe(true);
        stateStub.restore();
    });

    it('should refresh the entire component when location changes', () => {
        StatusDownload.prototype.componentDidMount = didMount;
        const componentDidMountSpy = sinon.spy(StatusDownload.prototype, 'componentDidMount');
        const componentWillUnmountSpy = sinon.spy(StatusDownload.prototype, 'componentWillUnmount');
        const setStateSpy = sinon.spy(StatusDownload.prototype, 'setState');
        const wrapper = getWrapper(getProps());
        expect(componentDidMountSpy.callCount).toBe(1);
        expect(componentWillUnmountSpy.callCount).toBe(0);
        wrapper.setProps({
            location: { pathname: '/new/path' },
        });
        expect(componentDidMountSpy.callCount).toBe(2);
        expect(componentWillUnmountSpy.callCount).toBe(1);
        expect(setStateSpy.calledWith(wrapper.instance().getInitialState())).toBe(true);
    });
});
