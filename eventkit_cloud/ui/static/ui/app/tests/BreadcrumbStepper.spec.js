import React from 'react';
import sinon from 'sinon';
import { mount, shallow } from 'enzyme';
import { browserHistory } from 'react-router';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Warning from 'material-ui/svg-icons/alert/warning';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import NavigationArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import NavigationArrowForward from 'material-ui/svg-icons/navigation/arrow-forward';
import NavigationCheck from 'material-ui/svg-icons/navigation/check';
import { BreadcrumbStepper } from '../components/BreadcrumbStepper';
import ExportAOI from '../components/CreateDataPack/ExportAOI';
import ExportInfo from '../components/CreateDataPack/ExportInfo';
import ExportSummary from '../components/CreateDataPack/ExportSummary';
import * as utils from '../utils/mapUtils';

describe('BreadcrumbStepper component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => ({
        aoiInfo: { geojson: {}, originalGeojson: {} },
        providers,
        jobFetched: false,
        stepperNextEnabled: false,
        exportInfo: {
            exportName: '',
            datapackDescription: '',
            projectName: '',
            makePublic: false,
            providers,
            areaStr: '',
            formats: ['gpkg'],
        },
        formats,
        createExportRequest: () => {},
        submitJob: () => {},
        getProviders: () => {},
        setNextDisabled: () => {},
        setNextEnabled: () => {},
        setExportInfoDone: () => {},
        clearAoiInfo: () => {},
        clearExportInfo: () => {},
        clearJobInfo: () => {},
    });
    const getWrapper = props => (
        shallow(<BreadcrumbStepper {...props} />, {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            },
        })
    );

    it('should render step 1 with disabled next arrow by default', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(NavigationArrowBack)).toHaveLength(1);
        expect(wrapper.find(ExportAOI)).toHaveLength(1);
        expect(wrapper.childAt(0).childAt(0).childAt(0).text()).toEqual('STEP 1 OF 3:  Define Area of Interest');
        expect(wrapper.find(FloatingActionButton)).toHaveLength(1);
        expect(wrapper.find(FloatingActionButton).props().disabled).toEqual(true);
        expect(wrapper.find(NavigationArrowForward)).toHaveLength(1);
    });

    it('should render a loading icon', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.qa-BreadcrumbStepper-CircularProgress')).toHaveLength(0);
        wrapper.setState({ loading: true });
        expect(wrapper.find('.qa-BreadcrumbStepper-CircularProgress')).toHaveLength(1);
    });

    it('render should call getErrorMessage twice', () => {
        const props = getProps();
        const getMessageSpy = sinon.spy(BreadcrumbStepper.prototype, 'getErrorMessage');
        const wrapper = getWrapper(props);
        expect(getMessageSpy.called).toBe(false);
        const nextProps = { ...getProps() };
        nextProps.jobError = {
            response: {
                data: {
                    errors: [
                        { title: 'one', detail: 'one' },
                        { title: 'two', detail: 'two' },
                    ],
                },
            },
        };
        wrapper.setProps(nextProps);
        expect(getMessageSpy.calledTwice).toBe(true);
    });

    it('componentDidMount should set nextDisabled and get providers and formats', () => {
        const props = getProps();
        const mountSpy = sinon.spy(BreadcrumbStepper.prototype, 'componentDidMount');
        props.exportInfo.exportName = '';
        props.getProviders = sinon.spy();
        props.getFormats = sinon.spy();
        props.setNextDisabled = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.instance().componentDidMount();
        expect(mountSpy.calledOnce).toBe(true);
        expect(props.setNextDisabled.calledOnce).toBe(true);
        expect(props.getProviders.calledOnce).toBe(true);
        expect(props.getFormats.calledOnce).toBe(true);
        mountSpy.restore();
    });

    it('componentWillReceiveProps should push to status page and clearJobInfo', () => {
        const props = getProps();
        props.clearJobInfo = sinon.spy();
        const hideStub = sinon.stub(BreadcrumbStepper.prototype, 'hideLoading');
        const pushStub = sinon.stub(browserHistory, 'push');
        const wrapper = getWrapper(props);
        const nextProps = { ...getProps() };
        nextProps.jobuid = '123';
        nextProps.jobFetched = true;
        wrapper.setProps(nextProps);
        expect(hideStub.calledOnce).toBe(true);
        expect(pushStub.calledOnce).toBe(true);
        expect(pushStub.calledWith('/status/123')).toBe(true);
        expect(props.clearJobInfo.calledOnce).toBe(true);
        hideStub.restore();
        pushStub.restore();
    });

    it('componentWillReceiveProps should show job error', () => {
        const props = getProps();
        props.jobError = null;
        const hideStub = sinon.stub(BreadcrumbStepper.prototype, 'hideLoading');
        const showErrorStub = sinon.stub(BreadcrumbStepper.prototype, 'showError');
        const wrapper = getWrapper(props);
        const nextProps = { ...getProps() };
        nextProps.jobError = { response: 'response' };
        wrapper.setProps(nextProps);
        expect(hideStub.calledOnce).toBe(true);
        expect(showErrorStub.calledOnce).toBe(true);
        expect(showErrorStub.calledWith('response')).toBe(true);
        hideStub.restore();
        showErrorStub.restore();
    });

    it('componentWillUnmount should clear out redux states', () => {
        const props = getProps();
        props.clearAoiInfo = sinon.spy();
        props.clearExportInfo = sinon.spy();
        props.clearJobInfo = sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.unmount();
        expect(props.clearAoiInfo.calledOnce).toBe(true);
        expect(props.clearExportInfo.calledOnce).toBe(true);
        expect(props.clearJobInfo.calledOnce).toBe(true);
    });

    it('getErrorMessage should return formated title and detail', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const message = mount(wrapper.instance().getErrorMessage('test title', 'test detail'), {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            },
        });
        expect(message.find('.BreadcrumbStepper-error-container')).toHaveLength(1);
        expect(message.find('.BreadcrumbStepper-error-title')).toHaveLength(1);
        expect(message.find('.BreadcrumbStepper-error-title').find(Warning)).toHaveLength(1);
        expect(message.find('.BreadcrumbStepper-error-title').text()).toEqual('test title');
        expect(message.find('.BreadcrumbStepper-error-detail')).toHaveLength(1);
        expect(message.find('.BreadcrumbStepper-error-detail').text()).toEqual('test detail');
    });

    it('getStepLabel should return the correct label for each stepIndex', () => {
        const props = getProps();
        const wrapper = getWrapper(props);

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
        const props = getProps();
        const wrapper = getWrapper(props);

        let content = wrapper.instance().getStepContent(0);
        expect(content).toEqual(<ExportAOI />);

        content = wrapper.instance().getStepContent(1);
        expect(content).toEqual((
            <ExportInfo
                providers={props.providers}
                formats={props.formats}
                handlePrev={wrapper.instance().handlePrev}
            />
        ));

        content = wrapper.instance().getStepContent(2);
        expect(content).toEqual(<ExportSummary allFormats={props.formats} />);

        content = wrapper.instance().getStepContent(3);
        expect(content).toEqual(<ExportAOI />);
    });

    it('getButtonContent should return the correct content for each stepIndex', () => {
        const props = getProps();
        const wrapper = getWrapper(props);

        let content = mount(wrapper.instance().getButtonContent(0), {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            },
        });
        expect(content.find(FloatingActionButton)).toHaveLength(1);
        expect(content.find(NavigationArrowForward)).toHaveLength(1);

        content = mount(wrapper.instance().getButtonContent(1),{
            context: { muiTheme },
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            },
        });
        expect(content.find(FloatingActionButton)).toHaveLength(1);
        expect(content.find(NavigationArrowForward)).toHaveLength(1);

        content = mount(wrapper.instance().getButtonContent(2),{
            context: { muiTheme },
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            },
        });
        expect(content.find(FloatingActionButton)).toHaveLength(1);
        expect(content.find(NavigationCheck)).toHaveLength(1);

        content = mount(wrapper.instance().getButtonContent(3));
        expect(content.find('div')).toHaveLength(1);
    });

    it('getPreviousButtonContent should return the correct content for each stepIndex', () => {
        const props = getProps();
        const wrapper = getWrapper(props);

        let content = mount(wrapper.instance().getPreviousButtonContent(0), {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            },
        });
        expect(content.find(NavigationArrowBack)).toHaveLength(1);

        content = mount(wrapper.instance().getPreviousButtonContent(1), {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            },
        });
        expect(content.find(NavigationArrowBack)).toHaveLength(1);

        content = mount(wrapper.instance().getPreviousButtonContent(2), {
            context: { muiTheme },
            childContextTypes: {
                muiTheme: React.PropTypes.object,
            },
        });
        expect(content.find(FloatingActionButton)).toHaveLength(1);
        expect(content.find(NavigationArrowBack)).toHaveLength(1);

        content = mount(wrapper.instance().getPreviousButtonContent(3));
        expect(content.find('div')).toHaveLength(1);
    });

    it('submitDatapack should showLoading then wait and call handleSubmit', () => {
        jest.useFakeTimers();
        const props = getProps();
        const loadingStub = sinon.stub(BreadcrumbStepper.prototype, 'showLoading');
        const handleStub = sinon.stub(BreadcrumbStepper.prototype, 'handleSubmit');
        const wrapper = getWrapper(props);
        wrapper.instance().submitDatapack();
        jest.runAllTimers();
        expect(loadingStub.calledOnce).toBe(true);
        expect(handleStub.calledOnce).toBe(true);
        loadingStub.restore();
        handleStub.restore();
    });

    it('handleSubmit should submit a job with the correct data', () => {
        const props = getProps();
        props.exportInfo.exportName = 'test name';
        props.exportInfo.datapackDescription = 'test description';
        props.exportInfo.projectName = 'test event';
        props.submitJob = sinon.spy();
        const expectedProps = {
            name: 'test name',
            description: 'test description',
            event: 'test event',
            include_zipfile: false,
            published: false,
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
        const wrapper = getWrapper(props);
        wrapper.instance().handleSubmit();
        expect(handleSpy.calledOnce).toBe(true);
        expect(props.submitJob.calledOnce).toBe(true);
        expect(props.submitJob.calledWith(expectedProps)).toBe(true);
        flattenStub.restore();
    });

    it('handleNext should increment the stepIndex', () => {
        const props = getProps();
        const stateSpy = sinon.spy(BreadcrumbStepper.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().handleNext();
        expect(stateSpy.calledOnce).toBe(true);
        stateSpy.restore();
    });

    it('handlePrev should decrement the stepIndex only when index is > 0', () => {
        const props = getProps();
        const stateSpy = sinon.spy(BreadcrumbStepper.prototype, 'setState');
        const wrapper = getWrapper(props);
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
        const props = getProps();
        props.clearJobInfo = sinon.spy();
        const stateSpy = sinon.spy(BreadcrumbStepper.prototype, 'setState');
        const wrapper = getWrapper(props);
        const error = { message: 'oh no' };
        wrapper.instance().showError(error);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showError: true, error })).toBe(true);
        expect(props.clearJobInfo.calledOnce).toBe(true);
        stateSpy.restore();
    });

    it('hideError should setState', () => {
        const props = getProps();
        const stateSpy = sinon.spy(BreadcrumbStepper.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().hideError();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showError: false })).toBe(true);
        stateSpy.restore();
    });

    it('showLoading should set loading to true', () => {
        const props = getProps();
        const stateSpy = sinon.spy(BreadcrumbStepper.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().showLoading();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ loading: true })).toBe(true);
        stateSpy.restore();
    });

    it('hideLoading should set loading to false', () => {
        const props = getProps();
        const stateSpy = sinon.spy(BreadcrumbStepper.prototype, 'setState');
        const wrapper = getWrapper(props);
        wrapper.instance().hideLoading();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ loading: false })).toBe(true);
        stateSpy.restore();
    });
});

