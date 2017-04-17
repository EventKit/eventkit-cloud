import React from 'react';
import sinon from 'sinon';
import {expect} from 'chai';
import {mount, shallow} from 'enzyme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import FloatingActionButton from 'material-ui/FloatingActionButton'
import NavigationArrowBack from 'material-ui/svg-icons/navigation/arrow-back';
import NavigationArrowForward from 'material-ui/svg-icons/navigation/arrow-forward';
import NavigationCheck from 'material-ui/svg-icons/navigation/check';
import { BreadcrumbStepper } from '../components/BreadcrumbStepper';
import ExportAOI, {MODE_DRAW_BBOX, MODE_NORMAL} from '../components/ExportAOI';
import ExportInfo from '../components/ExportInfo';
import ExportSummary from '../components/ExportSummary';
import isEqual from 'lodash/isEqual';
import {browserHistory} from 'react-router';

describe('BreadcrumbStepper component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            aoiInfo: {geojson: {}},
            providers: providers,
            stepperNextEnabled: false,
            exportInfo: {
                exportName: '',
                datapackDescription: '',
                projectName: '',
                makePublic: false,
                providers: providers,
                area_str: '',
                layers: '',
            },
            createExportRequest: () => {},
            submitJob: (data) => {},
            getProviders: () => {},
            setNextDisabled: () => {},
            setNextEnabled: () => {},
            setExportInfoDone: () => {},
            clearAoiInfo: () => {},
            clearExportInfo: () => {}
        }
    };
    const getWrapper = (props) => {
        return shallow(<BreadcrumbStepper {...props}/>, {
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object
            }
        });
    }

    it('should render step 1 with disabled next arrow by default', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(NavigationArrowBack)).to.have.length(1);
        expect(wrapper.find(ExportAOI)).to.have.length(1);
        expect(wrapper.childAt(0).childAt(0).childAt(0).text()).to.equal('STEP 1 OF 3:  Define Area of Interest');
        expect(wrapper.find(FloatingActionButton)).to.have.length(1);
        expect(wrapper.find(FloatingActionButton).props().disabled).to.equal(true);
        expect(wrapper.find(NavigationArrowForward)).to.have.length(1);
    });

    it('handleSubmit should submit a job with the correct data', () => {
        const stub = sinon.stub(browserHistory, 'push');
        let props = getProps();
        props.exportInfo.exportName = 'test name';
        props.exportInfo.datapackDescription = 'test description';
        props.exportInfo.projectName = 'test event';
        props.submitJob = new sinon.spy();
        const expectedProps = {
            name: 'test name',
            description: 'test description',
            event: 'test event',
            include_zipfile: false,
            published: false,
            provider_tasks: [{'provider': providers[0], 'formats': ['gpkg']}],
            selection: {},
            tags: [],
        }
        const handleSpy = new sinon.spy(BreadcrumbStepper.prototype, 'handleSubmit');
        const wrapper = getWrapper(props);
        wrapper.instance().handleSubmit();
        expect(handleSpy.calledOnce).to.be.true;
        expect(props.submitJob.calledOnce).to.be.true;
        expect(props.submitJob.calledWith(expectedProps)).to.be.true;
        expect(stub.calledOnce).to.be.true;
    });

    it('handleNext should increment the stepIndex', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(BreadcrumbStepper.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(stateSpy.called).to.be.false;
        wrapper.instance().handleNext();
        expect(stateSpy.calledOnce).to.be.true;
        stateSpy.restore();
    });

    it('handleNext should call setExportInfoDone', () => {
        let props = getProps();
        props.setExportInfoDone = new sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setState({stepIndex: 1});
        expect(props.setExportInfoDone.called).to.be.false;
        wrapper.instance().handleNext();
        expect(props.setExportInfoDone.calledOnce).to.be.true; 
    });

    it('incrementStepper should increment the stepIndex', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(BreadcrumbStepper.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(stateSpy.called).to.be.false;
        wrapper.instance().incrementStepper();
        expect(stateSpy.calledOnce).to.be.true;
        expect(stateSpy.calledWith({stepIndex: 1})).to.be.true;
        stateSpy.restore();
    });

    it('handlePrev should decrement the stepIndex only when index is > 0', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(BreadcrumbStepper.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(stateSpy.called).to.be.false;
        wrapper.instance().handlePrev();
        expect(stateSpy.called).to.be.false;
        wrapper.setState({stepIndex: 1});
        wrapper.instance().handlePrev();
        expect(stateSpy.called).to.be.true;
        expect(stateSpy.calledWith({stepIndex: 0})).to.be.true;
        stateSpy.restore();
    });

    it('getStepLabel should return the correct label for each stepIndex', () => {
        const props = getProps();
        const wrapper = getWrapper(props);

        let elem = mount(wrapper.instance().getStepLabel(0));
        expect(elem.text()).to.equal('STEP 1 OF 3:  Define Area of Interest');

        elem = mount(wrapper.instance().getStepLabel(1));
        expect(elem.text()).to.equal('STEP 2 OF 3:  Select Data & Formats');

        elem = mount(wrapper.instance().getStepLabel(2));
        expect(elem.text()).to.equal('STEP 3 OF 3:  Review & Submit');

        elem = mount(wrapper.instance().getStepLabel(3));
        expect(elem.text()).to.equal('STEPPER ERROR');
    });

    it('getStepContent should return the correct content for each stepIndex', () => {
        const props = getProps();
        const wrapper = getWrapper(props);

        let content = wrapper.instance().getStepContent(0);
        expect(isEqual(content, <ExportAOI/>)).to.be.true;

        content = wrapper.instance().getStepContent(1);
        expect(isEqual(content, <ExportInfo 
            providers={props.providers} 
            incrementStepper={wrapper.instance().incrementStepper}/>)).to.be.true;
        
        content = wrapper.instance().getStepContent(2);
        expect(isEqual(content, <ExportSummary/>)).to.be.true;

        content = wrapper.instance().getStepContent(3);
        expect(isEqual(content, <ExportAOI/>)).to.be.true;
    });

    it('getButtonContent should return the correct content for each stepIndex', () => {
        const props = getProps();
        const wrapper = getWrapper(props);

        let content = mount(wrapper.instance().getButtonContent(0),{
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object
            }
        });
        expect(content.find(FloatingActionButton)).to.have.length(1);
        expect(content.find(NavigationArrowForward)).to.have.length(1);

        content = mount(wrapper.instance().getButtonContent(1),{
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object
            }
        });
        expect(content.find(FloatingActionButton)).to.have.length(1);
        expect(content.find(NavigationArrowForward)).to.have.length(1);

        content = mount(wrapper.instance().getButtonContent(2),{
            context: {muiTheme},
            childContextTypes: {
                muiTheme: React.PropTypes.object
            }
        });
        expect(content.find(FloatingActionButton)).to.have.length(1);
        expect(content.find(NavigationCheck)).to.have.length(1);

        content = mount(wrapper.instance().getButtonContent(3));
        expect(content.find('div')).to.have.length(1);
    })
});

const providers = [
    {
        "id": 1,
        "model_url": "http://cloud.eventkit.dev/api/providers/1",
        "type": "osm-generic",
        "created_at": "2017-03-24T17:44:22.940611Z",
        "updated_at": "2017-03-24T17:44:22.940629Z",
        "uid": "be401b02-63d3-4080-943a-0093c1b5a914",
        "name": "OpenStreetMap Data (Generic)",
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
