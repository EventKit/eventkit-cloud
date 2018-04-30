import React from 'react';
import sinon from 'sinon';
import raf from 'raf';
import { mount } from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import { List, ListItem } from 'material-ui/List';
import { Card, CardHeader, CardText } from 'material-ui/Card';
import TextField from 'material-ui/TextField';
import Checkbox from 'material-ui/Checkbox';

import Map from 'ol/map';
import View from 'ol/view';
import interaction from 'ol/interaction';
import VectorSource from 'ol/source/vector';
import GeoJSON from 'ol/format/geojson';

import BaseDialog from '../../components/Dialog/BaseDialog';
import { ExportInfo } from '../../components/CreateDataPack/ExportInfo';
import CustomScrollbar from '../../components/CustomScrollbar';
import * as utils from '../../utils/generic';
import check from 'material-ui/svg-icons/navigation/check';

// this polyfills requestAnimationFrame in the test browser, required for ol3
raf.polyfill();


describe('ExportInfo component', () => {
    const muiTheme = getMuiTheme();
    const getProps = () => (
        {
            geojson: {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [100.0, 0.0],
                                [101.0, 0.0],
                                [101.0, 1.0],
                                [100.0, 1.0],
                                [100.0, 0.0],
                            ],
                        ],
                    },
                }],
            },
            exportInfo: {
                exportName: '',
                datapackDescription: '',
                projectName: '',
            },
            providers: [],
            formats,
            nextEnabled: true,
            handlePrev: () => {},
            updateExportInfo: () => {},
            setNextDisabled: () => {},
            setNextEnabled: () => {},
        }
    );

    const formats = [
        {
            "uid": "ed48a7c1-1fc3-463e-93b3-e93eb3861a5a",
            "url": "http://cloud.eventkit.test/api/formats/shp",
            "slug": "shp",
            "name": "ESRI Shapefile Format",
            "description": "Esri Shapefile (OSM Schema)"
        },
        {
            "uid": "978ab89c-caf7-4296-9a0c-836fc679ea07",
            "url": "http://cloud.eventkit.test/api/formats/gpkg",
            "slug": "gpkg",
            "name": "Geopackage",
            "description": "GeoPackage"
        },]

    const getWrapper = (props) => {
        const config = { BASEMAP_URL: 'http://my-osm-tile-service/{z}/{x}/{y}.png' };
        return mount(<ExportInfo {...props} />, {
            context: { muiTheme, config },
            childContextTypes: {
                muiTheme: React.PropTypes.object,
                config: React.PropTypes.object,
            },
        });
    };

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

    it('componentDidMount should setNextDisabled, setArea, and create deboucers', () => {
        const expectedString = '12,393 sq km';
        const expectedFormat = ['gpkg'];
        const props = getProps();
        props.updateExportInfo = sinon.spy();
        props.setNextDisabled = sinon.spy();
        const mountSpy = sinon.spy(ExportInfo.prototype, 'componentDidMount');
        const areaSpy = sinon.spy(utils, 'getSqKmString');
        const hasFieldsSpy = sinon.spy(ExportInfo.prototype, 'hasRequiredFields');
        const wrapper = getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(hasFieldsSpy.calledOnce).toBe(true);
        expect(hasFieldsSpy.calledWith(props.exportInfo)).toBe(true);
        expect(props.setNextDisabled.calledOnce).toBe(true);
        // expect(areaSpy.calledOnce).toBe(true);
        expect(props.updateExportInfo.calledWith({
            ...props.exportInfo,
            areaStr: expectedString,
            formats: expectedFormat,
        })).toBe(true);
        expect(props.updateExportInfo.called).toBe(true);
        expect(wrapper.instance().nameHandler).not.toBe(undefined);
        expect(wrapper.instance().descriptionHandler).not.toBe(undefined);
        expect(wrapper.instance().projectHandler).not.toBe(undefined);
        mountSpy.restore();
        areaSpy.restore();
        hasFieldsSpy.restore();
    });

    it('componentDidUpdate should initializeOpenLayers if expanded', () => {
        const props = getProps();
        const initSpy = sinon.spy();
        const updateSpy = sinon.spy(ExportInfo.prototype, 'componentDidUpdate');
        const wrapper = getWrapper(props);
        wrapper.instance().initializeOpenLayers = initSpy;
        expect(wrapper.state().expanded).toBe(false);
        wrapper.setState({ expanded: true });
        expect(updateSpy.calledOnce).toBe(true);
        expect(wrapper.state().expanded).toBe(true);
        expect(initSpy.calledOnce).toBe(true);
        updateSpy.restore();
    });

    it('componentWillReceiveProps should setNextEnabled', () => {
        const props = getProps();
        props.setNextEnabled = sinon.spy();
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
        props.setNextDisabled = sinon.spy();
        const wrapper = getWrapper(props);
        expect(props.setNextDisabled.calledOnce).toBe(true);
        const nextProps = getProps();
        nextProps.nextEnabled = true;
        wrapper.setProps(nextProps);
        expect(props.setNextDisabled.calledTwice).toBe(true);
    });

    it('onNameChange should call persist and nameHandler', () => {
        const props = getProps();
        const event = { persist: sinon.spy() };
        const wrapper = getWrapper(props);
        wrapper.instance().nameHandler = sinon.spy();
        wrapper.instance().onNameChange(event);
        expect(event.persist.calledOnce).toBe(true);
        expect(wrapper.instance().nameHandler.calledOnce).toBe(true);
        expect(wrapper.instance().nameHandler.calledWith(event)).toBe(true);
    });

    it('onDescriptionChange should call persist and nameHandler', () => {
        const props = getProps();
        const event = { persist: sinon.spy() };
        const wrapper = getWrapper(props);
        wrapper.instance().descriptionHandler = sinon.spy();
        wrapper.instance().onDescriptionChange(event);
        expect(event.persist.calledOnce).toBe(true);
        expect(wrapper.instance().descriptionHandler.calledOnce).toBe(true);
        expect(wrapper.instance().descriptionHandler.calledWith(event)).toBe(true);
    });

    it('onProjectChange should call persist and nameHandler', () => {
        const props = getProps();
        const event = { persist: sinon.spy() };
        const wrapper = getWrapper(props);
        wrapper.instance().projectHandler = sinon.spy();
        wrapper.instance().onProjectChange(event);
        expect(event.persist.calledOnce).toBe(true);
        expect(wrapper.instance().projectHandler.calledOnce).toBe(true);
        expect(wrapper.instance().projectHandler.calledWith(event)).toBe(true);
    });

    it('onChangeCheck should add a provider', () => {
        const appProviders = [{ name: 'one' }, { name: 'two' }];
        const exportProviders = [{ name: 'one' }];
        const event = { target: { name: 'two', checked: true } };
        const props = getProps();
        props.updateExportInfo = sinon.spy();
        props.exportInfo.providers = exportProviders;
        props.providers = appProviders;
        const wrapper = getWrapper(props);
        wrapper.instance().onChangeCheck(event);
        expect(props.updateExportInfo.called).toBe(true);
        expect(props.updateExportInfo.calledWith({
            ...props.exportInfo,
            providers: [{ name: 'one' }, { name: 'two' }],
        })).toBe(true);
    });

    it('onChangeCheck should remove a provider', () => {
        const appProviders = [{ name: 'one' }, { name: 'two' }];
        const exportProviders = [{ name: 'one' }, { name: 'two' }];
        const event = { target: { name: 'two', checked: false } };
        const props = getProps();
        props.updateExportInfo = sinon.spy();
        props.exportInfo.providers = exportProviders;
        props.providers = appProviders;
        const wrapper = getWrapper(props);
        wrapper.instance().onChangeCheck(event);
        expect(props.updateExportInfo.called).toBe(true);
        expect(props.updateExportInfo.calledWith({
            ...props.exportInfo,
            providers: [{ name: 'one' }],
        })).toBe(true);
    });

    it('onRefresh should setState with empty availability and call checkAvailability', () => {
        const props = getProps();
        props.providers = [{ name: 'one' }, { name: 'two' }];
        props.exportInfo.providers = [...props.providers];
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const checkStub = sinon.stub(wrapper.instance(), 'checkAvailability');
        wrapper.instance().onRefresh();
        const expected = [
            { name: 'one', availability: {} },
            { name: 'two', availability: {} },
        ];
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ providers: expected }));
        expect(checkStub.calledTwice).toBe(true);
        stateStub.restore();
        checkStub.restore();
    });

    it('expandedChange should setState', () => {
        const props = getProps();
        const stateSpy = sinon.spy(ExportInfo.prototype, 'setState');
        const wrapper = getWrapper(props);
        expect(stateSpy.called).toBe(false);
        // dont actually create a map when expanded
        wrapper.instance().initializeOpenLayers = sinon.spy();
        wrapper.instance().expandedChange(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ expanded: true })).toBe(true);
        stateSpy.restore();
    });

    it('handleFormatsClose should setState to false', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleFormatsClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ formatsDialogOpen: false })).toBe(true);
        stateStub.restore();
    });

    it('handleFormatsOpen should setState to true', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleFormatsOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ formatsDialogOpen: true })).toBe(true);
        stateStub.restore();
    });

    it('handleProjectionsOpen should setState to true', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleProjectionsOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ projectionsDialogOpen: true })).toBe(true);
        stateStub.restore();
    });

    it('handleProjectionsClose should setState to false', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleProjectionsClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ projectionsDialogOpen: false })).toBe(true);
        stateStub.restore();
    });

    it('handleLicenseOpen should setState to true', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleLicenseOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ licenseDialogOpen: true })).toBe(true);
        stateStub.restore();
    });

    it('handleLicenseClose should setState to false', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        wrapper.instance().handleLicenseClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ licenseDialogOpen: false })).toBe(true);
        stateStub.restore();
    });

    it('handleRefreshTooltipOpen should setState true', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const ret = wrapper.instance().handleRefreshTooltipOpen();
        expect(ret).toEqual(false);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ refreshTooltipOpen: true })).toBe(true);
        stateStub.restore();
    });

    it('handleRefreshTooltipClose should setState false', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateStub = sinon.stub(wrapper.instance(), 'setState');
        const ret = wrapper.instance().handleRefreshTooltipClose();
        expect(ret).toBe(false);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ refreshTooltipOpen: false })).toBe(true);
        stateStub.restore();
    });

    it('hasRequiredFields should return whether the exportInfo required fields are filled', () => {
        const invalid = {
            exportName: 'name',
            datapackDescription: 'stuff',
            projectName: 'name',
            providers: [],
        };
        const valid = {
            exportName: 'name',
            datapackDescription: 'stuff',
            projectName: 'name',
            providers: [{}],
        };
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.instance().hasRequiredFields(invalid)).toBe(false);
        expect(wrapper.instance().hasRequiredFields(valid)).toBe(true);
    });

    it('initializeOpenLayers should create a map and add layer', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const defaultSpy = sinon.spy(interaction, 'defaults');
        const readSpy = sinon.spy(GeoJSON.prototype, 'readFeatures');
        const addFeatureSpy = sinon.spy(VectorSource.prototype, 'addFeatures');
        const addLayerSpy = sinon.spy(Map.prototype, 'addLayer');
        const getViewSpy = sinon.spy(Map.prototype, 'getView');
        const getSizeSpy = sinon.spy(Map.prototype, 'getSize');
        const fitSpy = sinon.spy(View.prototype, 'fit');
        wrapper.instance().initializeOpenLayers();
        expect(defaultSpy.calledOnce).toBe(true);
        expect(readSpy.calledOnce).toBe(true);
        expect(addFeatureSpy.calledOnce).toBe(true);
        expect(addLayerSpy.calledOnce).toBe(true);
        expect(getViewSpy.calledTwice).toBe(true);
        expect(fitSpy.calledOnce).toBe(true);
        expect(getSizeSpy.calledOnce).toBe(true);
    });
});
