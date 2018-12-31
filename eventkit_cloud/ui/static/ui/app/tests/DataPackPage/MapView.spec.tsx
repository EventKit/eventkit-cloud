import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import GridList from '@material-ui/core/GridList';
import * as axios from 'axios';
import * as MockAdapter from 'axios-mock-adapter';

import Map from 'ol/map';
import Feature from 'ol/feature';
import View from 'ol/view';
import extent from 'ol/extent';
import Observable from 'ol/observable';
import interaction from 'ol/interaction';
import Point from 'ol/geom/point';
import Polygon from 'ol/geom/polygon';
import VectorSource from 'ol/source/vector';
import Style from 'ol/style/style';
import GeoJSON from 'ol/format/geojson';

import DataPackListItem from '../../components/DataPackPage/DataPackListItem';
import LoadButtons from '../../components/common/LoadButtons';
import MapPopup from '../../components/DataPackPage/MapPopup';
import CustomScrollbar from '../../components/CustomScrollbar';
import SearchAOIToolbar from '../../components/MapTools/SearchAOIToolbar';
import DrawAOIToolbar from '../../components/MapTools/DrawAOIToolbar';
import InvalidDrawWarning from '../../components/MapTools/InvalidDrawWarning';
import DropZone from '../../components/MapTools/DropZone';
import * as utils from '../../utils/mapUtils';
import { MapView, RED_STYLE, BLUE_STYLE } from '../../components/DataPackPage/MapView';
import ZoomLevelLabel from '../../components/MapTools/ZoomLevelLabel';

const providers = [{
    id: 2,
    type: 'osm',
    license: null,
    uid: 'bc9a834a-727a-4779-8679-2500880a8526',
    name: 'OpenStreetMap Data (Themes)',
    slug: 'osm',
    service_copyright: '',
    service_description: 'OpenStreetMap vector data.',
    display: true,
    export_provider_type: 2,
}];

function getRuns() {
    return [{
        uid: '6870234f-d876-467c-a332-65fdf0399a0d',
        url: 'http://cloud.eventkit.test/api/runs/6870234f-d876-467c-a332-65fdf0399a0d',
        started_at: '2017-03-10T15:52:35.637331Z',
        finished_at: '2017-03-10T15:52:39.837Z',
        user: 'admin',
        status: 'COMPLETED',
        job: {
            uid: '7643f806-1484-4446-b498-7ddaa65d011a',
            name: 'Test1',
            event: 'Test1 event',
            featured: false,
            description: 'Test1 description',
            url: 'http://cloud.eventkit.test/api/jobs/7643f806-1484-4446-b498-7ddaa65d011a',
            extent: {
                type: 'Feature',
                properties: {
                    uid: '7643f806-1484-4446-b498-7ddaa65d011a',
                    name: 'Test1',
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [-0.077419, 50.778155],
                            [-0.077419, 50.818517],
                            [-0.037251, 50.818517],
                            [-0.037251, 50.778155],
                            [-0.077419, 50.778155],
                        ],
                    ],
                },
            },
            selection: '',
            permissions: {
                value: 'PRIVATE',
                groups: {},
                members: {},
            },
        },
        provider_tasks: [],
        expiration: '2017-03-24T15:52:35.637258Z',
    },
    {
        uid: 'c7466114-8c0c-4160-8383-351414b11e37',
        url: 'http://cloud.eventkit.test/api/runs/c7466114-8c0c-4160-8383-351414b11e37',
        started_at: '2017-03-10T15:52:29.311523Z',
        finished_at: '2017-03-10T15:52:33.612Z',
        user: 'notAdmin',
        status: 'COMPLETED',
        job: {
            uid: '5488a864-89f2-4e9c-8370-18291ecdae4a',
            name: 'Test2',
            event: 'Test2 event',
            featured: true,
            description: 'Test2 description',
            url: 'http://cloud.eventkit.test/api/jobs/5488a864-89f2-4e9c-8370-18291ecdae4a',
            extent: {
                type: 'Feature',
                properties: {
                    uid: '5488a864-89f2-4e9c-8370-18291ecdae4a',
                    name: 'Test2',
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [-0.077419, 50.778155],
                            [-0.077419, 50.818517],
                            [-0.037251, 50.818517],
                            [-0.037251, 50.778155],
                            [-0.077419, 50.778155],
                        ],
                    ],
                },
            },
            selection: '',
            permissions: {
                value: 'PRIVATE',
                groups: {},
                members: {},
            },
        },
        provider_tasks: [],
        expiration: '2017-03-24T15:52:29.311458Z',
    },
    {
        uid: '282816a6-7d16-4f59-a1a9-18764c6339d6',
        url: 'http://cloud.eventkit.test/api/runs/282816a6-7d16-4f59-a1a9-18764c6339d6',
        started_at: '2017-03-10T15:52:18.796929Z',
        finished_at: '2017-03-10T15:52:27.500Z',
        user: 'admin',
        status: 'COMPLETED',
        job: {
            uid: '78bbd59a-4066-4e30-8460-c7b0093a0d7a',
            name: 'Test3',
            event: 'Test3 event',
            featured: false,
            description: 'Test3 description',
            url: 'http://cloud.eventkit.test/api/jobs/78bbd59a-4066-4e30-8460-c7b0093a0d7a',
            extent: {
                type: 'Feature',
                properties: {
                    uid: '78bbd59a-4066-4e30-8460-c7b0093a0d7a',
                    name: 'Test3',
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [-0.077419, 50.778155],
                            [-0.077419, 50.818517],
                            [-0.037251, 50.818517],
                            [-0.037251, 50.778155],
                            [-0.077419, 50.778155],
                        ],
                    ],
                },
            },
            selection: '',
            permissions: {
                value: 'PRIVATE',
                groups: {},
                members: {},
            },
        },
        provider_tasks: [],
        expiration: '2017-03-24T15:52:18.796854Z',
    }];
}

