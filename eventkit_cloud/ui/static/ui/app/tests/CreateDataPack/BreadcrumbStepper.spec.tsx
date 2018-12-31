import * as React from 'react';
import * as sinon from 'sinon';
import { mount, shallow } from 'enzyme';
import { browserHistory } from 'react-router';
import Warning from '@material-ui/icons/Warning';
import Button from '@material-ui/core/Button';
import NavigationArrowBack from '@material-ui/icons/ArrowBack';
import NavigationArrowForward from '@material-ui/icons/ArrowForward';
import NavigationCheck from '@material-ui/icons/Check';
import PageLoading from '../../components/common/PageLoading';
import { BreadcrumbStepper } from '../../components/CreateDataPack/BreadcrumbStepper';
import ExportAOI from '../../components/CreateDataPack/ExportAOI';
import ExportInfo from '../../components/CreateDataPack/ExportInfo';
import ExportSummary from '../../components/CreateDataPack/ExportSummary';
import * as utils from '../../utils/mapUtils';

const providers = [
    {
        display: true,
        id: 1,
        model_url: 'http://cloud.eventkit.test/api/providers/1',
        type: 'osm-generic',
        created_at: '2017-03-24T17:44:22.940611Z',
        updated_at: '2017-03-24T17:44:22.940629Z',
        uid: 'be401b02-63d3-4080-943a-0093c1b5a914',
        name: 'OpenStreetMap Data (Themes)',
        slug: 'osm-generic',
        preview_url: '',
        service_copyright: '',
        service_description: '',
        layer: null,
        level_from: 0,
        level_to: 10,
        export_provider_type: 1,
    },
];

const formats = [
    {
        uid: 'fa94240a-14d1-469f-8b31-335cab6b682a',
        url: 'http://cloud.eventkit.test/api/formats/shp',
        slug: 'shp',
        name: 'ESRI Shapefile Format',
        description: 'Esri Shapefile (OSM Schema)',
    },
    {
        uid: '381e8529-b6d8-46f4-b6d1-854549ae652c',
        url: 'http://cloud.eventkit.test/api/formats/gpkg',
        slug: 'gpkg',
        name: 'Geopackage',
        description: 'GeoPackage',
    },
    {
        uid: 'db36b559-bbca-4322-b059-048dabeceb67',
        url: 'http://cloud.eventkit.test/api/formats/gtiff',
        slug: 'gtiff',
        name: 'GeoTIFF Format',
        description: 'GeoTIFF Raster',
    },
    {
        uid: '79f1d574-ca37-4011-a99c-0484dd331dc3',
        url: 'http://cloud.eventkit.test/api/formats/kml',
        slug: 'kml',
        name: 'KML Format',
        description: 'Google Earth KMZ',
    },
    {
        uid: '20a6ba89-e03d-4610-b61f-158a74f963c4',
        url: 'http://cloud.eventkit.test/api/formats/sqlite',
        slug: 'sqlite',
        name: 'SQLITE Format',
        description: 'SQlite SQL',
    },
];

