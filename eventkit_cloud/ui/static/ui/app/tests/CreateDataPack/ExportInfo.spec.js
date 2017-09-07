import React from 'react'
import sinon from 'sinon';
import {mount} from 'enzyme'
import {fakeStore} from '../../__mocks__/fakeStore'
import {Provider} from 'react-redux'
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import {ExportInfo} from '../../components/CreateDataPack/ExportInfo'
import CustomScrollbar from '../../components/CustomScrollbar';
import ol from 'openlayers';
import { RadioButton } from 'material-ui/RadioButton';
import { List, ListItem} from 'material-ui/List';
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';
import TextField from 'material-ui/TextField';
import ActionCheckCircle from 'material-ui/svg-icons/action/check-circle';
import UncheckedCircle from 'material-ui/svg-icons/toggle/radio-button-unchecked';
import Paper from 'material-ui/Paper';
import Checkbox from 'material-ui/Checkbox';
import debounce from 'lodash/debounce';


describe('ExportInfo component', () => {
    const muiTheme = getMuiTheme();
    injectTapEventPlugin();
    const getProps = () => {
        return {
            geojson: { 
                "type": "FeatureCollection",
                "features": [{ "type": "Feature",
                    "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
                        [100.0, 1.0], [100.0, 0.0] ]
                        ]
                    },}]
            },
            exportInfo: {
                exportName: '',
                datapackDescription: '',
                projectName: '',
                makePublic: false,
            },
            providers: [],
            nextEnabled: true,
            handlePrev: () => {},
            updateExportInfo: () => {},
            setNextDisabled: () => {},
            setNextEnabled: () => {},
        }
    }

    const getWrapper = (props) => {
        const store = fakeStore({});        
        return mount(<ExportInfo {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
    }

    it('should render a form', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('.root')).toHaveLength(1);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);        
        expect(wrapper.find('.form')).toHaveLength(1);
        expect(wrapper.find('.paper')).toHaveLength(1);
        expect(wrapper.find('#mainHeading')).toHaveLength(1);
        expect(wrapper.find(TextField)).toHaveLength(3);
        expect(wrapper.find('#layersHeader')).toHaveLength(1);
        expect(wrapper.find('#layersHeader').text()).toEqual('Select Data Sources');
        expect(wrapper.find('#layersSubheader').text()).toEqual('You must choose at least one');
        expect(wrapper.find(List)).toHaveLength(1);
        expect(wrapper.find(ListItem)).toHaveLength(0);
        expect(wrapper.find('#projectionHeader')).toHaveLength(1);
        expect(wrapper.find('#projectionHeader').text()).toEqual('Select Projection');
        expect(wrapper.find('#projectionCheckbox').find(Checkbox)).toHaveLength(1);
        expect(wrapper.find('#formatsHeader')).toHaveLength(1);
        expect(wrapper.find('#formatsCheckbox').find(Checkbox)).toHaveLength(1);
        expect(wrapper.find(Card)).toHaveLength(1);
        expect(wrapper.find(CardHeader)).toHaveLength(1);
        expect(wrapper.find(CardText)).toHaveLength(0);
    });

    it('card should expand and show a map', () => {

    });

    it('componentDidMount should setNextDisabled, setArea, create deboucers, and add eventlistener', () => {
        const props = getProps();
        props.setNextDisabled = new sinon.spy();
        const mountSpy = new sinon.spy(ExportInfo.prototype, 'componentDidMount');
        const areaSpy = new sinon.spy(ExportInfo.prototype, 'setArea');
        const hasFieldsSpy = new sinon.spy(ExportInfo.prototype, 'hasRequiredFields');
        const listenerSpy = new sinon.spy(window, 'addEventListener');
        // const debounceSpy = new sinon.spy(debounce.prototype);
        const wrapper = getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(hasFieldsSpy.calledOnce).toBe(true);
        expect(hasFieldsSpy.calledWith(props.exportInfo)).toBe(true);
        expect(props.setNextDisabled.calledOnce).toBe(true);
        expect(areaSpy.calledOnce).toBe(true);
        // expect(debounceSpy.called).toBe(true);
        expect(listenerSpy.called).toBe(true);
        expect(listenerSpy.calledWith('resize', wrapper.instance().screenSizeUpdate)).toBe(true);
        mountSpy.restore();
        areaSpy.restore();
        hasFieldsSpy.restore();
        listenerSpy.restore();
    });

    it('componentDidUpdate should initializeOpenLayers if expanded', () => {
        const props = getProps();
        const initSpy = new sinon.spy();
        const updateSpy = new sinon.spy(ExportInfo.prototype, 'componentDidUpdate');
        const wrapper = getWrapper(props);
        wrapper.instance()._initializeOpenLayers = initSpy;
        expect(wrapper.state().expanded).toBe(false);
        wrapper.setState({expanded: true});
        expect(updateSpy.calledOnce).toBe(true);
        expect(wrapper.state().expanded).toBe(true);
        expect(initSpy.calledOnce).toBe(true);
        updateSpy.restore();
    });

    it('componentWillUnmount should remove the event listener', () => {
        const props = getProps();
        const unmountSpy = new sinon.spy(ExportInfo.prototype, 'componentWillUnmount');
        const listenerSpy = new sinon.spy(window, 'removeEventListener');1
        const wrapper = getWrapper(props);
        const func = wrapper.instance().screenSizeUpdate;
        wrapper.unmount();
        expect(unmountSpy.calledOnce).toBe(true);
        expect(listenerSpy.called).toBe(true);
        expect(listenerSpy.calledWith('resize', func)).toBe(true);
    });

    it('componentWillReceiveProps should setNextEnabled', () => {
        const props = getProps();
        props.setNextEnabled = new sinon.spy();
        const wrapper = getWrapper(props);
        expect(props.setNextEnabled.called).toBe(false);
        const nextProps = getProps();
        nextProps.exportInfo.exportName = 'name';
        nextProps.exportInfo.datapackDescription = 'description';
        nextProps.exportInfo.projectName = 'project';
        nextProps.exportInfo.providers = [{}];
        nextProps.nextEnabled = false;
        wrapper.setProps(nextProps);
        expect(props.setNextEnabled.calledOnce).toBe(true);
    });

    it('componentWillReceiveProps should setNextDisabled', () => {
        const props = getProps();
        props.setNextDisabled = new sinon.spy();
        const wrapper = getWrapper(props);
        expect(props.setNextDisabled.calledOnce).toBe(true);
        const nextProps = getProps();
        nextProps.nextEnabled = true;
        wrapper.setProps(nextProps);
        expect(props.setNextDisabled.calledTwice).toBe(true);
    });

    it('screenSizeUpdate should force an update', () => {
        const props = getProps();
        const forceSpy = new sinon.spy(ExportInfo.prototype, 'forceUpdate');
        const wrapper = getWrapper(props);
        expect(forceSpy.called).toBe(false);
        wrapper.instance().screenSizeUpdate();
        expect(forceSpy.calledOnce).toBe(true);
        forceSpy.restore();
    });

    it('onNameChange should call persist and nameHandler', () => {
        const props = getProps();
        const event = {persist: new sinon.spy()}
        const wrapper = getWrapper(props);
        wrapper.instance().nameHandler = new sinon.spy();
        wrapper.instance().onNameChange(event);
        expect(event.persist.calledOnce).toBe(true);
        expect(wrapper.instance().nameHandler.calledOnce).toBe(true);
        expect(wrapper.instance().nameHandler.calledWith(event)).toBe(true);
    });

    it('onDescriptionChange should call persist and nameHandler', () => {
        const props = getProps();
        const event = {persist: new sinon.spy()}
        const wrapper = getWrapper(props);
        wrapper.instance().descriptionHandler = new sinon.spy();
        wrapper.instance().onDescriptionChange(event);
        expect(event.persist.calledOnce).toBe(true);
        expect(wrapper.instance().descriptionHandler.calledOnce).toBe(true);
        expect(wrapper.instance().descriptionHandler.calledWith(event)).toBe(true);
    });

    it('onProjectChange should call persist and nameHandler', () => {
        const props = getProps();
        const event = {persist: new sinon.spy()}
        const wrapper = getWrapper(props);
        wrapper.instance().projectHandler = new sinon.spy();
        wrapper.instance().onProjectChange(event);
        expect(event.persist.calledOnce).toBe(true);
        expect(wrapper.instance().projectHandler.calledOnce).toBe(true);
        expect(wrapper.instance().projectHandler.calledWith(event)).toBe(true);
    });

    it('onChangeCheck should add a provider', () => {
        const appProviders = [{name: 'one'}, {name: 'two'}];
        const exportProviders = [{name: 'one'}];
        const event = {target: {name: 'two', checked: true}};
        const props = getProps();
        props.updateExportInfo = new sinon.spy();
        props.exportInfo.providers = exportProviders;
        props.providers = appProviders;
        const wrapper = getWrapper(props);
        wrapper.instance().onChangeCheck(event);
        expect(props.updateExportInfo.called).toBe(true);
        // expect(props.updateExportInfo.calledWith({
        //     ...props.exportInfo,
        //     providers: [{name: 'one', name: 'two'}]
        // })).toBe(true);
    });

    it('onChangeCheck should remove a provider', () => {

    });
});