const providers = [
    {
        "display":true,
        "id": 1,
        "model_url": "http://cloud.eventkit.dev/api/providers/1",
        "type": "osm-generic",
        "created_at": "2017-03-24T17:44:22.940611Z",
        "updated_at": "2017-03-24T17:44:22.940629Z",
        "uid": "be401b02-63d3-4080-943a-0093c1b5a914",
        "name": "OpenStreetMap Data (Themes)",
        "slug": "osm-generic",
        "preview_url": "",
        "service_copyright": "",
        "service_description": "",
        "layer": null,
        "level_from": 0,
        "level_to": 10,
        "export_provider_type": 1
    }
]

const formats = [
    {
        "uid": "fa94240a-14d1-469f-8b31-335cab6b682a",
        "url": "http://cloud.eventkit.dev/api/formats/shp",
        "slug": "shp",
        "name": "ESRI Shapefile Format",
        "description": "Esri Shapefile (OSM Schema)"
    },
    {
        "uid": "381e8529-b6d8-46f4-b6d1-854549ae652c",
        "url": "http://cloud.eventkit.dev/api/formats/gpkg",
        "slug": "gpkg",
        "name": "Geopackage",
        "description": "GeoPackage"
    },
    {
        "uid": "db36b559-bbca-4322-b059-048dabeceb67",
        "url": "http://cloud.eventkit.dev/api/formats/gtiff",
        "slug": "gtiff",
        "name": "GeoTIFF Format",
        "description": "GeoTIFF Raster"
    },
    {
        "uid": "79f1d574-ca37-4011-a99c-0484dd331dc3",
        "url": "http://cloud.eventkit.dev/api/formats/kml",
        "slug": "kml",
        "name": "KML Format",
        "description": "Google Earth KMZ"
    },
    {
        "uid": "20a6ba89-e03d-4610-b61f-158a74f963c4",
        "url": "http://cloud.eventkit.dev/api/formats/sqlite",
        "slug": "sqlite",
        "name": "SQLITE Format",
        "description": "SQlite SQL"
    }
]

