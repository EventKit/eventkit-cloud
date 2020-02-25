import * as React from 'react';
import * as sinon from 'sinon';
import {shallow} from 'enzyme';
import List from '@material-ui/core/List';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import Joyride from 'react-joyride';
import MapCard from '../../components/common/MapCard';
import DataProvider from '../../components/CreateDataPack/DataProvider';
import {ExportInfo} from '../../components/CreateDataPack/ExportInfo';
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
const projections = [
    {
        srid: 4326,
        name: 'EPSG:4326',
        description: null,
    },
    {
        srid: 1,
        name: 'EPSG:1',
        description: null,
    }
];

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
                providers: [{slug: 'osm'}, {slug: 'osm'}],
                providerInfo: {
                    'osm': {
                        availability: {
                            status: 'STAT'
                        },
                }
                },
                exportOptions: {
                    '123': {
                        minZoom: 0,
                        maxZoom: 2,
                    }
                },
                projections: [],
            },
            providers: [],
            projections,
            formats,
            nextEnabled: true,
            walkthroughClicked: false,
            onWalkthroughReset: sinon.spy(),
            handlePrev: sinon.spy(),
            updateExportInfo: sinon.spy(),
            onUpdateEstimate: sinon.spy(),
            setNextDisabled: sinon.spy(),
            setNextEnabled: sinon.spy(),
            checkProvider: sinon.spy(),
            ...(global as any).eventkit_test_props,
            classes: {},
        }
    );

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}, serveEstimates = true) => {
        const config = {
            BASEMAP_URL: 'http://my-osm-tile-service/{z}/{x}/{y}.png',
            SERVE_ESTIMATES: serveEstimates
        };
        props = {...getProps(), ...overrides};
        wrapper = shallow(<ExportInfo {...props} />, {
            context: {config},
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
        expect(wrapper.find('.qa-ExportInfo-projections').find(Checkbox)).toHaveLength(2);
        expect(wrapper.find(MapCard)).toHaveLength(1);
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
            areaStr: expectedString,
            projections: [4326], // We force 4326 to be selected by default (except when something is already selected e.g. cloning)
        })).toBe(true);
        expect(props.updateExportInfo.called).toBe(true);
        areaSpy.restore();
        hasFieldsSpy.restore();
        joyrideSpy.restore();
    });

    it('componentDidMount should not update projections when already in state', () => {
        const expectedString = '12,393 sq km';
        const areaSpy = sinon.spy(utils, 'getSqKmString');
        const defaultProps = getProps();
        setup({
            exportInfo: {
                ...defaultProps.exportInfo,
                projections: [3857],
            }
        });
        expect(props.updateExportInfo.calledWith({
            areaStr: expectedString,
        })).toBe(true);
        expect(props.updateExportInfo.called).toBe(true);
        areaSpy.restore();
    });

    it('componentDidUpdate should setNextEnabled', () => {
        const nextProps = getProps();
        nextProps.setNextEnabled = sinon.spy();
        nextProps.exportInfo.exportName = 'name';
        nextProps.exportInfo.datapackDescription = 'description';
        nextProps.exportInfo.projectName = 'project';
        nextProps.exportInfo.projections = [4326];
        nextProps.exportInfo.providers = [{slug: 'providerslug'}];
        nextProps.exportInfo.exportOptions = {
            providerslug: {
                formats: ['validformat']
            }
        };
        nextProps.nextEnabled = false;
        wrapper.setProps(nextProps);
        expect(nextProps.setNextEnabled.callCount).toBe(3);
    });

    it('componentDidUpdate should setNextDisabled', () => {
        const nextProps = getProps();
        nextProps.setNextDisabled = sinon.spy();
        nextProps.nextEnabled = true;
        wrapper.setProps(nextProps);
        expect(nextProps.setNextDisabled.calledOnce).toBe(true);
    });

    it('componentDidUpdate should reset joyride and set running state', () => {
        const joyride = {current: {reset: sinon.spy()}};
        instance.joyride = joyride;
        const stateStub = sinon.stub(instance, 'setState');
        const nextProps = getProps();
        nextProps.walkthroughClicked = true;
        wrapper.setProps(nextProps);
        expect(joyride.current.reset.calledOnce).toBe(true);
        expect(stateStub.calledWith({isRunning: true})).toBe(true);
    });

    it('componentDidUpdate should update the providers and call checkProviders', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const checkStub = sinon.stub(instance, 'checkProviders');
        const nextProps = getProps();
        nextProps.providers = [{slug: '124'}];
        wrapper.setProps(nextProps);
        expect(stateStub.calledWith({providers: nextProps.providers})).toBe(true);
        expect(checkStub.calledWith(nextProps.providers)).toBe(true);
    });

    it('onNameChange should call updateExportInfo', () => {
        const event = {target: {value: 'test'}};
        props.updateExportInfo.resetHistory();
        instance.onNameChange(event);
        expect(props.updateExportInfo.calledOnce).toBe(true);
        expect(props.updateExportInfo.calledWith({
            exportName: 'test',
        })).toBe(true);
    });

    it('onDescriptionChange should call persist and nameHandler', () => {
        const event = {target: {value: 'test'}};
        props.updateExportInfo.resetHistory();
        instance.onDescriptionChange(event);
        expect(props.updateExportInfo.calledOnce).toBe(true);
        expect(props.updateExportInfo.calledWith({
            datapackDescription: 'test',
        })).toBe(true);
    });

    it('onProjectChange should call persist and nameHandler', () => {
        const event = {target: {value: 'test'}};
        props.updateExportInfo.resetHistory();
        instance.onProjectChange(event);
        expect(props.updateExportInfo.calledOnce).toBe(true);
        expect(props.updateExportInfo.calledWith({
            projectName: 'test',
        })).toBe(true);
    });

    it('onChangeCheck should add a provider', () => {
        const appProviders = [{name: 'one'}, {name: 'two'}];
        const exportProviders = [{name: 'one'}];
        const event = {target: {name: 'two', checked: true}};
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
            providers: [{name: 'one'}, {name: 'two'}],
        })).toBe(true);
    });

    it('onChangeCheck should remove a provider', () => {
        const appProviders = [{name: 'one'}, {name: 'two'}];
        const exportProviders = [{name: 'one'}, {name: 'two'}];
        const event = {target: {name: 'two', checked: false}};
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
            providers: [{name: 'one'}],
        })).toBe(true);
    });

    it('onRefresh should setState with empty availability and estimate and call checkProviders', () => {
        const p = getProps();
        p.providers = [{name: 'one'}, {name: 'two'}];
        p.exportInfo.providers = [...p.providers];
        setup(p);
        const stateStub = sinon.stub(instance, 'setState');
        const checkStub = sinon.stub(instance, 'checkProviders');
        instance.onRefresh();
        const expected = [
            {name: 'one', availability: {}, estimate: {}},
            {name: 'two', availability: {}, estimate: {}},
        ];
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({providers: expected}));
        expect(checkStub.calledOnce).toBe(true);
        stateStub.restore();
        checkStub.restore();
    });

    it('handlePopoverOpen should setState with anchorEl', () => {
        const stateStub = sinon.stub(instance, 'setState');
        const e = {currentTarget: sinon.spy()};
        instance.handlePopoverOpen(e);
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({refreshPopover: e.currentTarget})).toBe(true);
        stateStub.restore();
    });

    it('handlePopoverClose should setState anchorEl', () => {
        const stateStub = sinon.stub(instance, 'setState');
        instance.handlePopoverClose();
        expect(stateStub.calledOnce).toBe(true);
        expect(stateStub.calledWith({refreshPopover: null})).toBe(true);
        stateStub.restore();
    });

    it('hasRequiredFields should return whether the exportInfo required fields are filled', () => {
        const invalid = {
            exportName: 'name',
            datapackDescription: 'stuff',
            projectName: 'name',
            providers: [],
            exportOptions: {}
        };
        const valid = {
            exportName: 'name',
            datapackDescription: 'stuff',
            projectName: 'name',
            providers: [{slug: 'providerslug'}],
            projections: [4326],
            exportOptions: {
                providerslug: {
                    formats: ['validformat'],
                }
            },
        };
        expect(instance.hasRequiredFields(invalid)).toBe(false);
        expect(instance.hasRequiredFields(valid)).toBe(true);
    });

    it('hasDisallowedSelection should return true if the provider status is FATAL', () => {
        const provider = {
            slug: 'providerslug'
        };
        const providerInfo = {
            providerslug: {
                availability: {
                    status: 'FATAL',
                    type: 'type',
                    slug: 'providerslug',
                    message: 'message'
                },
             }
        };
        const info = {providerInfo: {providerInfo}};
        setup({providerInfo: {providerInfo}});
        expect(instance.hasDisallowedSelection(info)).toBe(true);
    });

    it('hasDisallowedSelection should return false if no status', () => {
        const provider = {
            slug: 'test',
            availability: {status: undefined},
        };
        const info = {providers: [provider]};
        setup({providers: [provider]});
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
        expect(stateSpy.calledWith({steps}));
        stateSpy.restore();
    });

    it('opens the dataprovider drawer when openDrawer is called', () => {
        instance.state = {providerDrawerIsOpen: null};
        instance.dataProvider = {current: {state: {open: false}}};
        const stateSpy = sinon.stub(instance, 'setState');
        const handleDataProviderExpandSpy = sinon.stub(instance, 'handleDataProviderExpand');
        expect(stateSpy.calledWith({isRunning: false}));
        expect(handleDataProviderExpandSpy.wasCalled);
        stateSpy.restore();
        handleDataProviderExpandSpy.restore();
    });

    it('closes the dataprovider drawer when resetDrawer is called', () => {
        instance.state = {providerDrawerIsOpen: false};
        instance.dataProvider = {current: {state: {open: true}}};
        const stateSpy = sinon.stub(instance, 'setState');
        const handleDataProviderExpandSpy = sinon.stub(instance, 'handleDataProviderExpand');
        expect(stateSpy.calledWith({providerDrawerIsOpen: null}));
        expect(handleDataProviderExpandSpy.wasCalled);
        stateSpy.restore();
        handleDataProviderExpandSpy.restore();
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
        instance.joyride = {current: {reset: sinon.spy()}};
        const stateSpy = sinon.stub(instance, 'setState');
        const resetDrawerSpy = sinon.stub(instance, 'resetDrawer');
        instance.callback(callbackData);
        expect(stateSpy.calledWith({isRunning: false}));
        expect(resetDrawerSpy.wasCalled);
        stateSpy.restore();
        resetDrawerSpy.restore();
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
            index: 9,
            step: {},
            type: 'tooltip:before',
        };
        instance.callback(data);
        expect(props.setNextEnabled.calledOnce).toBe(true);
    });
});
