import React from 'react'
import sinon from 'sinon';
import {mount} from 'enzyme'
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import {ExportInfo} from '../../components/CreateDataPack/ExportInfo'
import CustomScrollbar from '../../components/CustomScrollbar';
import ol from 'openlayers';
import { List, ListItem} from 'material-ui/List';
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';
import TextField from 'material-ui/TextField';
import Paper from 'material-ui/Paper';
import Checkbox from 'material-ui/Checkbox';
import BaseDialog from '../../components/BaseDialog';

// this polyfills requestAnimationFrame in the test browser, required for ol3
import raf from 'raf';
raf.polyfill();


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
        const config = {BASEMAP_URL: 'http://my-osm-tile-service/{z}/{x}/{y}.png'};
        return mount(<ExportInfo {...props}/>, {
            context: {muiTheme, config},
            childContextTypes: {
                muiTheme: React.PropTypes.object,
                config: React.PropTypes.object
            }
        });
    }

    it('should render a form', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('#root')).toHaveLength(1);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);        
        expect(wrapper.find('#form')).toHaveLength(1);
        expect(wrapper.find('#paper')).toHaveLength(1);
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
        expect(wrapper.find(BaseDialog)).toHaveLength(2);
    });

    it('componentDidMount should setNextDisabled, setArea, create deboucers, and add eventlistener', () => {
        const props = getProps();
        props.setNextDisabled = new sinon.spy();
        const mountSpy = new sinon.spy(ExportInfo.prototype, 'componentDidMount');
        const areaSpy = new sinon.spy(ExportInfo.prototype, 'setArea');
        const hasFieldsSpy = new sinon.spy(ExportInfo.prototype, 'hasRequiredFields');
        const listenerSpy = new sinon.spy(window, 'addEventListener');
        const wrapper = getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(hasFieldsSpy.calledOnce).toBe(true);
        expect(hasFieldsSpy.calledWith(props.exportInfo)).toBe(true);
        expect(props.setNextDisabled.calledOnce).toBe(true);
        expect(areaSpy.calledOnce).toBe(true);
        expect(listenerSpy.called).toBe(true);
        expect(listenerSpy.calledWith('resize', wrapper.instance().screenSizeUpdate)).toBe(true);
        expect(wrapper.instance().nameHandler).not.toBe(undefined);
        expect(wrapper.instance().descriptionHandler).not.toBe(undefined);
        expect(wrapper.instance().projectHandler).not.toBe(undefined);
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
        const listenerSpy = new sinon.spy(window, 'removeEventListener');
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
        expect(props.updateExportInfo.calledWith({
            ...props.exportInfo,
            providers: [{name: 'one'}, {name: 'two'}]
        })).toBe(true);
    });

    it('onChangeCheck should remove a provider', () => {
        const appProviders = [{name: 'one'}, {name: 'two'}];
        const exportProviders = [{name: 'one'}, {name: 'two'}];
        const event = {target: {name: 'two', checked: false}};
        const props = getProps();
        props.updateExportInfo = new sinon.spy();
        props.exportInfo.providers = exportProviders;
        props.providers = appProviders;
        const wrapper = getWrapper(props);
        wrapper.instance().onChangeCheck(event);
        expect(props.updateExportInfo.called).toBe(true);
        expect(props.updateExportInfo.calledWith({
            ...props.exportInfo,
            providers: [{name: 'one'}]
        })).toBe(true);
    });

    it('toggleCheckbox should update exportInfo with new makePublic state', () => {
        const props = getProps();
        props.updateExportInfo = new sinon.spy();
        const wrapper = getWrapper(props);
        const newState =  !props.exportInfo.makePublic;
        wrapper.instance().toggleCheckbox({}, newState);
        expect(props.updateExportInfo.called).toBe(true);
        expect(props.updateExportInfo.calledWith({
            ...props.exportInfo,
            makePublic: newState
        })).toBe(true);
    });

    it('expandedChange should setState', () => {
        const props = getProps();
        const stateSpy = new sinon.spy(ExportInfo.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(stateSpy.called).toBe(false);
        // dont actually create a map when expanded
        wrapper.instance()._initializeOpenLayers = new sinon.spy();
        wrapper.instance().expandedChange(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({expanded: true})).toBe(true);
    });

    it('hasRequiredFields should return whether the exportInfo required fields are filled', () => {
        const invalid = {exportName: 'name', datapackDescription: 'stuff', projectName: 'name', providers: []};
        const valid = {exportName: 'name', datapackDescription: 'stuff', projectName: 'name', providers: [{}]};
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.instance().hasRequiredFields(invalid)).toBe(false);
        expect(wrapper.instance().hasRequiredFields(valid)).toBe(true);
    });

    it('setArea should construct an area string and update exportInfo', () => {
        const expectedString = '12,393 sq km';
        const props = getProps();
        props.updateExportInfo = new sinon.spy();
        // dont run component did mount so setArea is not called yet
        const mountFunc = ExportInfo.prototype.componentDidMount;
        ExportInfo.prototype.componentDidMount = () => {};
        const wrapper = getWrapper(props);
        wrapper.instance().setArea();
        expect(props.updateExportInfo.called).toBe(true);
        expect(props.updateExportInfo.calledWith({
            ...props.exportInfo,
            area_str: expectedString
        })).toBe(true);
        ExportInfo.prototype.componentDidMount = mountFunc;
    });

    it('initializeOpenLayers should create a map and add layer', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const xyzSpy = new sinon.spy(ol.source, 'XYZ');
        const tileSpy = new sinon.spy(ol.layer, 'Tile');
        const mapSpy = new sinon.spy(ol, 'Map');
        const viewSpy = new sinon.spy(ol, 'View');
        const sourceSpy = new sinon.spy(ol.source, 'Vector');
        const geoSpy = new sinon.spy(ol.format, 'GeoJSON');
        const readSpy = new sinon.spy(ol.format.GeoJSON.prototype, 'readFeature');
        wrapper.instance()._initializeOpenLayers();
        expect(xyzSpy.calledOnce).toBe(true);
        expect(tileSpy.calledOnce).toBe(true);
        expect(mapSpy.calledOnce).toBe(true);
        expect(viewSpy.calledOnce).toBe(true);
        expect(sourceSpy.calledOnce).toBe(true);
        expect(geoSpy.calledOnce).toBe(true);
        expect(readSpy.calledOnce).toBe(true);
    });
});