describe('MapView component', () => {
    const getProps = () => ({
        runs: getRuns(),
        runIds: getRuns().map(run => run.uid),
        user: { data: { user: { username: 'admin' } } },
        users: [],
        groups: [],
        onRunDelete: sinon.spy(),
        onRunShare: sinon.spy(),
        range: '12/24',
        handleLoadLess: sinon.spy(),
        handleLoadMore: sinon.spy(),
        loadLessDisabled: true,
        loadMoreDisabled: false,
        geocode: {},
        getGeocode: sinon.spy(),
        importGeom: { processed: false, featureCollection: null },
        processGeoJSONFile: sinon.spy(),
        resetGeoJSONFile: sinon.spy(),
        onMapFilter: sinon.spy(),
        providers,
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}, options = {}) => {
        const config = { BASEMAP_URL: 'http://my-osm-tile-service/{z}/{x}/{y}.png' };
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<MapView {...props} />, {
            context: { config },
            ...options,
        });
        instance = wrapper.instance();
    };

    let initOverlay;
    beforeAll(() => {
        initOverlay = sinon.stub(MapView.prototype, 'initOverlay');
        sinon.stub(utils, 'generateDrawBoxInteraction')
            .callsFake(() => ({ on: sinon.spy(), setActive: sinon.spy() }));
        sinon.stub(utils, 'generateDrawFreeInteraction')
            .callsFake(() => ({ on: sinon.spy(), setActive: sinon.spy() }));
        Map.prototype.addInteraction = sinon.spy();
        sinon.stub(MapView.prototype, 'updateZoomLevel');
    });

    beforeEach(setup);

    afterAll(() => {
        initOverlay.restore();
    });

    it('should render all the basic components', () => {
        expect(wrapper.find(CustomScrollbar)).toHaveLength(2);
        expect(wrapper.find(GridList)).toHaveLength(1);
        expect(wrapper.find(LoadButtons)).toHaveLength(1);
        expect(wrapper.find(DataPackListItem)).toHaveLength(props.runs.length);
        expect(wrapper.find('#map')).toHaveLength(1);
        expect(wrapper.find(SearchAOIToolbar)).toHaveLength(1);
        expect(wrapper.find(DrawAOIToolbar)).toHaveLength(1);
        expect(wrapper.find(ZoomLevelLabel)).toHaveLength(1);
        expect(wrapper.find(InvalidDrawWarning)).toHaveLength(1);
        expect(wrapper.find(DropZone)).toHaveLength(1);
        expect(wrapper.find('#popup')).toHaveLength(1);
        expect(wrapper.find('#popup-closer')).toHaveLength(1);
        expect(wrapper.find('#popup-content')).toHaveLength(1);
        // feature info popup should not be visible by default
        expect(wrapper.find(MapPopup)).toHaveLength(0);
    });

    it('overlay popup should call close and handleclick when a feature is selected', () => {
        const features = [
            { getId: () => ('1'), getProperties: () => ({ name: '1' }) },
            { getId: () => ('2'), getProperties: () => ({ name: '2' }) },
        ];
        wrapper.setState({ groupedFeatures: features });
        instance.handleClick = sinon.spy();
        instance.closer = { onclick: sinon.spy() };
        expect(wrapper.find('#popup')).toHaveLength(1);
        expect(wrapper.find('#popup-content')).toHaveLength(1);
        expect(wrapper.find('#popup-content').find('span')).toHaveLength(2);
        expect(wrapper.find('#popup-content').find('span').first().text()).toContain(' 1');
        expect(wrapper.find('#popup-content').find('span').last().text()).toContain(' 2');
        wrapper.find('#popup-content').find('span').first().simulate('click');
        expect(instance.handleClick.calledOnce).toBe(true);
        expect(instance.handleClick.calledWith('1')).toBe(true);
        expect(instance.closer.onclick.calledOnce).toBe(true);
    });

    it('should pass setButtonSelected with correct parameter to DrawAOIToolbar  and SearchAOIToolbar components', () => {
        expect(wrapper.find(DrawAOIToolbar)).toHaveLength(1);
        const selectSpy = sinon.spy(instance, 'setButtonSelected');
        const toolbarProps = wrapper.find(DrawAOIToolbar).props();
        expect(selectSpy.notCalled).toBe(true);
        toolbarProps.setBoxButtonSelected();
        expect(selectSpy.calledOnce).toBe(true);
        expect(selectSpy.calledWith('box')).toBe(true);
        toolbarProps.setFreeButtonSelected();
        expect(selectSpy.calledTwice).toBe(true);
        expect(selectSpy.calledWith('free')).toBe(true);
        toolbarProps.setMapViewButtonSelected();
        expect(selectSpy.calledThrice).toBe(true);
        expect(selectSpy.calledWith('mapView')).toBe(true);
        toolbarProps.setImportButtonSelected();
        expect(selectSpy.callCount).toBe(4);
        expect(selectSpy.calledWith('import')).toBe(true);

        const searchProps = wrapper.find(SearchAOIToolbar).props();
        searchProps.setSearchAOIButtonSelected();
        expect(selectSpy.callCount).toBe(5);
        expect(selectSpy.calledWith('search')).toBe(true);
    });

    it('should display the feature info popup', () => {
        expect(wrapper.find(MapPopup)).toHaveLength(0);
        wrapper.setState({ showPopup: true, selectedFeature: props.runs[0].uid });
        expect(wrapper.find(MapPopup)).toHaveLength(1);
    });

    it('should create map, overlay, source, layer, add features, fit view, and register listener on mount', () => {
        // create a whole lot of spies/mocked functions
        const mountSpy = sinon.spy(MapView.prototype, 'componentDidMount');
        const mapSpy = sinon.spy(MapView.prototype, 'initMap');
        const getExtentStub = sinon.stub(VectorSource.prototype, 'getExtent')
            .returns([-20, -20, 20, 20]);
        const addLayerSpy = sinon.spy(Map.prototype, 'addLayer');
        const addRunStub = sinon.stub(MapView.prototype, 'addRunFeatures').returns(true);
        const getViewSpy = sinon.spy(Map.prototype, 'getView');
        const fitSpy = sinon.spy(View.prototype, 'fit');
        const onSpy = sinon.spy(Map.prototype, 'on');
        const generateSpy = sinon.spy(utils, 'generateDrawLayer');
        initOverlay.reset();
        setup();

        // check that expected function calls were made
        expect(mountSpy.calledOnce).toBe(true);
        expect(mapSpy.calledOnce).toBe(true);
        expect(initOverlay.calledOnce).toBe(true);
        expect(generateSpy.calledTwice).toBe(true);
        expect(addLayerSpy.calledThrice).toBe(true);
        expect(addLayerSpy.calledWith(instance.layer)).toBe(true);
        expect(addLayerSpy.calledWith(instance.drawLayer)).toBe(true);
        expect(addLayerSpy.calledWith(instance.markerLayer)).toBe(true);
        expect(addRunStub.calledOnce).toBe(true);
        expect(addRunStub.calledWith(props.runIds, instance.source)).toBe(true);
        expect(getViewSpy.called).toBe(true);
        expect(fitSpy.called).toBe(true);
        expect(fitSpy.calledWith(instance.source.getExtent(), instance.map.getSize())).toBe(true);
        expect(onSpy.calledOnce).toBe(true);
        expect(onSpy.calledWith('singleclick', instance.onMapClick)).toBe(true);

        // restore all the spys
        mountSpy.restore();
        mapSpy.restore();
        getExtentStub.restore();
        addLayerSpy.restore();
        getViewSpy.restore();
        fitSpy.restore();
        onSpy.restore();
        generateSpy.restore();
        addRunStub.restore();
    });

    it('componentDidUpdate should clear the source, re-add features, and fit runs extent when new features are received', () => {
        const receiveSpy = sinon.spy(MapView.prototype, 'componentDidUpdate');
        const newSpy = sinon.spy(MapView.prototype, 'hasNewRuns');
        const clearSpy = sinon.spy(VectorSource.prototype, 'clear');
        const addRunSpy = sinon.spy(instance, 'addRunFeatures');
        const getViewSpy = sinon.spy(Map.prototype, 'getView');
        const fitSpy = sinon.spy(View.prototype, 'fit');
        instance.drawLayer = {
            getSource: () => (
                {
                    getFeatures: () => ({ length: 1 }),
                    getExtent: () => ([-1, -1, 1, 1]),
                }
            ),
        };

        expect(receiveSpy.notCalled).toBe(true);
        const nextProps = getProps();
        const run = { ...getRuns()[0] };
        run.uid = '123456789';
        nextProps.runs.push(run);
        nextProps.runIds.push(run.uid);
        wrapper.setProps({ ...nextProps });
        expect(receiveSpy.calledOnce).toBe(true);
        expect(newSpy.calledOnce).toBe(true);
        expect(clearSpy.calledOnce).toBe(true);
        expect(addRunSpy.calledOnce).toBe(true);
        expect(addRunSpy.calledWith(nextProps.runIds, instance.source)).toBe(true);
        expect(getViewSpy.calledOnce).toBe(true);
        expect(fitSpy.calledOnce).toBe(true);
        expect(fitSpy.calledWith(instance.source.getExtent())).toBe(true);
        receiveSpy.restore();
        newSpy.restore();
        clearSpy.restore();
        addRunSpy.restore();
        getViewSpy.restore();
        fitSpy.restore();
    });

    it('componentDidUpdate should clear the source, re-add features, and fit drawlayer extent', () => {
        const receiveSpy = sinon.spy(MapView.prototype, 'componentDidUpdate');
        const newSpy = sinon.spy(MapView.prototype, 'hasNewRuns');
        const clearSpy = sinon.spy(VectorSource.prototype, 'clear');
        const addRunSpy = sinon.spy(instance, 'addRunFeatures');
        const getViewSpy = sinon.spy(Map.prototype, 'getView');
        const fitSpy = sinon.spy(View.prototype, 'fit');
        instance.drawLayer = {
            getSource: () => (
                {
                    getFeatures: () => ({ length: 1 }),
                    getExtent: () => ([-10, -10, 10, 10]),
                }
            ),
        };
        instance.source.getExtent = () => ([-8, -8, 8, 8]);

        expect(receiveSpy.notCalled).toBe(true);
        const nextProps = getProps();
        const run = { ...getRuns()[0] };
        run.uid = '123456789';
        nextProps.runs.push(run);
        nextProps.runIds.push(run.uid);
        wrapper.setProps({ ...nextProps });
        expect(receiveSpy.calledOnce).toBe(true);
        expect(newSpy.calledOnce).toBe(true);
        expect(clearSpy.calledOnce).toBe(true);
        expect(addRunSpy.calledOnce).toBe(true);
        expect(addRunSpy.calledWith(nextProps.runIds, instance.source)).toBe(true);
        expect(getViewSpy.calledOnce).toBe(true);
        expect(fitSpy.calledOnce).toBe(true);
        expect(fitSpy.calledWith(instance.drawLayer.getSource().getExtent())).toBe(true);
        receiveSpy.restore();
        newSpy.restore();
        clearSpy.restore();
        addRunSpy.restore();
        getViewSpy.restore();
        fitSpy.restore();
    });

    it('componentDidUpdate should fit to runs extent if there is no draw layer', () => {
        const newSpy = sinon.spy(MapView.prototype, 'hasNewRuns');
        const clearSpy = sinon.spy(VectorSource.prototype, 'clear');
        const addRunSpy = sinon.spy(instance, 'addRunFeatures');
        const getViewSpy = sinon.spy(Map.prototype, 'getView');
        const fitSpy = sinon.spy(View.prototype, 'fit');
        instance.drawLayer = {
            getSource: () => (
                {
                    getFeatures: () => ({ length: 0 }),
                    getExtent: () => ([-10, -10, 10, 10]),
                }
            ),
        };
        instance.source.getExtent = () => ([-8, -8, 8, 8]);

        const nextProps = getProps();
        const run = { ...getRuns()[0] };
        run.uid = '123456789';
        nextProps.runs.push(run);
        nextProps.runIds.push(run.uid);
        wrapper.setProps({ ...nextProps });
        expect(newSpy.calledOnce).toBe(true);
        expect(clearSpy.calledOnce).toBe(true);
        expect(addRunSpy.calledOnce).toBe(true);
        expect(addRunSpy.calledWith(nextProps.runIds, instance.source)).toBe(true);
        expect(getViewSpy.calledOnce).toBe(true);
        expect(fitSpy.calledOnce).toBe(true);
        expect(fitSpy.calledWith(instance.source.getExtent())).toBe(true);
        newSpy.restore();
        clearSpy.restore();
        addRunSpy.restore();
        getViewSpy.restore();
        fitSpy.restore();
    });

    it('componentDidUpdate should fit to draw layer no features are added', () => {
        const newSpy = sinon.spy(MapView.prototype, 'hasNewRuns');
        const clearSpy = sinon.spy(VectorSource.prototype, 'clear');
        const addRunSpy = sinon.spy(instance, 'addRunFeatures');
        const fitSpy = sinon.spy(View.prototype, 'fit');
        const feature = new Feature({
            geometry: new Point([-10, 10]),
        });

        instance.drawLayer = {
            getSource: () => (
                {
                    getFeatures: () => ([feature, feature]),
                    getExtent: () => ([-10, -10, 10, 10]),
                }
            ),
        };
        instance.source.getExtent = () => ([-8, -8, 8, 8]);
        const nextProps = getProps();
        nextProps.runs = [];
        nextProps.runIds = [];
        wrapper.setProps({ ...nextProps });
        expect(newSpy.calledOnce).toBe(true);
        expect(clearSpy.calledOnce).toBe(true);
        expect(addRunSpy.calledOnce).toBe(true);
        expect(addRunSpy.calledWith(nextProps.runIds, instance.source)).toBe(true);
        expect(fitSpy.calledOnce).toBe(true);
        newSpy.restore();
        clearSpy.restore();
        addRunSpy.restore();
        fitSpy.restore();
    });

    it('componentDidUpdate should call zoomToFeature', () => {
        const newStub = sinon.stub(MapView.prototype, 'hasNewRuns')
            .returns(true);
        const addStub = sinon.stub(MapView.prototype, 'addRunFeatures')
            .returns(false);
        const clearStub = sinon.stub(VectorSource.prototype, 'clear');
        const zoomStub = sinon.stub(utils, 'zoomToFeature');
        const feature = new Feature({
            geometry: new Point([1, 1]),
        });
        instance.drawLayer.getSource().addFeature(feature);
        const nextProps = getProps();
        nextProps.runs = [];
        nextProps.runIds = [];
        wrapper.setProps(nextProps);
        expect(zoomStub.calledOnce).toBe(true);
        expect(zoomStub.calledWith(feature, instance.map)).toBe(true);
        newStub.restore();
        addStub.restore();
        clearStub.restore();
        zoomStub.restore();
    });

    it('componentDidUpdate should call handleGeoJSONUpload', () => {
        const nextProps = getProps();
        nextProps.importGeom.processed = true;
        nextProps.importGeom.featureCollection = {};
        instance.handleGeoJSONUpload = sinon.spy();
        wrapper.setProps(nextProps);
        expect(instance.handleGeoJSONUpload.calledOnce).toBe(true);
        expect(instance.handleGeoJSONUpload.calledWith(nextProps.importGeom.featureCollection)).toBe(true);
    });

    it('should update map size when component updates', () => {
        const updateSpy = sinon.spy(MapView.prototype, 'componentDidUpdate');
        const mapUpdateSpy = sinon.spy(Map.prototype, 'updateSize');
        const updates = updateSpy.args.length;
        const mapUpdate = mapUpdateSpy.args.length;
        instance.componentDidUpdate(props);
        wrapper.update();
        expect(updateSpy.args.length).toEqual(updates + 1);
        expect(mapUpdateSpy.args.length).toEqual(mapUpdate + 1);
        updateSpy.restore();
        mapUpdateSpy.restore();
    });

    it('hasNewRuns should detect if the runs have changed', () => {
        let prevRunIds = ['1', '2'];
        let nextRunIds = ['1'];
        expect(instance.hasNewRuns(prevRunIds, nextRunIds)).toBe(true);

        prevRunIds = ['1', '2', '3'];
        nextRunIds = ['2', '3', '4'];

        expect(instance.hasNewRuns(prevRunIds, nextRunIds)).toBe(true);

        nextRunIds = ['1', '2', '3'];

        expect(instance.hasNewRuns(prevRunIds, nextRunIds)).toBe(false);
    });

    it('addRunFeatures should read in geom from each run and add it to the source', () => {
        const readerSpy = sinon.spy(GeoJSON.prototype, 'readFeature');
        const idSpy = sinon.spy(Feature.prototype, 'setId');
        const propSpy = sinon.spy(Feature.prototype, 'setProperties');
        const addSpy = sinon.spy(VectorSource.prototype, 'addFeatures');
        const source = new VectorSource({ wrapX: true });
        instance.addRunFeatures(props.runIds, source);
        expect(readerSpy.callCount).toEqual(props.runIds.length);
        expect(idSpy.callCount).toEqual(props.runIds.length);
        expect(propSpy.callCount).toEqual(props.runIds.length * 2);
        props.runs.forEach((run) => {
            expect(readerSpy.calledWith(run.job.extent, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857',
            })).toBe(true);
            expect(idSpy.calledWith(run.uid)).toBe(true);
            expect(propSpy.calledWith(run)).toBe(true);
        });
        expect(addSpy.called).toBe(true);
        readerSpy.restore();
        idSpy.restore();
        propSpy.restore();
        addSpy.restore();
    });

    it('addRunFeatures should return false if no features were added', () => {
        const readerSpy = sinon.spy(GeoJSON.prototype, 'readFeature');
        const idSpy = sinon.spy(Feature.prototype, 'setId');
        const propSpy = sinon.spy(Feature.prototype, 'setProperties');
        const addSpy = sinon.spy(VectorSource.prototype, 'addFeatures');
        const source = new VectorSource({ wrapX: true });
        expect(instance.addRunFeatures([], source)).toBe(false);
        expect(readerSpy.callCount).toEqual(0);
        expect(idSpy.callCount).toEqual(0);
        expect(propSpy.callCount).toEqual(0);
        expect(addSpy.called).toBe(false);
        readerSpy.restore();
        idSpy.restore();
        propSpy.restore();
        addSpy.restore();
    });

    it('initMap should return a map with controls, interactions, and view', () => {
        const interactionSpy = sinon.spy(interaction, 'defaults');
        const map = instance.initMap();
        expect(map instanceof Map).toBe(true);
        expect(interactionSpy.calledOnce).toBe(true);
        interactionSpy.restore();
    });

    it('initOverlay should create an overlay for in map popups', () => {
        initOverlay.restore();
        const stub = sinon.stub(document, 'getElementById');
        const div = document.createElement('div');
        const a = document.createElement('a');
        stub.withArgs('popup').returns(div);
        stub.withArgs('popup-closer').returns(a);
        setup({}, { disabledLifecycleMethods: true });
        instance.map.addOverlay = sinon.spy();
        instance.initOverlay();
        expect(stub.calledWith('popup')).toBe(true);
        expect(stub.calledWith('popup-content')).toBe(true);
        expect(stub.calledWith('popup-closer')).toBe(true);
        expect(instance.closer.onclick).toEqual(instance.handleOlPopupClose);
        expect((instance.map.addOverlay.calledOnce)).toBe(true);
        stub.restore();
        initOverlay = sinon.stub(MapView.prototype, 'initOverlay');
    });

    it('handleOlPopupClose should call setPosition on overlay, add scroll zoom, and setTimeout to update state', () => {
        jest.useFakeTimers();
        const stateSpy = sinon.spy(instance, 'setState');
        const setSpy = sinon.spy();
        instance.overlay = { setPosition: setSpy };
        const addCount = instance.map.addInteraction.callCount;
        instance.handleOlPopupClose();
        expect(stateSpy.calledWith({ disableMapClick: false })).toBe(false);
        jest.runAllTimers();
        expect(stateSpy.calledWith({ disableMapClick: false })).toBe(true);
        expect(instance.map.addInteraction.callCount).toEqual(addCount + 1);
        expect(setSpy.calledOnce).toBe(true);
        expect(setSpy.calledWith(undefined)).toBe(true);
    });

    it('handleClick should return false if there is no runId or feature associated with runId', () => {
        const getSpy = sinon.spy(VectorSource.prototype, 'getFeatureById');
        expect(instance.handleClick()).toBe(false);
        expect(getSpy.notCalled).toBe(true);
        expect(instance.handleClick('22222')).toBe(false);
        expect(getSpy.calledOnce).toBe(true);
        getSpy.restore();
    });

    it('handleClick should deselect feature if its already clicked', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        const deselectSpy = sinon.spy(instance, 'setFeatureNotSelected');
        const feature = new Feature({
            geometry: new Point([-10, 10]),
        });
        feature.setId('12345');
        feature.setStyle(RED_STYLE);
        feature.setProperties({ name: 'name', event: 'event', job: { uid: '12345' } });
        const stub = sinon.stub(instance.source, 'getFeatureById');
        stub.withArgs('12345').returns(feature);
        wrapper.setState({ selectedFeature: '12345' });
        expect(instance.handleClick('12345')).toBe(true);
        expect(stateSpy.calledWith({ showPopup: false })).toBe(true);
        expect(deselectSpy.calledOnce).toBe(true);
        expect(deselectSpy.calledWith(feature)).toBe(true);
        expect(stateSpy.calledWith({ selectedFeature: null })).toBe(true);
    });

    it('handleClick should center on feature', () => {
        const setCenterSpy = sinon.spy(View.prototype, 'setCenter');
        setup();
        const stateSpy = sinon.spy(instance, 'setState');
        const deselectSpy = sinon.spy(instance, 'setFeatureNotSelected');
        const selectSpy = sinon.spy(instance, 'setFeatureSelected');
        const unwrapSpy = sinon.spy(utils, 'unwrapExtent');
        const newFeature = new Feature({
            geometry: new Point([-10, 10]),
        });
        newFeature.setId('12345');
        newFeature.setStyle(BLUE_STYLE);
        newFeature.setProperties({
            name: 'feature name',
            event: 'feature event',
            job: { uid: '12345' },
        });
        const oldFeature = new Feature();
        oldFeature.setId('56789');
        oldFeature.setStyle(RED_STYLE);
        instance.map.getView().fit([-500, -300, -400, -200]);
        const stub = sinon.stub(instance.source, 'getFeatureById');
        stub.withArgs('12345').returns(newFeature);
        stub.withArgs('56789').returns(oldFeature);
        wrapper.setState({ selectedFeature: '56789' });
        expect(instance.handleClick('12345')).toBe(true);
        expect(stateSpy.calledWith({ showPopup: false }));
        expect(deselectSpy.calledOnce).toBe(true);
        expect(deselectSpy.calledWith(oldFeature)).toBe(true);
        expect(selectSpy.calledOnce).toBe(true);
        expect(selectSpy.calledWith(newFeature)).toBe(true);
        expect(stateSpy.calledWith({ selectedFeature: newFeature.getId(), showPopup: true })).toBe(true);
        expect(setCenterSpy.called).toBe(true);
        expect(unwrapSpy.calledTwice).toBe(true);
        unwrapSpy.restore();
        setCenterSpy.restore();
    });

    it('handleClick should trigger an animation', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        const deselectSpy = sinon.spy(instance, 'setFeatureNotSelected');
        const selectSpy = sinon.spy(instance, 'setFeatureSelected');
        const newFeature = new Feature({
            geometry: new Point([-1, 1]),
        });
        newFeature.setId('12345');
        newFeature.setStyle(BLUE_STYLE);
        newFeature.setProperties({ name: 'feature name', event: 'feature event', job: { uid: '12345' } });
        const oldFeature = new Feature();
        oldFeature.setId('56789');
        oldFeature.setStyle(RED_STYLE);
        instance.map.render = sinon.spy();
        const stub = sinon.stub(instance.source, 'getFeatureById');
        stub.withArgs('12345').returns(newFeature);
        stub.withArgs('56789').returns(oldFeature);
        wrapper.setState({ selectedFeature: '56789' });
        instance.handleClick('12345');
        expect(stateSpy.calledWith({ showPopup: false }));
        expect(deselectSpy.calledOnce).toBe(true);
        expect(deselectSpy.calledWith(oldFeature)).toBe(true);
        expect(selectSpy.calledOnce).toBe(true);
        expect(selectSpy.calledWith(newFeature)).toBe(true);
        expect(stateSpy.calledWith({
            selectedFeature: newFeature.getId(),
            showPopup: true,
        })).toBe(true);
        expect(instance.map.render.calledOnce).toBe(true);
    });

    it('handleClick should not trigger an animation if feature is not displayed as a point', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        const deselectSpy = sinon.spy(instance, 'setFeatureNotSelected');
        const selectSpy = sinon.spy(instance, 'setFeatureSelected');
        const newFeature = new Feature({
            geometry: new Point([-1, 1]),
        });
        newFeature.setId('12345');
        newFeature.setStyle(BLUE_STYLE);
        newFeature.setProperties({ name: 'feature name', event: 'feature event', job: { uid: '12345' } });
        const oldFeature = new Feature();
        oldFeature.setId('56789');
        oldFeature.setStyle(RED_STYLE);
        instance.displayAsPoint = () => (false);
        instance.map.render = sinon.spy();
        const stub = sinon.stub(instance.source, 'getFeatureById');
        stub.withArgs('12345').returns(newFeature);
        stub.withArgs('56789').returns(oldFeature);
        wrapper.setState({ selectedFeature: '56789' });
        expect(instance.handleClick('12345')).toBe(true);
        expect(stateSpy.calledWith({ showPopup: false }));
        expect(deselectSpy.calledOnce).toBe(true);
        expect(deselectSpy.calledWith(oldFeature)).toBe(true);
        expect(selectSpy.calledOnce).toBe(true);
        expect(selectSpy.calledWith(newFeature)).toBe(true);
        expect(stateSpy.calledWith({ selectedFeature: newFeature.getId(), showPopup: true })).toBe(true);
        expect(instance.map.render.calledTwice).toBe(false);
    });

    it('handleClick should remove listener and set to null', () => {
        const newFeature = new Feature({
            geometry: new Point([-1, 1]),
        });
        newFeature.setId('12345');
        newFeature.setStyle(BLUE_STYLE);
        newFeature.setProperties({ name: 'feature name', event: 'feature event', job: { uid: '12345' } });
        const oldFeature = new Feature();
        oldFeature.setId('56789');
        oldFeature.setStyle(RED_STYLE);
        instance.map.render = sinon.spy();
        const unSpy = sinon.spy(Observable, 'unByKey');
        const constainsStub = sinon.stub(extent, 'containsExtent')
            .returns(true);
        const stub = sinon.stub(instance.source, 'getFeatureById');
        stub.withArgs('12345').returns(newFeature);
        stub.withArgs('56789').returns(oldFeature);
        const listener = sinon.spy();
        instance.listener = listener;
        wrapper.setState({ selectedFeature: '56789' });
        instance.handleClick('12345');
        expect(unSpy.calledOnce).toBe(true);
        expect(unSpy.calledWith(listener)).toBe(true);
        expect(instance.listener).not.toEqual(listener);
        expect(instance.map.render.calledOnce).toBe(true);
        unSpy.restore();
        constainsStub.restore();
    });

    it('animate should render a geom for animation', () => {
        const maxSpy = sinon.spy(Math, 'max');
        const unSpy = sinon.spy(Observable, 'unByKey');
        const renderSpy = sinon.spy(Map.prototype, 'render');
        const setStyleSpy = sinon.spy();
        const geomSpy = sinon.spy();
        const event = { vectorContext: { setStyle: setStyleSpy, drawGeometry: geomSpy }, frameState: { time: 500 } };
        const geom = new Polygon([[[-29, 9], [-4, 9], [-4, 28], [-29, 28], [-29, 9]]]);
        const stub = sinon.stub(instance.map, 'getPixelFromCoordinate');
        stub.withArgs([-29, 28]).returns([10, 50]);
        stub.withArgs([-4, 28]).returns([50, 50]);
        stub.withArgs([-29, 9]).returns([10, 100]);
        const renderCalls = renderSpy.callCount;
        instance.animate(event, geom, 300);
        expect(maxSpy.calledWith(40, 50)).toBe(true);
        expect(event.vectorContext.setStyle.calledOnce).toBe(true);
        expect(event.vectorContext.drawGeometry.calledOnce).toBe(true);
        expect(unSpy.notCalled).toBe(true);
        expect(renderSpy.callCount).toEqual(renderCalls + 1);
        maxSpy.restore();
        unSpy.restore();
        renderSpy.restore();
    });

    it('animate should unregister the listener and return 0', () => {
        const unSpy = sinon.spy(Observable, 'unByKey');
        const renderSpy = sinon.spy(Map.prototype, 'render');
        const setStyleSpy = sinon.spy();
        const geomSpy = sinon.spy();
        const event = { vectorContext: { setStyle: setStyleSpy, drawGeometry: geomSpy }, frameState: { time: 4000 } };
        const geom = new Polygon([[[-29, 9], [-4, 9], [-4, 28], [-29, 28], [-29, 9]]]);
        const stub = sinon.stub(instance.map, 'getPixelFromCoordinate');
        stub.withArgs([-29, 28]).returns([10, 50]);
        stub.withArgs([-4, 28]).returns([50, 50]);
        stub.withArgs([-29, 9]).returns([10, 100]);
        const renderCalls = renderSpy.callCount;
        expect(instance.animate(event, geom, 500)).toEqual(0);
        expect(event.vectorContext.setStyle.calledOnce).toBe(true);
        expect(event.vectorContext.drawGeometry.calledOnce).toBe(true);
        expect(unSpy.called).toBe(true);
        expect(renderSpy.callCount).toEqual(renderCalls);
        unSpy.restore();
        renderSpy.restore();
    });

    it('onMapClick should check for features, if multiple it should display in map popup', () => {
        // create a mock function to replace map.forEachFeatureAtPixel
        const feature1 = new Feature(new Polygon([[-1, -1, 1, 1]]));
        feature1.setId('1');
        feature1.setProperties({ name: 'number 1', uid: '1' });
        const feature2 = new Feature(new Polygon([[0, 0, 1, 1]]));
        feature2.setId('2');
        feature2.setProperties({ name: 'number 2', uid: '2' });
        const forEachMock = (pixel, func) => {
            [feature1, feature2].forEach((feature) => {
                func(feature);
            });
        };
        const forEachStub = sinon.stub(Map.prototype, 'forEachFeatureAtPixel').callsFake(forEachMock);
        const getSpy = sinon.spy(Map.prototype, 'getInteractions');
        const removeSpy = sinon.spy(Map.prototype, 'removeInteraction');

        setup();
        instance.overlay = { setPosition: sinon.spy() };
        const event = { pixel: 'fake', coordinate: [0, 0] };
        const stateSpy = sinon.spy(instance, 'setState');
        expect(instance.onMapClick(event)).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(getSpy.called).toBe(true);
        expect(removeSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ groupedFeatures: [feature1, feature2], disableMapClick: true })).toBe(true);
        expect(instance.overlay.setPosition.calledOnce).toBe(true);
        expect(instance.overlay.setPosition.calledWith(event.coordinate)).toBe(true);
        // restore
        forEachStub.restore();
    });

    it('onMapClick should check for features, if single feature it should call handle click', () => {
        const handleClickSpy = sinon.spy(instance, 'handleClick');
        const { forEachFeatureAtPixel } = Map.prototype;
        // create a mock function to replace map.forEachFeatureAtPixel
        const forEachMock = (pixel, func) => {
            const feature1 = new Feature(new Polygon([[-1, -1, 1, 1]]));
            feature1.setId('1');
            feature1.setProperties({ name: 'number 1', uid: '1' });
            [feature1].forEach((feature) => {
                func(feature);
            });
        };
        Map.prototype.forEachFeatureAtPixel = forEachMock;
        const forEachSpy = sinon.spy(Map.prototype, 'forEachFeatureAtPixel');
        const event = { pixel: 'fake', coordinate: [0, 0] };
        expect(instance.onMapClick(event)).toBe(true);
        expect(forEachSpy.calledOnce).toBe(true);
        expect(handleClickSpy.calledOnce).toBe(true);
        expect(handleClickSpy.calledWith('1')).toBe(true);
        // restore
        handleClickSpy.restore();
        Map.prototype.forEachFeatureAtPixel = forEachFeatureAtPixel;
    });

    it('onMapClick should do nothing if the mode is not NORMAL or mapClick is disabled', () => {
        wrapper.setState({ mode: 'NOT_NORMAL' });
        expect(instance.onMapClick({})).toBe(false);
        wrapper.setState({ mode: 'MODE_NORMAL', disableMapClick: true });
        expect(instance.onMapClick({})).toBe(false);
    });

    it('zoomToSelected should zoom to the selectedFeature in state', () => {
        const getFeature = sinon.spy(VectorSource.prototype, 'getFeatureById');
        const zoomToSpy = sinon.spy(utils, 'zoomToFeature');
        wrapper.setState({ selectedFeature: '6870234f-d876-467c-a332-65fdf0399a0d' });
        instance.zoomToSelected();
        // called twice because of the render method also using it
        expect(getFeature.calledTwice).toBe(true);
        expect(getFeature.calledWith('6870234f-d876-467c-a332-65fdf0399a0d')).toBe(true);
        expect(zoomToSpy.calledOnce).toBe(true);
        getFeature.restore();
        zoomToSpy.restore();
    });

    it('handlePopupClose should call handleClick', () => {
        const handleClickSpy = sinon.spy();
        instance.handleClick = handleClickSpy;
        expect(handleClickSpy.notCalled).toBe(true);
        wrapper.setState({ selectedFeature: '1234' });
        instance.handlePopupClose();
        expect(handleClickSpy.calledOnce).toBe(true);
        expect(handleClickSpy.calledWith('1234')).toBe(true);
    });

    it('setFeatureNotSelected should set style to defaultStyle and z-index 1', () => {
        const setStyleSpy = sinon.spy(Feature.prototype, 'setStyle');
        const feature = new Feature();
        expect(setStyleSpy.notCalled).toBe(true);
        instance.setFeatureNotSelected(feature);
        expect(setStyleSpy.called).toBe(true);
        expect(setStyleSpy.calledWith(instance.defaultStyleFunction)).toBe(true);
        setStyleSpy.restore();
    });

    it('setFeatureSelected should set style to selectedStyle and z-index 100', () => {
        const setStyleSpy = sinon.spy(Feature.prototype, 'setStyle');
        const getStyleSpy = sinon.spy(Feature.prototype, 'getStyle');
        const setIndexSpy = sinon.spy(Style.prototype, 'setZIndex');
        const feature = new Feature();
        expect(setStyleSpy.notCalled).toBe(true);
        instance.setFeatureSelected(feature);
        expect(setStyleSpy.called).toBe(true);
        expect(setStyleSpy.calledWith(instance.selectedStyleFunction)).toBe(true);
        setStyleSpy.restore();
        getStyleSpy.restore();
        setIndexSpy.restore();
    });

    it('displayAsPoint should return true if both px coordinates can not be found', () => {
        const coords = [[[-15, -14], [14, -14], [14, 12], [-15, 12], [-15, -14]]];
        const feature = new Feature({
            geometry: new Polygon(coords),
        });
        const extentSpy = sinon.spy(Polygon.prototype, 'getExtent');
        const geomSpy = sinon.spy(Feature.prototype, 'getGeometry');
        const pixelSpy = sinon.spy(Map.prototype, 'getPixelFromCoordinate');
        const tlSpy = sinon.spy(extent, 'getTopLeft');
        const brSpy = sinon.spy(extent, 'getBottomRight');
        const result = instance.displayAsPoint(feature);
        expect(result).toBe(true);
        expect(extentSpy.calledOnce).toBe(true);
        expect(geomSpy.calledOnce).toBe(true);
        expect(pixelSpy.calledTwice).toBe(true);
        expect(tlSpy.calledOnce).toBe(true);
        expect(brSpy.calledOnce).toBe(true);
        extentSpy.restore();
        geomSpy.restore();
        pixelSpy.restore();
        tlSpy.restore();
        brSpy.restore();
    });

    it('displayAsPoint should return true if the pixel dimensions are too small', () => {
        const coords = [[[-15, -14], [14, -14], [14, 12], [-15, 12], [-15, -14]]];
        const feature = new Feature({
            geometry: new Polygon(coords),
        });
        const pixelSpy = sinon.stub(Map.prototype, 'getPixelFromCoordinate');
        pixelSpy.withArgs(extent.getTopLeft(feature.getGeometry().getExtent())).returns([5, 15]);
        pixelSpy.withArgs(extent.getBottomRight(feature.getGeometry().getExtent())).returns([10, 23]);
        const result = instance.displayAsPoint(feature);
        expect(result).toBe(true);
        expect(pixelSpy.calledTwice).toBe(true);
        pixelSpy.restore();
    });

    it('displayAsPoint should return false if the pixel dimensions are too large', () => {
        const coords = [[[-15, -14], [14, -14], [14, 12], [-15, 12], [-15, -14]]];
        const feature = new Feature({
            geometry: new Polygon(coords),
        });
        const pixelSpy = sinon.stub(Map.prototype, 'getPixelFromCoordinate');
        pixelSpy.withArgs(extent.getTopLeft(feature.getGeometry().getExtent())).returns([0, 0]);
        pixelSpy.withArgs(extent.getBottomRight(feature.getGeometry().getExtent())).returns([10, 23]);
        const result = instance.displayAsPoint(feature);
        expect(result).toBe(false);
        expect(pixelSpy.calledTwice).toBe(true);
        pixelSpy.restore();
    });

    it('displayAsPoint should return false if feature is not passed in', () => {
        expect(instance.displayAsPoint()).toBe(false);
    });

    it('default style function should return either a point style or BLUE_STYLE', () => {
        const coords = [[[-15, -14], [14, -14], [14, 12], [-15, 12], [-15, -14]]];
        const feature = new Feature({
            geometry: new Polygon(coords),
        });
        const center = extent.getCenter(feature.getGeometry().getExtent());
        const point = new Point(center);
        const featureStub = sinon.stub(utils, 'featureToPoint');
        featureStub.withArgs(feature).returns(point);
        const displayStub = sinon.stub(instance, 'displayAsPoint');
        displayStub.withArgs(feature).returns(true);
        const style = instance.defaultStyleFunction(feature, null);
        expect(style).not.toEqual(BLUE_STYLE);
        expect(style.getGeometry()).toEqual(utils.featureToPoint);
        expect(style.getImage()).not.toBe(null);

        displayStub.withArgs(feature).returns(false);
        const style2 = instance.defaultStyleFunction(feature, null);
        expect(style2).toEqual(BLUE_STYLE);
        expect(style2.getGeometry()).not.toEqual(utils.featureToPoint);
        expect(style2.getImage()).toBe(null);

        featureStub.restore();
        displayStub.restore();
    });

    it('selected style function should return either a point style or RED_STYLE', () => {
        const coords = [[[-15, -14], [14, -14], [14, 12], [-15, 12], [-15, -14]]];
        const feature = new Feature({
            geometry: new Polygon(coords),
        });
        const center = extent.getCenter(feature.getGeometry().getExtent());
        const point = new Point(center);
        const featureStub = sinon.stub(utils, 'featureToPoint');
        featureStub.withArgs(feature).returns(point);
        const displayStub = sinon.stub(instance, 'displayAsPoint');
        displayStub.withArgs(feature).returns(true);
        const style = instance.selectedStyleFunction(feature, null);
        expect(style).not.toEqual(RED_STYLE);
        expect(style.getGeometry()).toEqual(utils.featureToPoint);
        expect(style.getImage()).not.toBe(null);

        displayStub.withArgs(feature).returns(false);
        const style2 = instance.selectedStyleFunction(feature, null);
        expect(style2).toEqual(RED_STYLE);
        expect(style2.getGeometry()).not.toEqual(utils.featureToPoint);
        expect(style2.getImage()).toBe(null);

        featureStub.restore();
        displayStub.restore();
    });

    it('checkForSearchUpdate should get new result if feature is a point and has no bbox', async () => {
        const feature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [1, 1],
            },
            properties: {
                name: 'feature1',
            },
        };
        const returnedFeature = { ...feature } as any;
        returnedFeature.bbox = [1, 1, 1, 1];
        const mock = new MockAdapter(axios, { delayResponse: 0 });
        mock.onGet('/geocode').reply(200, returnedFeature);
        const handleSearchStub = sinon.stub(instance, 'handleSearch')
            .callsFake(() => (true));
        const ret = await instance.checkForSearchUpdate(feature);
        expect(ret).toBe(true);
        expect(handleSearchStub.calledOnce).toBe(true);
        expect(handleSearchStub.calledWith(returnedFeature)).toBe(true);
        handleSearchStub.restore();
    });

    it('checkForSearchUpdate should handle search if not Point feature', () => {
        const feature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [1, 1],
            },
            properties: {},
            bbox: [1, 1, 1, 1],
        };
        const handleSearchStub = sinon.stub(instance, 'handleSearch')
            .returns(true);
        const ret = instance.checkForSearchUpdate(feature);
        expect(ret).toBe(true);
        expect(handleSearchStub.calledOnce).toBe(true);
        expect(handleSearchStub.calledWith(feature)).toBe(true);
        handleSearchStub.restore();
    });

    it('handleSearch should clearDraw, hide warning, create + add + zoom to a feature, and call onMapFitler if its a polygon', () => {
        const result = {
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [-77.479588, 38.802139],
                    [-77.401989, 38.802139],
                    [-77.401989, 38.873112],
                    [-77.479588, 38.873112],
                    [-77.479588, 38.802139],
                ]],
            },
            type: 'Feature',
        };
        const clearSpy = sinon.spy(utils, 'clearDraw');
        const warningSpy = sinon.spy(instance, 'showInvalidDrawWarning');
        const readSpy = sinon.spy(GeoJSON.prototype, 'readFeature');
        const transformSpy = sinon.spy(Polygon.prototype, 'transform');
        const addSpy = sinon.spy(VectorSource.prototype, 'addFeature');
        const createSpy = sinon.spy(utils, 'createGeoJSON');
        expect(instance.handleSearch(result)).toBe(true);
        expect(clearSpy.calledOnce).toBe(true);
        expect(clearSpy.calledWith(instance.drawLayer)).toBe(true);
        expect(warningSpy.calledOnce).toBe(true);
        expect(warningSpy.calledWith(false)).toBe(true);
        expect(readSpy.calledOnce).toBe(true);
        expect(readSpy.calledWith(result)).toBe(true);
        expect(transformSpy.called).toBe(true);
        expect(transformSpy.calledWith('EPSG:4326', 'EPSG:3857')).toBe(true);
        expect(addSpy.calledOnce).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(props.onMapFilter.calledOnce).toBe(true);
        clearSpy.restore();
        readSpy.restore();
        transformSpy.restore();
        addSpy.restore();
        createSpy.restore();
    });

    it('if there are no run features, handleSearch should call zoomToFeature with the search geom', () => {
        const result = {
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [-77.479588, 38.802139],
                    [-77.401989, 38.802139],
                    [-77.401989, 38.873112],
                    [-77.479588, 38.873112],
                    [-77.479588, 38.802139],
                ]],
            },
            type: 'Feature',
        };
        const zoomStub = sinon.stub(utils, 'zoomToFeature')
            .callsFake(sinon.spy());
        setup({ runs: [] });
        const getSpy = sinon.spy(VectorSource.prototype, 'getFeatures');
        expect(instance.handleSearch(result)).toBe(true);
        expect(props.onMapFilter.calledOnce).toBe(true);
        expect(getSpy.calledOnce).toBe(true);
        expect(zoomStub.calledOnce).toBe(true);
        getSpy.restore();
        zoomStub.restore();
        expect(true).toBe(true);
    });

    it('handleCancel should hide warning, set mode to normal, clearDraw, and call onMapFilter', () => {
        wrapper.setState({ mode: 'NOT_NORMAL_MODE' });
        const warningSpy = sinon.spy(instance, 'showInvalidDrawWarning');
        const updateSpy = sinon.spy(instance, 'updateMode');
        const clearSpy = sinon.spy(utils, 'clearDraw');
        instance.handleCancel();
        expect(warningSpy.calledOnce).toBe(true);
        expect(warningSpy.calledWith(false)).toBe(true);
        expect(updateSpy.calledOnce).toBe(true);
        expect(updateSpy.calledWith('MODE_NORMAL')).toBe(true);
        expect(clearSpy.calledOnce).toBe(true);
        expect(clearSpy.calledWith(instance.drawLayer)).toBe(true);
        expect(props.onMapFilter.calledOnce).toBe(true);
        expect(props.onMapFilter.calledWith(null)).toBe(true);
        clearSpy.restore();
    });

    it('setButtonSelected should set target icon SELECTED and the rest INACTIVE', () => {
        const initial = {
            box: 'DEFAULT',
            free: 'DEFAULT',
            mapView: 'DEFAULT',
            import: 'DEFAULT',
            search: 'DEFAULT',
        };
        const expected = {
            box: 'SELECTED',
            free: 'INACTIVE',
            mapView: 'INACTIVE',
            import: 'INACTIVE',
            search: 'INACTIVE',
        };
        expect(wrapper.state().toolbarIcons).toEqual(initial);
        const stateSpy = sinon.spy(instance, 'setState');
        instance.setButtonSelected('box');
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ toolbarIcons: expected })).toBe(true);
    });

    it('setAllButtonsDefault should set all toolbarIcons to DEFAULT', () => {
        const icons = {
            box: 'SELECTED',
            free: 'INACTIVE',
            mapView: 'INACTIVE',
            import: 'INACTIVE',
            search: 'INACTIVE',
        };
        const expected = {
            box: 'DEFAULT',
            free: 'DEFAULT',
            mapView: 'DEFAULT',
            import: 'DEFAULT',
            search: 'DEFAULT',
        };
        wrapper.setState({ toolbarIcons: icons });
        expect(wrapper.state().toolbarIcons).toEqual(icons);
        const stateSpy = sinon.spy(instance, 'setState');
        instance.setAllButtonsDefault();
        expect(stateSpy.calledOnce);
        expect(stateSpy.calledWith({ toolbarIcons: expected })).toBe(true);
    });

    it('toggleImportModal should set state to true', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        instance.toggleImportModal(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showImportModal: true })).toBe(true);
    });

    it('toggleImportModal should toggle the state', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        const before = wrapper.state().showImportModal;
        instance.toggleImportModal();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showImportModal: !before })).toBe(true);
    });

    it('showInvalidDrawWarning should set state to true', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        instance.showInvalidDrawWarning(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showInvalidDrawWarning: true })).toBe(true);
    });

    it('showInvalidDrawWarning should toggle state', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        const before = wrapper.state().showInvalidDrawWarning;
        instance.showInvalidDrawWarning();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showInvalidDrawWarning: !before })).toBe(true);
    });

    it('onDrawStart should call clearDraw', () => {
        const clearSpy = sinon.spy(utils, 'clearDraw');
        instance.onDrawStart();
        expect(clearSpy.calledOnce).toBe(true);
        expect(clearSpy.calledWith(instance.drawLayer)).toBe(true);
        clearSpy.restore();
    });

    it('onDrawEnd should handle a free draw polygon', () => {
        jest.useFakeTimers();
        const stateSpy = sinon.spy(instance, 'setState');
        const modeSpy = sinon.spy(instance, 'updateMode');
        const geom = new Polygon([[[-29, 9], [-4, 9], [-4, 28], [-29, 28], [-29, 9]]]);
        const feature = new Feature({ geometry: geom });
        const geomSpy = sinon.spy(feature, 'getGeometry');
        const event = { feature };
        const createSpy = sinon.spy(utils, 'createGeoJSON');
        const addSpy = sinon.spy(VectorSource.prototype, 'addFeature');
        const validSpy = sinon.spy(utils, 'isGeoJSONValid');
        const createGeomSpy = sinon.spy(utils, 'createGeoJSONGeometry');
        wrapper.setState({ mode: 'MODE_DRAW_FREE' });
        instance.onDrawEnd(event);
        expect(geomSpy.calledOnce).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(createSpy.calledWith(geom)).toBe(true);
        expect(addSpy.calledOnce).toBe(true);
        expect(validSpy.calledOnce).toBe(true);
        expect(validSpy.calledWith(utils.createGeoJSON(geom))).toBe(true);
        expect(createGeomSpy.calledOnce).toBe(true);
        expect(createGeomSpy.calledWith(geom)).toBe(true);
        expect(props.onMapFilter.calledOnce).toBe(true);
        expect(props.onMapFilter.calledWith(utils.createGeoJSONGeometry(geom))).toBe(true);
        expect(modeSpy.calledOnce).toBe(true);
        expect(modeSpy.calledWith('MODE_NORMAL')).toBe(true);
        expect(stateSpy.calledWith({ disableMapClick: false })).toBe(false);
        jest.runAllTimers();
        expect(stateSpy.calledWith({ disableMapClick: false })).toBe(true);
        geomSpy.restore();
        createSpy.restore();
        addSpy.restore();
        validSpy.restore();
        createGeomSpy.restore();
    });

    it('onDrawEnd should handle an invalid free draw', () => {
        jest.useFakeTimers();
        const stateSpy = sinon.spy(instance, 'setState');
        const modeSpy = sinon.spy(instance, 'updateMode');
        const warningSpy = sinon.spy(instance, 'showInvalidDrawWarning');
        const geom = new Polygon([[[-29, 9], [-4, 9], [-4, 28], [-29, 28], [-29, 9]]]);
        const feature = new Feature({ geometry: geom });
        const event = { feature };
        const geomSpy = sinon.spy(feature, 'getGeometry');
        const createSpy = sinon.spy(utils, 'createGeoJSON');
        const addSpy = sinon.spy(VectorSource.prototype, 'addFeature');
        const validSpy = sinon.stub(utils, 'isGeoJSONValid')
            .callsFake(() => (false));
        wrapper.setState({ mode: 'MODE_DRAW_FREE' });
        instance.onDrawEnd(event);
        expect(geomSpy.calledOnce).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(createSpy.calledWith(geom)).toBe(true);
        expect(validSpy.calledOnce).toBe(true);
        expect(validSpy.calledWith(utils.createGeoJSON(geom))).toBe(true);
        expect(warningSpy.calledOnce).toBe(true);
        expect(warningSpy.calledWith(true)).toBe(true);
        expect(modeSpy.calledOnce).toBe(true);
        expect(modeSpy.calledWith('MODE_NORMAL')).toBe(true);
        expect(stateSpy.calledWith({ disableMapClick: false })).toBe(false);
        jest.runAllTimers();
        expect(stateSpy.calledWith({ disableMapClick: false })).toBe(true);
        geomSpy.restore();
        createSpy.restore();
        addSpy.restore();
        validSpy.restore();
    });

    it('onDrawEnd should handle a bbox polygon', () => {
        jest.useFakeTimers();
        const stateSpy = sinon.spy(instance, 'setState');
        const modeSpy = sinon.spy(instance, 'updateMode');
        const geom = new Polygon([[[-29, 9], [-4, 9], [-4, 28], [-29, 28], [-29, 9]]]);
        const feature = new Feature({ geometry: geom });
        const event = { feature };
        const geomSpy = sinon.spy(Feature.prototype, 'getGeometry');
        const createSpy = sinon.spy(utils, 'createGeoJSON');
        const createGeomSpy = sinon.spy(utils, 'createGeoJSONGeometry');
        const addSpy = sinon.spy(VectorSource.prototype, 'addFeature');
        const validSpy = sinon.stub(utils, 'isGeoJSONValid')
            .callsFake(() => (false));
        wrapper.setState({ mode: 'MODE_DRAW_BBOX' });
        instance.onDrawEnd(event);
        expect(geomSpy.calledOnce).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(createSpy.calledWith(geom)).toBe(true);
        expect(createGeomSpy.calledOnce).toBe(true);
        expect(createGeomSpy.calledWith(geom)).toBe(true);
        expect(props.onMapFilter.calledOnce).toBe(true);
        expect(props.onMapFilter.calledWith(utils.createGeoJSONGeometry(geom))).toBe(true);
        expect(addSpy.notCalled).toBe(true);
        expect(validSpy.notCalled).toBe(true);
        expect(modeSpy.calledOnce).toBe(true);
        expect(modeSpy.calledWith('MODE_NORMAL')).toBe(true);
        expect(stateSpy.calledWith({ disableMapClick: false })).toBe(false);
        jest.runAllTimers();
        expect(stateSpy.calledWith({ disableMapClick: false })).toBe(true);
        geomSpy.restore();
        createSpy.restore();
        createGeomSpy.restore();
        validSpy.restore();
        addSpy.restore();
    });

    it('setMapView should clear draw, create a feature from extent, and call onMapFilter', () => {
        const clearSpy = sinon.spy(utils, 'clearDraw');
        const calculateSpy = sinon.spy(View.prototype, 'calculateExtent');
        const extentSpy = sinon.spy(Polygon, 'fromExtent');
        const addSpy = sinon.spy(VectorSource.prototype, 'addFeature');
        const createSpy = sinon.spy(utils, 'createGeoJSONGeometry');
        instance.setMapView();
        expect(clearSpy.calledOnce).toBe(true);
        expect(clearSpy.calledWith(instance.drawLayer)).toBe(true);
        expect(calculateSpy.calledOnce).toBe(true);
        expect(calculateSpy.calledWith(instance.map.getSize())).toBe(true);
        expect(extentSpy.calledOnce).toBe(true);
        const ext = instance.map.getView()
            .calculateExtent(instance.map.getSize());
        expect(extentSpy.calledWith(ext)).toBe(true);
        expect(addSpy.calledOnce).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(props.onMapFilter.calledOnce).toBe(true);
        clearSpy.restore();
        calculateSpy.restore();
        extentSpy.restore();
        addSpy.restore();
        createSpy.restore();
    });

    it('updateMode should set interactions to inactive, activate drawBox, and update the state', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        const boxSpy = sinon.spy();
        const freeSpy = sinon.spy();
        instance.drawBoxInteraction = { setActive: boxSpy };
        instance.drawFreeInteraction = { setActive: freeSpy };
        instance.updateMode('MODE_DRAW_BBOX');
        expect(freeSpy.calledOnce).toBe(true);
        expect(freeSpy.calledWith(false)).toBe(true);
        expect(boxSpy.calledTwice).toBe(true);
        expect(boxSpy.calledWith(true)).toBe(true);
        expect(boxSpy.calledWith(false)).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ mode: 'MODE_DRAW_BBOX' })).toBe(true);
    });

    it('updateMode should set interactions to inactive, activate drawFree, and update state', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        const boxSpy = sinon.spy();
        const freeSpy = sinon.spy();
        instance.drawBoxInteraction = { setActive: boxSpy };
        instance.drawFreeInteraction = { setActive: freeSpy };
        instance.updateMode('MODE_DRAW_FREE');
        expect(boxSpy.calledOnce).toBe(true);
        expect(boxSpy.calledWith(false)).toBe(true);
        expect(freeSpy.calledTwice).toBe(true);
        expect(freeSpy.calledWith(true)).toBe(true);
        expect(freeSpy.calledWith(false)).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ mode: 'MODE_DRAW_FREE' })).toBe(true);
    });

    it('updateMode should goToValidExtent', () => {
        const isValidStub = sinon.stub(utils, 'isViewOutsideValidExtent')
            .returns(true);
        const goToValidExtent = sinon.stub(utils, 'goToValidExtent');
        instance.updateMode('mode');
        expect(isValidStub.calledOnce).toBe(true);
        expect(goToValidExtent.calledOnce).toBe(true);
        isValidStub.restore();
        goToValidExtent.restore();
    });

    it('handleGeoJSONUpload should clear the draw layer, add a feature, zoom, and call onMapFilter', () => {
        const clearSpy = sinon.spy(utils, 'clearDraw');
        const fitSpy = sinon.spy(View.prototype, 'fit');
        const addSpy = sinon.spy(VectorSource.prototype, 'addFeatures');
        const readSpy = sinon.spy(GeoJSON.prototype, 'readFeatures');
        const featureCollection = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        coordinates: [[[-29, 9], [-4, 9], [-4, 28], [-29, 28], [-29, 9]]],
                        type: 'Polygon',
                    },
                },
            ],
        };
        instance.handleGeoJSONUpload(featureCollection);
        expect(clearSpy.calledOnce).toBe(true);
        expect(clearSpy.calledWith(instance.drawLayer)).toBe(true);
        expect(addSpy.calledOnce).toBe(true);
        expect(fitSpy.calledOnce).toBe(true);
        expect(readSpy.calledOnce).toBe(true);
        expect(readSpy.calledWith(featureCollection)).toBe(true);
        expect(props.onMapFilter.calledOnce).toBe(true);
        expect(props.onMapFilter.calledWith(featureCollection)).toBe(true);
        clearSpy.restore();
        fitSpy.restore();
        addSpy.restore();
        readSpy.restore();
    });

    it('handleUp should return false if there is no feature', () => {
        expect(instance.handleUp({})).toBe(false);
    });

    it('handleUp should check for a feature then call onMapFilter if its valid', () => {
        const geom = new Polygon([[
            [100.0, 0.0],
            [101.0, 0.0],
            [101.0, 1.0],
            [100.0, 1.0],
            [100.0, 0.0],
        ]]);
        const feature = new Feature({
            geometry: geom,
        });

        const unwrapStub = sinon.stub(utils, 'unwrapCoordinates')
            .callsFake(coords => (coords));
        const setSpy = sinon.spy(geom, 'setCoordinates');
        const createSpy = sinon.spy(GeoJSON.prototype, 'writeFeaturesObject');
        const validStub = sinon.stub(utils, 'isGeoJSONValid')
            .returns(true);
        const warningSpy = sinon.stub(instance, 'showInvalidDrawWarning');

        instance.feature = feature;
        const ret = instance.handleUp({});
        expect(ret).toBe(false);
        expect(unwrapStub.calledOnce).toBe(true);
        expect(setSpy.calledOnce).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(validStub.calledOnce).toBe(true);
        expect(props.onMapFilter.calledOnce).toBe(true);
        expect(warningSpy.calledOnce).toBe(true);
        expect(warningSpy.calledWith(false)).toBe(true);

        unwrapStub.restore();
        setSpy.restore();
        createSpy.restore();
        validStub.restore();
        warningSpy.restore();
    });

    it('handleUp should display the invalid draw warning', () => {
        const feature = new Feature({
            geometry: new Polygon([[
                [100.0, 0.0],
                [101.0, 0.0],
                [103.0, 1.0],
                [100.0, 1.0],
                [100.0, 0.0],
            ]]),
        });
        const unwrapStub = sinon.stub(utils, 'unwrapCoordinates')
            .callsFake(coords => (coords));
        const validStub = sinon.stub(utils, 'isGeoJSONValid')
            .callsFake(() => (false));
        const warningSpy = sinon.stub(instance, 'showInvalidDrawWarning');

        instance.feature = feature;
        const ret = instance.handleUp({});
        expect(ret).toBe(false);
        expect(validStub.calledOnce).toBe(true);
        expect(warningSpy.calledOnce).toBe(true);
        expect(warningSpy.calledWith(true)).toBe(true);

        unwrapStub.restore();
        validStub.restore();
        warningSpy.restore();
    });

    it('hanldeDrag should transform a bbox and update its coordinates then move the vertex marker', () => {
        const feature = new Feature({
            geometry: new Polygon([[
                [100.0, 0.0],
                [101.0, 0.0],
                [101.0, 1.0],
                [100.0, 1.0],
                [100.0, 0.0],
            ]]),
        });
        const coord = [101.0, 1.0];
        const eventCoord = [103.0, 1.0];
        const evt = { coordinate: eventCoord };
        const boxStub = sinon.stub(utils, 'isBox').returns(true);
        const clearStub = sinon.stub(utils, 'clearDraw');
        const addStub = sinon.stub(VectorSource.prototype, 'addFeature');

        instance.coordinate = coord;
        instance.feature = feature;
        const ret = instance.handleDrag(evt);
        expect(ret).toBe(true);
        expect(boxStub.calledOnce).toBe(true);
        expect(clearStub.calledOnce).toBe(true);
        expect(addStub.calledOnce).toBe(true);
        expect(instance.coordinate).toEqual([103.0, 1.0]);
        expect(instance.feature.getGeometry().getCoordinates())
            .toEqual([[
                [100.0, 0.0],
                [103.0, 0.0],
                [103.0, 1.0],
                [100.0, 1.0],
                [100.0, 0.0],
            ]]);

        boxStub.restore();
        clearStub.restore();
        addStub.restore();
    });

    it('handleDrag should transform a polygon and update its coordinates then move the vertex marker', () => {
        const feature = new Feature({
            geometry: new Polygon([[
                [100.0, 0.0],
                [101.0, 0.0],
                [103.0, 1.0],
                [100.0, 1.0],
                [100.0, 0.0],
            ]]),
        });
        const coord = [103.0, 1.0];
        const eventCoord = [109.0, 1.0];
        const evt = { coordinate: eventCoord };
        const boxStub = sinon.stub(utils, 'isBox').returns(false);
        const clearStub = sinon.stub(utils, 'clearDraw');
        const addStub = sinon.stub(VectorSource.prototype, 'addFeature');

        instance.coordinate = coord;
        instance.feature = feature;
        const ret = instance.handleDrag(evt);
        expect(ret).toBe(true);
        expect(boxStub.calledOnce).toBe(true);
        expect(clearStub.calledOnce).toBe(true);
        expect(addStub.calledOnce).toBe(true);
        expect(instance.coordinate).toEqual([109.0, 1.0]);
        expect(instance.feature.getGeometry().getCoordinates())
            .toEqual([[
                [100.0, 0.0],
                [101.0, 0.0],
                [109.0, 1.0],
                [100.0, 1.0],
                [100.0, 0.0],
            ]]);

        boxStub.restore();
        clearStub.restore();
        addStub.restore();
    });

    it('handleDrag return false if updated feature has no area', () => {
        const feature = new Feature({
            geometry: new Polygon([[
                [100.0, 0.0],
                [101.0, 0.0],
                [101.0, 1.0],
                [100.0, 1.0],
                [100.0, 0.0],
            ]]),
        });
        const coord = [101.0, 1.0];
        const eventCoord = [100.0, 0.0];
        const evt = { coordinate: eventCoord };
        const boxStub = sinon.stub(utils, 'isBox').returns(true);
        const clearStub = sinon.stub(utils, 'clearDraw');
        const addStub = sinon.stub(VectorSource.prototype, 'addFeature');

        instance.coordinate = coord;
        instance.feature = feature;
        const ret = instance.handleDrag(evt);
        expect(ret).toBe(false);
        expect(boxStub.calledOnce).toBe(true);
        expect(clearStub.called).toBe(false);
        expect(addStub.called).toBe(false);
        expect(instance.coordinate).toEqual([101.0, 1.0]);
        expect(instance.feature.getGeometry().getCoordinates())
            .toEqual([[
                [100.0, 0.0],
                [101.0, 0.0],
                [101.0, 1.0],
                [100.0, 1.0],
                [100.0, 0.0],
            ]]);

        boxStub.restore();
        clearStub.restore();
        addStub.restore();
    });

    it('handleMove should add a marker feature to the map', () => {
        const feature = new Feature({
            geometry: new Polygon([[
                [100.0, 0.0],
                [101.0, 0.0],
                [101.0, 1.0],
                [100.0, 1.0],
                [100.0, 0.0],
            ]]),
        });
        const hasFeatureStub = sinon.stub(Map.prototype, 'hasFeatureAtPixel')
            .returns(true);
        const getFeaturesStub = sinon.stub(Map.prototype, 'getFeaturesAtPixel')
            .returns([feature]);
        const vertexStub = sinon.stub(utils, 'isVertex')
            .returns([100.0, 0.0]);
        const viewStub = sinon.stub(utils, 'isViewOutsideValidExtent')
            .returns(false);
        const addStub = sinon.stub(VectorSource.prototype, 'addFeature');

        const evt = { pixel: [1, 1], map: instance.map };
        instance.handleMove(evt);
        expect(hasFeatureStub.calledOnce).toBe(true);
        expect(getFeaturesStub.calledOnce).toBe(true);
        expect(vertexStub.calledOnce).toBe(true);
        expect(addStub.calledOnce).toBe(true);

        hasFeatureStub.restore();
        getFeaturesStub.restore();
        vertexStub.restore();
        viewStub.restore();
        addStub.restore();
    });

    it('handleMove should not add a marker if pixel is not occupied by a vertex', () => {
        const feature = new Feature({
            geometry: new Polygon([[
                [100.0, 0.0],
                [101.0, 0.0],
                [101.0, 1.0],
                [100.0, 1.0],
                [100.0, 0.0],
            ]]),
        });
        const hasFeatureStub = sinon.stub(Map.prototype, 'hasFeatureAtPixel')
            .returns(true);
        const getFeaturesStub = sinon.stub(Map.prototype, 'getFeaturesAtPixel')
            .returns([feature]);
        const vertexStub = sinon.stub(utils, 'isVertex')
            .returns(false);
        const viewStub = sinon.stub(utils, 'isViewOutsideValidExtent')
            .returns(false);
        const addStub = sinon.stub(VectorSource.prototype, 'addFeature');

        const evt = { pixel: [1, 1], map: instance.map };
        instance.handleMove(evt);
        expect(hasFeatureStub.calledOnce).toBe(true);
        expect(getFeaturesStub.calledOnce).toBe(true);
        expect(vertexStub.calledOnce).toBe(true);
        expect(addStub.called).toBe(false);

        hasFeatureStub.restore();
        getFeaturesStub.restore();
        vertexStub.restore();
        viewStub.restore();
        addStub.restore();
    });

    it('handleMove should go to the valid extent', () => {
        const feature = new Feature({
            geometry: new Polygon([[
                [100.0, 0.0],
                [101.0, 0.0],
                [101.0, 1.0],
                [100.0, 1.0],
                [100.0, 0.0],
            ]]),
        });
        const hasFeatureStub = sinon.stub(Map.prototype, 'hasFeatureAtPixel')
            .returns(true);
        const getFeaturesStub = sinon.stub(Map.prototype, 'getFeaturesAtPixel')
            .returns([feature]);
        const viewStub = sinon.stub(utils, 'isViewOutsideValidExtent')
            .returns(true);
        const goToStub = sinon.stub(utils, 'goToValidExtent');
        const vertexStub = sinon.stub(utils, 'isVertex')
            .returns(false);

        const evt = { pixel: [1, 1], map: instance.map };
        instance.handleMove(evt);
        expect(hasFeatureStub.calledOnce).toBe(true);
        expect(getFeaturesStub.calledOnce).toBe(true);
        expect(viewStub.calledOnce).toBe(true);
        expect(goToStub.calledOnce).toBe(true);

        hasFeatureStub.restore();
        getFeaturesStub.restore();
        viewStub.restore();
        goToStub.restore();
        vertexStub.restore();
    });

    it('handleMove should clear the markerLayer', () => {
        const feature = new Feature({
            geometry: new Point([100.0, 0.0]),
        });
        const hasFeatureStub = sinon.stub(Map.prototype, 'hasFeatureAtPixel')
            .returns(false);
        const clearStub = sinon.stub(utils, 'clearDraw');

        instance.markerLayer.getSource().addFeature(feature);
        const evt = { pixel: [1, 1], map: instance.map };
        instance.handleMove(evt);
        expect(clearStub.calledOnce).toBe(true);
        expect(hasFeatureStub.calledOnce).toBe(true);

        hasFeatureStub.restore();
        clearStub.restore();
    });

    it('handleDown should skip features that are not polygons', () => {
        const feature = new Feature({
            geometry: new Point([100.0, 0.0]),
        });
        const hasFeatureStub = sinon.stub(Map.prototype, 'hasFeatureAtPixel')
            .returns(true);
        const getFeaturesStub = sinon.stub(Map.prototype, 'getFeaturesAtPixel')
            .returns([feature]);
        const vertexStub = sinon.stub(utils, 'isVertex');
        const viewStub = sinon.stub(utils, 'isViewOutsideValidExtent')
            .returns(false);

        const evt = { pixel: [1, 1], map: instance.map };
        instance.handleMove(evt);
        expect(hasFeatureStub.calledOnce).toBe(true);
        expect(getFeaturesStub.calledOnce).toBe(true);
        expect(vertexStub.called).toBe(false);

        hasFeatureStub.restore();
        getFeaturesStub.restore();
        vertexStub.restore();
        viewStub.restore();
    });

    it('handleDown should check if there is a feature at the target pixel and return true', () => {
        const feature = new Feature({
            geometry: new Polygon([[
                [100.0, 0.0],
                [101.0, 0.0],
                [101.0, 1.0],
                [100.0, 1.0],
                [100.0, 0.0],
            ]]),
        });
        const hasFeatureStub = sinon.stub(Map.prototype, 'hasFeatureAtPixel')
            .returns(true);
        const getFeaturesStub = sinon.stub(Map.prototype, 'getFeaturesAtPixel')
            .returns([feature]);
        const vertexStub = sinon.stub(utils, 'isVertex')
            .returns([100.0, 0.0]);

        const evt = { pixel: [1, 1], map: instance.map };
        const ret = instance.handleDown(evt);
        expect(ret).toBe(true);
        expect(instance.feature).toBe(feature);
        expect(instance.coordinate).toEqual([100.0, 0.0]);

        hasFeatureStub.restore();
        getFeaturesStub.restore();
        vertexStub.restore();
    });

    it('handleDown should return false if map has no feature at pixel', () => {
        const hasFeatureStub = sinon.stub(Map.prototype, 'hasFeatureAtPixel')
            .returns(false);
        const evt = { pixel: [1, 1], map: instance.map };
        const ret = instance.handleDown(evt);
        expect(ret).toBe(false);
        hasFeatureStub.restore();
    });

    it('handleDown should return false if feature is not a polygon', () => {
        const feature = new Feature({
            geometry: new Point([1, 1]),
        });
        const hasFeatureStub = sinon.stub(Map.prototype, 'hasFeatureAtPixel')
            .returns(true);
        const getFeaturesStub = sinon.stub(Map.prototype, 'getFeaturesAtPixel')
            .returns([feature]);
        const evt = { pixel: [1, 1], map: instance.map };
        const ret = instance.handleDown(evt);
        expect(ret).toBe(false);
        hasFeatureStub.restore();
        getFeaturesStub.restore();
    });

    it('handleDown should return false if it is not a vertex', () => {
        const feature = new Feature({
            geometry: new Polygon([[
                [100.0, 0.0],
                [101.0, 0.0],
                [101.0, 1.0],
                [100.0, 1.0],
                [100.0, 0.0],
            ]]),
        });
        const hasFeatureStub = sinon.stub(Map.prototype, 'hasFeatureAtPixel')
            .returns(true);
        const getFeaturesStub = sinon.stub(Map.prototype, 'getFeaturesAtPixel')
            .returns([feature]);
        const vertexStub = sinon.stub(utils, 'isVertex').returns(false);
        const evt = { pixel: [1, 1], map: instance.map };
        const ret = instance.handleDown(evt);
        expect(ret).toBe(false);
        hasFeatureStub.restore();
        getFeaturesStub.restore();
        vertexStub.restore();
    });
});
