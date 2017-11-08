import React from 'react';
import sinon from 'sinon';
import { mount, shallow } from 'enzyme';
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


describe('BreadcrumbStepper component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => ({
        aoiInfo: { geojson: {} },
        providers,
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
            tags: [],
        };
        const handleSpy = sinon.spy(BreadcrumbStepper.prototype, 'handleSubmit');
        const wrapper = getWrapper(props);
        wrapper.instance().handleSubmit();
        expect(handleSpy.calledOnce).toBe(true);
        expect(props.submitJob.calledOnce).toBe(true);
        expect(props.submitJob.calledWith(expectedProps)).toBe(true);
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

