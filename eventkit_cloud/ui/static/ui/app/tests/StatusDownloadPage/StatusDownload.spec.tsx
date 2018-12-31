import * as React from 'react';
import * as sinon from 'sinon';
import { createShallow } from '@material-ui/core/test-utils';
import { browserHistory } from 'react-router';
import Joyride from 'react-joyride';
import Paper from '@material-ui/core/Paper';
import PageLoading from '../../components/common/PageLoading';
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

    const getProps = () => ({
        runs: [],
        runIds: [],
        detailsFetched: null,
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
        router: {
            params: {
                jobuid: '123456789',
            },
        },
        location,
        getDatacartDetails: sinon.spy(),
        clearDataCartDetails: sinon.spy(),
        deleteRun: sinon.spy(),
        rerunExport: sinon.spy(),
        clearReRunInfo: sinon.spy(),
        updateExpirationDate: sinon.spy(),
        updateDataCartPermissions: sinon.spy(),
        cloneExport: sinon.spy(),
        cancelProviderTask: sinon.spy(),
        getProviders: sinon.spy(),
        viewedJob: sinon.spy(),
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}, options = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<StatusDownload {...props} />, {
            context: { config },
            ...options,
        });
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should have the correct initial state', () => {
        setup({}, { disableLifecycleMethods: true });
        expect(wrapper.state()).toEqual(wrapper.instance().getInitialState());
    });

    it('should render all the basic components', () => {
        expect(wrapper.find('form')).toHaveLength(1);
        expect(wrapper.find(Paper)).toHaveLength(1);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(DataCartDetails)).toHaveLength(0);
        const nextProps = getProps();
        nextProps.detailsFetched = true;
        nextProps.runs = [{ ...exampleRun }];
        nextProps.runIds = [exampleRun.uid];
        wrapper.setProps(nextProps);
        expect(wrapper.find(DataCartDetails)).toHaveLength(1);
        expect(wrapper.find(Joyride)).toHaveLength(1);
    });

    it('should render a loading icon if data has not been received yet', () => {
        expect(wrapper.find(PageLoading)).toHaveLength(1);
        expect(wrapper.state().isLoading).toBe(true);
    });

    it('should render the no datapack message', () => {
        const nextProps = getProps();
        nextProps.detailsFetched = true;
        wrapper.setProps(nextProps);
        expect(wrapper.find('.qa-StatusDownload-NoDatapack')).toHaveLength(1);
        expect(wrapper.find(DataCartDetails)).toHaveLength(0);
    });

    it('should display the circular progress if deleting', () => {
        let nextProps = getProps();
        nextProps.detailsFetched = true;
        nextProps.runs = [{ ...exampleRun }];
        nextProps.runs[0].zipfile_url = null;
        nextProps.runIds = [exampleRun.uid];
        wrapper.setProps(nextProps);
        expect(wrapper.find(PageLoading)).toHaveLength(0);
        nextProps = getProps();
        nextProps.runDeletion.deleting = true;
        wrapper.setProps(nextProps);
        expect(wrapper.find(PageLoading)).toHaveLength(1);
    });

    it('should call getDatacartDetails, getProviders, joyrideAddSteps and startTimer when shallowed', () => {
        const timerStub = sinon.stub(StatusDownload.prototype, 'startTimer');
        const joyrideSpy = sinon.spy(StatusDownload.prototype, 'joyrideAddSteps');
        setup();
        expect(props.getDatacartDetails.calledOnce).toBe(true);
        expect(props.getDatacartDetails.calledWith('123456789')).toBe(true);
        expect(props.getProviders.calledOnce).toBe(true);
        expect(timerStub.calledOnce).toBe(true);
        expect(joyrideSpy.calledOnce).toBe(true);
        timerStub.restore();
        StatusDownload.prototype.componentDidMount = sinon.spy();
        joyrideSpy.restore();
    });

    it('componentDidUpdate should call browserHistory push if a run has been deleted', () => {
        const pushStub = sinon.stub(browserHistory, 'push');
        const nextProps = getProps();
        nextProps.runDeletion.deleted = true;
        wrapper.setProps(nextProps);
        expect(pushStub.calledOnce).toBe(true);
        expect(pushStub.calledWith('/exports')).toBe(true);
    });

    it('componentDidUpdate should set error state on export rerun error', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const nextProps = getProps();
        const error = [{ detail: 'this is an error' }];
        nextProps.exportReRun.error = error;
        wrapper.setProps(nextProps);
        expect(stateStub.calledWith({ error })).toBe(true);
        stateStub.restore();
    });

    it('componentDidUpdate should handle reRun of datacartDetails', () => {
        const timerStub = sinon.stub(instance, 'startTimer');
        const nextProps = getProps();
        nextProps.getDatacartDetails = sinon.spy();
        nextProps.exportReRun.fetched = true;
        nextProps.exportReRun.data = [{ ...exampleRun }];
        wrapper.setProps(nextProps);
        expect(nextProps.getDatacartDetails.calledOnce).toBe(true);
        expect(timerStub.calledOnce).toBe(true);
        timerStub.restore();
    });

    it('componentDidUpdate should handle expiration update', () => {
        const nextProps = getProps();
        nextProps.getDatacartDetails = sinon.spy();
        nextProps.expirationState.updated = true;
        wrapper.setProps(nextProps);
        expect(nextProps.getDatacartDetails.calledOnce).toBe(true);
        expect(nextProps.getDatacartDetails.calledWith(props.router.params.jobuid)).toBe(true);
    });

    it('componentDidUpdate should handle permission update', () => {
        const nextProps = getProps();
        nextProps.getDatacartDetails = sinon.spy();
        nextProps.permissionState.updated = true;
        wrapper.setProps(nextProps);
        expect(nextProps.getDatacartDetails.calledOnce).toBe(true);
        expect(nextProps.getDatacartDetails.calledWith(props.router.params.jobuid)).toBe(true);
    });

    it('componentDidUpdate should handle fetched datacartDetails and set isLoading false', () => {
        jest.useFakeTimers();
        const stateStub = sinon.stub(instance, 'setState');
        const clearStub = sinon.stub(window, 'clearInterval');
        const { timer } = wrapper.instance();
        const setStub = sinon.stub(window, 'setTimeout');
        setStub.onFirstCall().callsFake(callback => callback());
        const nextProps = getProps();
        nextProps.getDatacartDetails = sinon.spy();
        nextProps.detailsFetched = true;
        nextProps.runs = [{ ...exampleRun }];
        nextProps.runIds = [exampleRun.uid];
        wrapper.setProps(nextProps);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ isLoading: false })).toBe(true);
        expect(clearStub.calledOnce).toBe(true);
        expect(clearStub.calledWith(timer)).toBe(true);
        expect(setStub.called).toBe(true);
        expect(nextProps.getDatacartDetails.calledOnce).toBe(true);
        setStub.restore();
        stateStub.restore();
        clearStub.restore();
    });

    it('componentDidUpdate should handle fetched datacartDetails and not clear interval zipfile_url is null', () => {
        jest.useFakeTimers();
        const clearStub = sinon.stub(window, 'clearInterval');
        const nextProps = getProps();
        nextProps.detailsFetched = true;
        nextProps.runs = [{ ...exampleRun }];
        nextProps.runs[0].zipfile_url = null;
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
        wrapper.instance().joyride = { reset: sinon.spy() };
        const stateSpy = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().callback(callbackData);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ isRunning: false }));
        stateSpy.restore();
    });

    it('componentDidUpdate should handle fetched datacartDetails and not clear interval when tasks are not completed', () => {
        jest.useFakeTimers();
        const clearStub = sinon.stub(window, 'clearInterval');
        const nextProps = getProps();
        nextProps.detailsFetched = true;
        nextProps.runs = [{ ...exampleRun }];
        nextProps.runs[0].status = 'INCOMPLETE';
        nextProps.runs[0].provider_tasks[0].tasks[0].status = 'RUNNING';
        wrapper.setProps(nextProps);
        expect(clearStub.calledOnce).toBe(false);
        expect(clearStub.calledWith(wrapper.instance().timer)).toBe(false);
        clearStub.restore();
    });

    it('componentWillUnmount should clear cart details and timers', () => {
        const { timer } = wrapper.instance();
        const { timeout } = wrapper.instance();
        const timerStub = sinon.spy((global as any).window, 'clearInterval');
        const timeoutStub = sinon.stub((global as any).window, 'clearTimeout');
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
        wrapper.setProps({ width: 'xs' });
        let padding = wrapper.instance().getMarginPadding();
        expect(padding).toEqual('0px');
        wrapper.setProps({ width: 'lg' });
        padding = wrapper.instance().getMarginPadding();
        expect(padding).toEqual('30px');
    });

    it('getErrorMessage should return null if no error in state', () => {
        expect(wrapper.state().error).toBe(null);
        expect(wrapper.instance().getErrorMessage()).toBe(null);
    });

    it('getErrorMessage should return an array of error messages', () => {
        const error = [{ detail: 'one' }, { detail: 'two' }];
        wrapper.setState({ error });
        wrapper.instance().forceUpdate();
        wrapper.update();
        const ret = wrapper.instance().getErrorMessage();
        expect(ret).toHaveLength(2);
    });

    it('startTimer should create a timer interval', () => {
        const setIntMock = sinon.spy(callback => callback());
        window.setInterval = setIntMock;
        wrapper.instance().startTimer();
        expect(setIntMock.calledOnce).toBe(true);
        expect(props.getDatacartDetails.calledOnce).toBe(true);
    });

    it('clearError should set error state to null', () => {
        const stateStub = sinon.stub(instance, 'setState');
        wrapper.instance().clearError();
        expect(stateStub.calledWith({ error: null })).toBe(true);
        stateStub.restore();
    });

    it('should refresh the entire component when location changes', () => {
        const setStateSpy = sinon.spy(instance, 'setState');
        wrapper.setProps({
            location: { pathname: '/new/path' },
        });
        expect(setStateSpy.calledWith(wrapper.instance().getInitialState())).toBe(true);
    });
});
