import React from 'react';
import sinon from 'sinon';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { browserHistory } from 'react-router';
import Paper from 'material-ui/Paper';
import CircularProgress from 'material-ui/CircularProgress';
import { StatusDownload } from '../../components/StatusDownloadPage/StatusDownload';
import DataCartDetails from '../../components/StatusDownloadPage/DataCartDetails';
import DataPackAoiInfo from '../../components/StatusDownloadPage/DataPackAoiInfo';
import CustomScrollbar from '../../components/CustomScrollbar';
import Joyride from 'react-joyride';

describe('StatusDownload component', () => {
    const muiTheme = getMuiTheme();

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
        zipfile_url: 'http://cloud.eventkit.test/downloads/6870234f-d876-467c-a332-65fdf0399a0d/TestGPKG-WMTS-TestProject-eventkit-20170310.zip',
        expiration: '2017-03-24T15:52:35.637258Z',
    };

    const tooltipStyle = {
        backgroundColor: 'white',
        borderRadius: '0',
        color: 'black',
        mainColor: '#ff4456',
        textAlign: 'left',
        header: {
            textAlign: 'left',
            fontSize: '20px',
            borderColor: '#4598bf'
        },
        main: {
            paddingTop: '20px',
            paddingBottom: '20px',
        },

        button: {
            color: 'white',
            backgroundColor: '#4598bf'
        },
        skip: {
            color: '#8b9396'
        },
        back: {
            color: '#8b9396'
        },
        hole: {
            backgroundColor: 'rgba(226,226,226, 0.2)',
        }
    };

    const getProps = () => (
        {
            params: {
                jobuid: '123456789',
            },
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
            getUsers: () => {},
            getGroups: () => {},
        }
    );

    const getWrapper = props => (
        mount(<StatusDownload {...props} />, {
            context: { muiTheme, config },
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            },
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

    it('should render all the basic components', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('form')).toHaveLength(1);
        expect(wrapper.find(Paper)).toHaveLength(2);
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

    it('should call getDatacartDetails, getProviders, joyrideAddSteps and startTimer when mounted', () => {
        StatusDownload.prototype.componentDidMount = didMount;
        const props = getProps();
        props.getDatacartDetails = sinon.spy();
        props.getProviders = sinon.spy();
        const timerStub = sinon.stub(StatusDownload.prototype, 'startTimer');
        const joyrideSpy = new sinon.spy(StatusDownload.prototype, 'joyrideAddSteps');
        const wrapper = getWrapper(props);
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
        expect(props.getDatacartDetails.calledWith(props.params.jobuid)).toBe(true);
    });

    it('componentWillReceiveProps should handle permission update', () => {
        const props = getProps();
        props.getDatacartDetails = sinon.spy();
        const wrapper = getWrapper(props);
        const nextProps = getProps();
        nextProps.permissionState.updated = true;
        wrapper.setProps(nextProps);
        expect(props.getDatacartDetails.calledOnce).toBe(true);
        expect(props.getDatacartDetails.calledWith(props.params.jobuid)).toBe(true);
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
        expect(setTimeout.mock.calls.length).toBe(10);
        expect(setTimeout.mock.calls[3][1]).toBe(0);
        clearStub.restore();
    });

    it('joyrideAddSteps should set state for steps in tour', () => {
        const steps = [{title: 'DataPack Info', text: 'This is the name of the datapack.', selector: '.qa-DataCartDetails-table-name', position: 'bottom', style: tooltipStyle, isFixed:true,},
            {title: 'DataPack Status', text: 'This is the status of the datapack.  Here you can change the expiration date and permission of the datapack.', selector: '.qa-DataCartDetails-table-export', position: 'bottom', style: tooltipStyle, isFixed:true,},
            {title: 'DataPack Download Options', text: 'Here you will find download options for the datapack. <br> Each data source has its own table where you can view status of the current downloadable files.', selector: '.qa-DatapackDetails-div-downloadOptions', position: 'bottom', style: tooltipStyle, isFixed:true,},
            {title: 'Other Options', text: 'There are options availble to run datapack export again, clone the dataoack or delete the datapack', selector: '.qa-DataCartDetails-div-otherOptions', position: 'bottom', style: tooltipStyle, isFixed:true,},
            {title: 'General Information', text: 'Here you will find general information related to the datapack.  ', selector: '.qa-DataCartDetails-table-generalInfo', position: 'bottom', style: tooltipStyle, isFixed:true,},
            {title: 'AIO', text: 'This is the selected area of interest for the datapack.', selector: '.qa-DataCartDetails-div-map', position: 'bottom', style: tooltipStyle, isFixed:true,},
            {title: 'Export Information', text: 'This contains information specific to the export.', selector: '.qa-DataCartDetails-table-exportInfo', position: 'bottom', style: tooltipStyle, isFixed:true,},
        ];
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(StatusDownload.prototype, 'setState');
        wrapper.instance().joyrideAddSteps(steps);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({steps: steps}));
        stateSpy.restore();
    });

    it('handleJoyride should set state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(StatusDownload.prototype, 'setState');
        wrapper.instance().handleJoyride();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({isRunning: false}));
        stateSpy.restore();
    });

    it('callback function should stop tour if close is clicked', () => {
        const callbackData = {
            action: "close",
            index: 2,
            step: {
                position: "bottom",
                selector: ".qa-DataPackLinkButton-RaisedButton",
                style: tooltipStyle,
                text: "Click here to Navigate to Create a DataPack.",
                title: "Create DataPack",
            },
            type: "step:before",
        }
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(StatusDownload.prototype, 'setState');
        wrapper.instance().callback(callbackData);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({isRunning: false}));
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
        expect(setTimeout.mock.calls.length).toBe(10);
        expect(setTimeout.mock.calls[3][1]).toBe(0);
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
        const wrapper = getWrapper(props);
        window.resizeTo(600, 700);
        wrapper.update();
        let padding = wrapper.instance().getMarginPadding();
        expect(padding).toEqual('0px');
        window.resizeTo(800, 900);
        wrapper.update();
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
        const ret = wrapper.instance().getErrorMessage();
        expect(ret).toHaveLength(2);
    });

    it('handleClone should call props.cloneExport', () => {
        const props = getProps();
        props.cloneExport = sinon.spy();
        const wrapper = getWrapper(props);
        const cart = { uid: '123' };
        const providers = ['1', '2'];
        wrapper.instance().handleClone(cart, providers);
        expect(props.cloneExport.calledOnce).toBe(true);
        expect(props.cloneExport.calledWith(cart, providers));
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
});