describe('BreadcrumbStepper component', () => {
    const getProps = () => ({
        aoiInfo: { geojson: {}, originalGeojson: {} },
        providers,
        jobFetched: false,
        stepperNextEnabled: false,
        exportInfo: {
            exportName: '',
            datapackDescription: '',
            projectName: '',
            providers,
            areaStr: '',
            formats: ['gpkg'],
        },
        router: {
            push: sinon.spy(),
            setRouteLeaveHook: sinon.spy(),
        },
        routes: [],
        formats,
        walkthroughClicked: false,
        createExportRequest: sinon.spy(),
        submitJob: sinon.spy(),
        getProviders: sinon.spy(),
        setNextDisabled: sinon.spy(),
        setNextEnabled: sinon.spy(),
        setExportInfoDone: sinon.spy(),
        clearAoiInfo: sinon.spy(),
        clearExportInfo: sinon.spy(),
        onWalkthroughReset: sinon.spy(),
        clearJobInfo: sinon.spy(),
        getNotifications: sinon.spy(),
        getNotificationsUnreadCount: sinon.spy(),
        getFormats: sinon.spy(),
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;

    const setup = (overrides = {}) => {
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<BreadcrumbStepper {...props} />);
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render step 1 with disabled next arrow by default', () => {
        expect(wrapper.find(NavigationArrowBack)).toHaveLength(1);
        expect(wrapper.find(ExportAOI)).toHaveLength(1);
        expect(wrapper.childAt(0).childAt(0).childAt(0).text()).toEqual('STEP 1 OF 3:  Define Area of Interest');
        expect(wrapper.find(Button)).toHaveLength(1);
        expect(wrapper.find(Button).props().disabled).toEqual(true);
        expect(wrapper.find(NavigationArrowForward)).toHaveLength(1);
    });

    it('should render a loading icon', () => {
        expect(wrapper.find(PageLoading)).toHaveLength(0);
        wrapper.setState({ loading: true });
        expect(wrapper.find(PageLoading)).toHaveLength(1);
    });

    it('render should call getErrorMessage twice', () => {
        const getMessageSpy = sinon.spy(BreadcrumbStepper.prototype, 'getErrorMessage');
        expect(getMessageSpy.called).toBe(false);
        const nextProps = { ...getProps() };
        nextProps.jobError = {
            errors: [
                { title: 'one', detail: 'one' },
                { title: 'two', detail: 'two' },
            ],
        };
        wrapper.setProps(nextProps);
        expect(getMessageSpy.called).toBe(true);
    });

    it('componentDidMount should set nextDisabled and get providers and formats', () => {
        setup({ exportInfo: { ...props.exportInfo, exportName: '' }});
        expect(props.setNextDisabled.calledOnce).toBe(true);
        expect(props.getProviders.calledOnce).toBe(true);
        expect(props.getFormats.calledOnce).toBe(true);
    });

    it('componentDidUpdate should push to status page and clearJobInfo', () => {
        const pushStub = sinon.stub(browserHistory, 'push');
        const nextProps = { ...getProps() };
        nextProps.jobuid = '123';
        nextProps.jobFetched = true;
        nextProps.clearJobInfo = sinon.spy();
        wrapper.setProps(nextProps);
        expect(pushStub.calledOnce).toBe(true);
        expect(pushStub.calledWith('/status/123')).toBe(true);
        expect(nextProps.clearJobInfo.calledOnce).toBe(true);
        pushStub.restore();
    });

    it('componentDidUpdate should show job error', () => {
        const hideStub = sinon.stub(BreadcrumbStepper.prototype, 'hideLoading');
        const showErrorStub = sinon.stub(BreadcrumbStepper.prototype, 'showError');
        setup({ jobError: null });
        const nextProps = { ...getProps() };
        const error = { errors: ['one', 'two'] };
        nextProps.jobError = error;
        wrapper.setProps(nextProps);
        expect(hideStub.called).toBe(true);
        expect(showErrorStub.calledOnce).toBe(true);
        expect(showErrorStub.calledWith(error)).toBe(true);
        hideStub.restore();
        showErrorStub.restore();
    });

    it('componentWillUnmount should clear out redux states', () => {
        wrapper.unmount();
        expect(props.clearAoiInfo.calledOnce).toBe(true);
        expect(props.clearExportInfo.calledOnce).toBe(true);
        expect(props.clearJobInfo.calledOnce).toBe(true);
    });

    it('getErrorMessage should return formated title and detail', () => {
        const message = mount(wrapper.instance().getErrorMessage('test title', 'test detail'));
        expect(message.find('.BreadcrumbStepper-error-container')).toHaveLength(1);
        expect(message.find('.BreadcrumbStepper-error-title')).toHaveLength(1);
        expect(message.find('.BreadcrumbStepper-error-title').find(Warning)).toHaveLength(1);
        expect(message.find('.BreadcrumbStepper-error-title').text()).toEqual('test title');
        expect(message.find('.BreadcrumbStepper-error-detail')).toHaveLength(1);
        expect(message.find('.BreadcrumbStepper-error-detail').text()).toEqual('test detail');
    });

    it('getStepLabel should return the correct label for each stepIndex', () => {
        let elem = mount(wrapper.instance().getStepLabel(0));
        expect(elem.text()).toEqual('STEP 1 OF 3:  Define Area of Interest');

        elem = mount(wrapper.instance().getStepLabel(1));
        expect(elem.text()).toEqual('STEP 2 OF 3:  Select Data & Formats');

        elem = mount(wrapper.instance().getStepLabel(2));
        expect(elem.text()).toEqual('STEP 3 OF 3:  Review & Submit');

        elem = mount(wrapper.instance().getStepLabel(3));
        expect(elem.text()).toEqual('STEPPER ERROR');
    });

    it('getStepContent should return the correct content for each stepIndex', () => {
        let content = wrapper.instance().getStepContent(0);
        expect(content).toEqual(<ExportAOI
            limits={wrapper.state('limits')}
            onWalkthroughReset={props.onWalkthroughReset}
            walkthroughClicked={props.walkthroughClicked}
        />);

        content = wrapper.instance().getStepContent(1);
        expect(content).toEqual((
            <ExportInfo
                onWalkthroughReset={props.onWalkthroughReset}
                walkthroughClicked={props.walkthroughClicked}
                handlePrev={wrapper.instance().handlePrev}
            />
        ));

        content = wrapper.instance().getStepContent(2);
        expect(content).toEqual(<ExportSummary
            onWalkthroughReset={props.onWalkthroughReset}
            walkthroughClicked={props.walkthroughClicked}
        />);

        content = wrapper.instance().getStepContent(3);
        expect(content).toEqual(<ExportAOI
            limits={wrapper.state('limits')}
            onWalkthroughReset={props.onWalkthroughReset}
            walkthroughClicked={props.walkthroughClicked}
        />);
    });

    it('getButtonContent should return the correct content for each stepIndex', () => {
        let content = mount(wrapper.instance().getButtonContent(0));
        expect(content.find(Button)).toHaveLength(1);
        expect(content.find(NavigationArrowForward)).toHaveLength(1);

        content = mount(wrapper.instance().getButtonContent(1));
        expect(content.find(Button)).toHaveLength(1);
        expect(content.find(NavigationArrowForward)).toHaveLength(1);

        content = mount(wrapper.instance().getButtonContent(2));
        expect(content.find(Button)).toHaveLength(1);
        expect(content.find(NavigationCheck)).toHaveLength(1);

        content = mount(wrapper.instance().getButtonContent(3));
        expect(content.find('div')).toHaveLength(1);
    });

    it('getPreviousButtonContent should return the correct content for each stepIndex', () => {
        let content = mount(wrapper.instance().getPreviousButtonContent(0));
        expect(content.find(NavigationArrowBack)).toHaveLength(1);

        content = mount(wrapper.instance().getPreviousButtonContent(1));
        expect(content.find(NavigationArrowBack)).toHaveLength(1);

        content = mount(wrapper.instance().getPreviousButtonContent(2));
        expect(content.find(Button)).toHaveLength(1);
        expect(content.find(NavigationArrowBack)).toHaveLength(1);

        content = mount(wrapper.instance().getPreviousButtonContent(3));
        expect(content.find('div')).toHaveLength(1);
    });

    it('submitDatapack should showLoading then wait and call handleSubmit', () => {
        jest.useFakeTimers();
        const loadingStub = sinon.stub(instance, 'showLoading');
        const handleStub = sinon.stub(instance, 'handleSubmit');
        wrapper.instance().submitDatapack();
        jest.runAllTimers();
        expect(loadingStub.calledOnce).toBe(true);
        expect(handleStub.calledOnce).toBe(true);
    });

    it('handleSubmit should submit a job with the correct data', () => {
        const exportInfo = { ...props.exportInfo };
        exportInfo.exportName = 'test name';
        exportInfo.datapackDescription = 'test description';
        exportInfo.projectName = 'test event';
        const expectedProps = {
            name: 'test name',
            description: 'test description',
            event: 'test event',
            include_zipfile: false,
            provider_tasks: [{
                provider: 'OpenStreetMap Data (Themes)',
                formats: ['gpkg'],
            }],
            selection: {},
            original_selection: {},
            tags: [],
        };
        const handleSpy = sinon.spy(BreadcrumbStepper.prototype, 'handleSubmit');
        const flattenStub = sinon.stub(utils, 'flattenFeatureCollection')
            .callsFake(fc => (fc));
        setup({ exportInfo });
        wrapper.instance().handleSubmit();
        expect(handleSpy.calledOnce).toBe(true);
        expect(props.submitJob.calledOnce).toBe(true);
        expect(props.submitJob.calledWith(expectedProps)).toBe(true);
        flattenStub.restore();
    });

    it('handleNext should increment the stepIndex', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleNext();
        expect(stateSpy.calledOnce).toBe(true);
        stateSpy.restore();
    });

    it('handlePrev should decrement the stepIndex only when index is > 0', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handlePrev();
        expect(stateSpy.called).toBe(false);
        wrapper.setState({ stepIndex: 1 });
        wrapper.instance().handlePrev();
        expect(stateSpy.called).toBe(true);
        expect(stateSpy.calledWith({ stepIndex: 0 })).toBe(true);
        stateSpy.restore();
    });

    it('showError should setState and clear job info', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const error = { message: 'oh no' };
        wrapper.instance().showError(error);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showError: true, error })).toBe(true);
        expect(props.clearJobInfo.calledOnce).toBe(true);
        stateStub.restore();
    });

    it('hideError should setState', () => {
        const stateStub = sinon.stub(instance, 'setState');
        wrapper.instance().hideError();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ showError: false })).toBe(true);
        stateStub.restore();
    });

    it('showLoading should set loading to true', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        wrapper.instance().showLoading();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ loading: true })).toBe(true);
        stateSpy.restore();
    });

    it('hideLoading should set loading to false', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        wrapper.instance().hideLoading();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ loading: false })).toBe(true);
        stateSpy.restore();
    });

    it('should set the modified flag when aoiInfo or exportInfo changes', () => {
        expect(wrapper.state().modified).toBe(false);
        wrapper.setProps({ aoiInfo: {} });
        expect(wrapper.state().modified).toBe(true);
        wrapper.setState({ modified: false });
        wrapper.setProps({ exportInfo: {} });
        expect(wrapper.state().modified).toBe(true);
    });

    it('should set leave route and show leave warning dialog when navigating away with changes', () => {
        wrapper.setState({ modified: true });
        instance.routeLeaveHook({ pathname: '/someRoute' });
        expect(instance.leaveRoute).toBe('/someRoute');
        expect(wrapper.state().showLeaveWarningDialog).toBe(true);
    });

    it('should set modified flag to "false" when submitting a datapack', () => {
        wrapper.setState({ modified: true });
        instance.submitDatapack();
        expect(wrapper.state().modified).toBe(false);
    });

    it('should hide leave warning dialog when clicking cancel', () => {
        wrapper.setState({ showLeaveWarningDialog: true });
        instance.leaveRoute = '/someRoute';
        instance.handleLeaveWarningDialogCancel();
        expect(wrapper.state().showLeaveWarningDialog).toBe(false);
        expect(instance.leaveRoute).toBe(null);
    });

    it('should push the leave route when clicking confirm in leave warning dialog', () => {
        instance.props.router.push = sinon.spy();
        instance.leaveRoute = '/someRoute';
        instance.handleLeaveWarningDialogConfirm();
        expect(instance.props.router.push.calledOnce).toBe(true);
        expect(instance.props.router.push.getCall(0).args[0]).toBe('/someRoute');
    });
});
