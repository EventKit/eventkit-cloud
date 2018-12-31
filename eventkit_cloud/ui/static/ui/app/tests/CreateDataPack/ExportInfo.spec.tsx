import * as React from 'react';
import * as sinon from 'sinon';
import axios from 'axios';
import { shallow } from 'enzyme';
import * as  MockAdapter from 'axios-mock-adapter';
import List from '@material-ui/core/List';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import Joyride from 'react-joyride';
import BaseDialog from '../../components/Dialog/BaseDialog';
import MapCard from '../../components/common/MapCard';
import DataProvider from '../../components/CreateDataPack/DataProvider';
import { ExportInfo } from '../../components/CreateDataPack/ExportInfo';
import CustomScrollbar from '../../components/CustomScrollbar';
import TextField from '../../components/CustomTextField';
import * as utils from '../../utils/generic';

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
                providers: [],
            },
            providers: [],
            formats,
            nextEnabled: true,
            walkthroughClicked: false,
            onWalkthroughReset: sinon.spy(),
            handlePrev: sinon.spy(),
            updateExportInfo: sinon.spy(),
            setNextDisabled: sinon.spy(),
            setNextEnabled: sinon.spy(),
            ...(global as any).eventkit_test_props,
            classes: {},
        }
    );

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        const config = { BASEMAP_URL: 'http://my-osm-tile-service/{z}/{x}/{y}.png' };
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<ExportInfo {...props} />, {
            context: { config },
        });
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render a form', () => {
        expect(wrapper.find('#root')).toHaveLength(1);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find('#form')).toHaveLength(1);
        expect(wrapper.find(Paper)).toHaveLength(1);
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
        const areaSpy = sinon.spy(utils, 'getSqKmString');
        const hasFieldsSpy = sinon.spy(ExportInfo.prototype, 'hasRequiredFields');
        const joyrideSpy = sinon.spy(ExportInfo.prototype, 'joyrideAddSteps');
        setup();
        expect(hasFieldsSpy.called).toBe(true);
        expect(hasFieldsSpy.calledWith(props.exportInfo)).toBe(true);
        expect(joyrideSpy.calledOnce).toBe(true);
        expect(props.setNextDisabled.called).toBe(true);
        expect(props.updateExportInfo.calledWith({
            ...props.exportInfo,
            areaStr: expectedString,
        })).toBe(true);
        expect(props.updateExportInfo.called).toBe(true);
        areaSpy.restore();
        hasFieldsSpy.restore();
        joyrideSpy.restore();
    });

    it('componentDidUpdate should setNextEnabled', () => {
        const nextProps = getProps();
        nextProps.setNextEnabled = sinon.spy();
        nextProps.exportInfo.exportName = 'name';
        nextProps.exportInfo.datapackDescription = 'description';
        nextProps.exportInfo.projectName = 'project';
        nextProps.exportInfo.providers = [{}];
        nextProps.nextEnabled = false;
        wrapper.setProps(nextProps);
        expect(nextProps.setNextEnabled.calledOnce).toBe(true);
    });

    it('componentDidUpdate should setNextDisabled', () => {
        const nextProps = getProps();
        nextProps.setNextDisabled = sinon.spy();
        nextProps.nextEnabled = true;
        wrapper.setProps(nextProps);
        expect(nextProps.setNextDisabled.calledOnce).toBe(true);
    });

    it('componentDidUpdate should reset joyride and set running state', () => {
        const joyride = { current: { reset: sinon.spy() } };
        instance.joyride = joyride;
        const stateStub = sinon.stub(instance, 'setState');
        const nextProps = getProps();
        nextProps.walkthroughClicked = true;
        wrapper.setProps(nextProps);
        expect(joyride.current.reset.calledOnce).toBe(true);
        expect(stateStub.calledWith({ isRunning: true })).toBe(true);
    });

    it('componentDidUpdate should update the providers and call checkProviders', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const checkStub = sinon.stub(instance, 'checkProviders');
        const nextProps = getProps();
        nextProps.providers = [{ slug: '124' }];
        wrapper.setProps(nextProps);
        expect(stateStub.calledWith({ providers: nextProps.providers })).toBe(true);
        expect(checkStub.calledWith(nextProps.providers)).toBe(true);
    });

    it('onNameChange should call updateExportInfo', () => {
        const event = { target: { value: 'test' } };
        props.updateExportInfo.reset();
        instance.onNameChange(event);
        expect(props.updateExportInfo.calledOnce).toBe(true);
        expect(props.updateExportInfo.calledWith({
            ...props.exportInfo,
            exportName: 'test',
        })).toBe(true);
    });

    it('onDescriptionChange should call persist and nameHandler', () => {
        const event = { target: { value: 'test' } };
        props.updateExportInfo.reset();
        instance.onDescriptionChange(event);
        expect(props.updateExportInfo.calledOnce).toBe(true);
        expect(props.updateExportInfo.calledWith({
            ...props.exportInfo,
            datapackDescription: 'test',
        })).toBe(true);
    });

    it('onProjectChange should call persist and nameHandler', () => {
        const event = { target: { value: 'test' } };
        props.updateExportInfo.reset();
        instance.onProjectChange(event);
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
        wrapper.setProps({
            providers: appProviders,
            exportInfo: {
                ...props.exportInfo,
                providers: exportProviders,
            },
        });
        instance.onChangeCheck(event);
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
        wrapper.setProps({
            providers: appProviders,
            exportInfo: {
                ...props.exportInfo,
                providers: exportProviders,
            },
        });
        instance.onChangeCheck(event);
        expect(props.updateExportInfo.called).toBe(true);
        expect(props.updateExportInfo.calledWith({
            ...props.exportInfo,
            providers: [{ name: 'one' }],
        })).toBe(true);
    });

    it('onRefresh should setState with empty availability and call checkAvailability', () => {
        const p = getProps();
        p.providers = [{ name: 'one' }, { name: 'two' }];
        p.exportInfo.providers = [...p.providers];
        setup(p);
        const stateStub = sinon.stub(instance, 'setState');
        const checkStub = sinon.stub(instance, 'checkAvailability');
        instance.onRefresh();
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

    it('getAvailability should return updated provider', async () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        const provider = {
            slug: '123',
        };
        mock.onPost(`/api/providers/${provider.slug}/status`)
            .reply(200, { status: 'some status' });
        const parseStub = sinon.stub(JSON, 'parse').callsFake(input => input);
        const expected = {
            ...provider,
            availability: {
                status: 'some status',
                slug: provider.slug,
            },
        };
        const newProvider = await instance.getAvailability(provider, {});
        expect(newProvider).toEqual(expected);
        parseStub.restore();
    });

    it('getAvailability should return failed provider', async () => {
        const mock = new MockAdapter(axios, { delayResponse: 10 });
        const provider = {
            slug: '123',
        };
        mock.onPost(`/api/providers/${provider.slug}/status`)
            .reply(400, { status: 'some status' });
        const expected = {
            ...provider,
            availability: {
                status: 'WARN',
                type: 'CHECK_FAILURE',
                message: 'An error occurred while checking this provider\'s availability.',
                slug: provider.slug,
            },
        };
        const newProvider = await instance.getAvailability(provider, {});
        expect(newProvider).toEqual(expected);
    });

    it('checkAvailability should setState with new provider', async () => {
        const provider = {
            slug: '123',
        };

        const newProvider = {
            slug: '123',
            availability: {
                status: 'GOOD',
            },
        };

        sinon.stub(instance, 'getAvailability').callsFake(() => (
            new Promise((resolve) => {
                setTimeout(() => resolve(newProvider), 100);
            })
        ));
        const stateSpy = sinon.spy(instance, 'setState');
        await instance.checkAvailability(provider);
        expect(stateSpy.calledOnce).toBe(true);
        expect(wrapper.state().providers).toEqual([newProvider]);
    });

    it('checkProviders should call checkAvailablity for each provider', () => {
        const providers = [{ display: true }, { display: false }, { display: true }];
        const checkStub = sinon.stub(instance, 'checkAvailability');
        instance.checkProviders(providers);
        expect(checkStub.calledTwice).toBe(true);
    });

    it('handleProjectionsOpen should setState to true', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleProjectionsOpen();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ projectionsDialogOpen: true })).toBe(true);
        stateStub.restore();
    });

    it('handleProjectionsClose should setState to false', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handleProjectionsClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ projectionsDialogOpen: false })).toBe(true);
        stateStub.restore();
    });

    it('handlePopoverOpen should setState with anchorEl', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const e = { currentTarget: sinon.spy() };
        instance.handlePopoverOpen(e);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ refreshPopover: e.currentTarget })).toBe(true);
        stateStub.restore();
    });

    it('handlePopoverClose should setState anchorEl', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handlePopoverClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({ refreshPopover: null })).toBe(true);
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
        expect(instance.hasRequiredFields(invalid)).toBe(false);
        expect(instance.hasRequiredFields(valid)).toBe(true);
    });

    it('hasDisallowedSelection should return true if the provider status is FATAL', () => {
        const provider = {
            slug: 'test',
            availability: { status: 'FATAL' },
        };
        const info = { providers: [provider] };
        setup({ providers: [provider] });
        expect(instance.hasDisallowedSelection(info)).toBe(true);
    });

    it('hasDisallowedSelection should return false if no status', () => {
        const provider = {
            slug: 'test',
            availability: { status: undefined },
        };
        const info = { providers: [provider] };
        setup({ providers: [provider] });
        expect(instance.hasDisallowedSelection(info)).toBe(false);
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
        const stateSpy = sinon.stub(instance, 'setState');
        instance.joyrideAddSteps(steps);
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
        instance.joyride = { current: { reset: sinon.spy() } };
        const stateSpy = sinon.stub(instance, 'setState');
        instance.callback(callbackData);
        expect(stateSpy.calledWith({ isRunning: false }));
        stateSpy.restore();
    });

    it('callback should set location hash', () => {
        const data = {
            action: 'something',
            index: 2,
            step: {
                scrollToId: 'scrollhere',
            },
            type: 'step:before',
        };
        expect(window.location.hash).toEqual('');
        instance.callback(data);
        expect(window.location.hash).toEqual(`#${data.step.scrollToId}`);
    });

    it('callback should call setNextEnabled', () => {
        const data = {
            action: 'something',
            index: 5,
            step: {},
            type: 'tooltip:before',
        };
        instance.callback(data);
        expect(props.setNextEnabled.calledOnce).toBe(true);
    });
});
