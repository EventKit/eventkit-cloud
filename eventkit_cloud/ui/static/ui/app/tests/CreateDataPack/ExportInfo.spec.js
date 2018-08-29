import React from 'react';
import sinon from 'sinon';
import PropTypes from 'prop-types';
import raf from 'raf';
import { mount } from 'enzyme';
import List from '@material-ui/core/List';
import Checkbox from '@material-ui/core/Checkbox';
import Joyride from 'react-joyride';
import BaseDialog from '../../components/Dialog/BaseDialog';
import MapCard from '../../components/common/MapCard';
import DataProvider from '../../components/CreateDataPack/DataProvider';
import { ExportInfo } from '../../components/CreateDataPack/ExportInfo';
import CustomScrollbar from '../../components/CustomScrollbar';
import TextField from '../../components/CustomTextField';
import * as utils from '../../utils/generic';

// this polyfills requestAnimationFrame in the test browser, required for ol3
raf.polyfill();

const formats = [
    {
        uid: 'ed48a7c1-1fc3-463e-93b3-e93eb3861a5a',
        url: 'http://cloud.eventkit.test/api/formats/shp',
        slug: 'shp',
        name: 'ESRI Shapefile Format',
        description: 'Esri Shapefile (OSM Schema)',
    },
    {
        uid: '978ab89c-caf7-4296-9a0c-836fc679ea07',
        url: 'http://cloud.eventkit.test/api/formats/gpkg',
        slug: 'gpkg',
        name: 'Geopackage',
        description: 'GeoPackage',
    }];

describe('ExportInfo component', () => {
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
            walkthroughClicked: false,
            onWalkthroughReset: () => {},
            handlePrev: () => {},
            updateExportInfo: () => {},
            setNextDisabled: () => {},
            setNextEnabled: () => {},
        }
    );

    const getWrapper = (props) => {
        const config = { BASEMAP_URL: 'http://my-osm-tile-service/{z}/{x}/{y}.png' };
        return mount(<ExportInfo {...props} />, {
            context: { config },
            childContextTypes: {
                config: PropTypes.object,
            },
        });
    };

    it('should render a form', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('#root')).toHaveLength(1);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find('#form')).toHaveLength(1);
        expect(wrapper.find('#paper').hostNodes()).toHaveLength(1);
        expect(wrapper.find('#mainHeading')).toHaveLength(1);
        expect(wrapper.find(TextField)).toHaveLength(3);
        expect(wrapper.find('#layersHeader')).toHaveLength(1);
        expect(wrapper.find('#layersHeader').text()).toEqual('Select Data Sources');
        expect(wrapper.find('#layersSubheader').text()).toEqual('(You must choose at least one)');
        expect(wrapper.find(List)).toHaveLength(1);
        expect(wrapper.find(DataProvider)).toHaveLength(0);
        expect(wrapper.find('.qa-ExportInfo-projectionHeader')).toHaveLength(1);
        expect(wrapper.find('.qa-ExportInfo-projectionHeader').text()).toEqual('Select Projection');
        expect(wrapper.find('.qa-ExportInfo-projections').find(Checkbox)).toHaveLength(1);
        expect(wrapper.find(MapCard)).toHaveLength(1);
        expect(wrapper.find(BaseDialog)).toHaveLength(1);
        expect(wrapper.find(Joyride)).toHaveLength(1);
    });

    it('componentDidMount should setNextDisabled, setArea, and add joyride steps', () => {
        const expectedString = '12,393 sq km';
        const props = getProps();
        props.updateExportInfo = sinon.spy();
        props.setNextDisabled = sinon.spy();
        const mountSpy = sinon.spy(ExportInfo.prototype, 'componentDidMount');
        const areaSpy = sinon.spy(utils, 'getSqKmString');
        const hasFieldsSpy = sinon.spy(ExportInfo.prototype, 'hasRequiredFields');
        const joyrideSpy = sinon.spy(ExportInfo.prototype, 'joyrideAddSteps');
        getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(hasFieldsSpy.calledOnce).toBe(true);
        expect(hasFieldsSpy.calledWith(props.exportInfo)).toBe(true);
        expect(joyrideSpy.calledOnce).toBe(true);
        expect(props.setNextDisabled.calledOnce).toBe(true);
        expect(props.updateExportInfo.calledWith({
            ...props.exportInfo,
            areaStr: expectedString,
        })).toBe(true);
        expect(props.updateExportInfo.called).toBe(true);
        mountSpy.restore();
        areaSpy.restore();
        hasFieldsSpy.restore();
        joyrideSpy.restore();
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

    it('onNameChange should call updateExportInfo', () => {
        const props = getProps();
        props.updateExportInfo = sinon.spy();
        const event = { target: { value: 'test' } };
        const wrapper = getWrapper(props);
        props.updateExportInfo.reset();
        wrapper.instance().onNameChange(event);
        expect(props.updateExportInfo.calledOnce).toBe(true);
        expect(props.updateExportInfo.calledWith({
            ...props.exportInfo,
            exportName: 'test',
        })).toBe(true);
    });

    it('onDescriptionChange should call persist and nameHandler', () => {
        const props = getProps();
        props.updateExportInfo = sinon.spy();
        const event = { target: { value: 'test' } };
        const wrapper = getWrapper(props);
        props.updateExportInfo.reset();
        wrapper.instance().onDescriptionChange(event);
        expect(props.updateExportInfo.calledOnce).toBe(true);
        expect(props.updateExportInfo.calledWith({
            ...props.exportInfo,
            datapackDescription: 'test',
        })).toBe(true);
    });

    it('onProjectChange should call persist and nameHandler', () => {
        const props = getProps();
        props.updateExportInfo = sinon.spy();
        const event = { target: { value: 'test' } };
        const wrapper = getWrapper(props);
        props.updateExportInfo.reset();
        wrapper.instance().onProjectChange(event);
        expect(props.updateExportInfo.calledOnce).toBe(true);
        expect(props.updateExportInfo.calledWith({
            ...props.exportInfo,
            projectName: 'test',
        })).toBe(true);
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

    it('joyrideAddSteps should set state for steps in tour', () => {
        const steps = [
            {
                title: 'Search for location',
                text: 'Type in location name to set area of interest.',
                selector: '.bootstrap-typeahead-input',
                position: 'bottom',
                style: {},
            },
        ];
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = sinon.stub(ExportInfo.prototype, 'setState');
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
        const stateSpy = sinon.stub(ExportInfo.prototype, 'setState');
        wrapper.instance().callback(callbackData);
        expect(stateSpy.calledWith({ isRunning: false }));
        stateSpy.restore();
    });
});
