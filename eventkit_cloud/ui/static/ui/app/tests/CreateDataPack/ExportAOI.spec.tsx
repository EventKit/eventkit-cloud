import * as React from 'react';
import * as sinon from 'sinon';
import { shallow } from 'enzyme';
import axios from 'axios';
import * as MockAdapter from 'axios-mock-adapter';
import Joyride from 'react-joyride';

import Map from 'ol/map';
import View from 'ol/view';
import proj from 'ol/proj';
import extent from 'ol/extent';
import GeoJSONFormat from 'ol/format/geojson';
import Feature from 'ol/feature';
import Point from 'ol/geom/point';
import Polygon from 'ol/geom/polygon';
import VectorSource from 'ol/source/vector';
import Draw from 'ol/interaction/draw';

import { ExportAOI, WGS84, WEB_MERCATOR } from '../../components/CreateDataPack/ExportAOI';
import AoiInfobar from '../../components/CreateDataPack/AoiInfobar';
import SearchAOIToolbar from '../../components/MapTools/SearchAOIToolbar';
import DrawAOIToolbar from '../../components/MapTools/DrawAOIToolbar';
import InvalidDrawWarning from '../../components/MapTools/InvalidDrawWarning';
import DropZone from '../../components/MapTools/DropZone';
import * as utils from '../../utils/mapUtils';
import * as generic from '../../utils/generic';
import ZoomLevelLabel from '../../components/MapTools/ZoomLevelLabel';

describe('ExportAOI component', () => {
    const geojson = {
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
            bbox: [100.0, 0.0, 101.0, 1.0],
        }],
    };

    const getProps = () => ({
        aoiInfo: {
            geojson: {},
            originalGeojson: {},
            geomType: null,
            title: null,
            description: null,
            selectionType: null,
        },
        importGeom: {
            processing: false,
            processed: false,
            featureCollection: {},
            error: null,
        },
        drawer: 'open',
        geocode: {
            fetching: false,
            fetched: false,
            data: [],
            error: null,
        },
        walkthroughClicked: false,
        onWalkthroughReset: sinon.spy(),
        updateAoiInfo: sinon.spy(),
        clearAoiInfo: sinon.spy(),
        clearExportInfo: sinon.spy(),
        setNextDisabled: sinon.spy(),
        setNextEnabled: sinon.spy(),
        getGeocode: sinon.spy(),
        processGeoJSONFile: sinon.spy(),
        resetGeoJSONFile: sinon.spy(),
        limits: {
            max: 100000,
            sizes: [5, 10, 100000],
        },
        ...(global as any).eventkit_test_props,
    });

    let props;
    let wrapper;
    let instance;
    const setup = (overrides = {}) => {
        const config = {
            BASEMAP_URL: 'http://my-osm-tile-service/{z}/{x}/{y}.png',
        };
        props = { ...getProps(), ...overrides };
        wrapper = shallow(<ExportAOI {...props} />, {
            context: { config },
        });
        instance = wrapper.instance();
    };

    beforeEach(setup);

    it('should render the basic elements', () => {
        expect(wrapper.find('#map')).toHaveLength(1);
        expect(wrapper.find(AoiInfobar)).toHaveLength(1);
        expect(wrapper.find(SearchAOIToolbar)).toHaveLength(1);
        expect(wrapper.find(DrawAOIToolbar)).toHaveLength(1);
        expect(wrapper.find(ZoomLevelLabel)).toHaveLength(1);
        expect(wrapper.find(InvalidDrawWarning)).toHaveLength(1);
        expect(wrapper.find(DropZone)).toHaveLength(1);
        expect(wrapper.find(Joyride)).toHaveLength(1);
    });

    it('the left position should be 200px if drawer is open, otherwise 0px', () => {
        wrapper.setProps({ drawer: 'open' });
        expect(wrapper.find('#map').props().style.left).toEqual('200px');
        const nextProps = getProps();
        nextProps.drawer = 'closed';
        wrapper.setProps(nextProps);
        expect(wrapper.find('#map').props().style.left).toEqual('0px');
    });

    it('funcs passed to DrawAOIToolbar and SearchAOIToolbar should call setButtonSelected with correct values', () => {
        const drawToolbar = wrapper.find(DrawAOIToolbar);
        const setSpy = sinon.spy(instance, 'setButtonSelected');
        expect(setSpy.called).toBe(false);
        drawToolbar.props().setBoxButtonSelected();
        expect(setSpy.callCount).toBe(1);
        expect(setSpy.calledWith('box')).toBe(true);
        drawToolbar.props().setFreeButtonSelected();
        expect(setSpy.callCount).toBe(2);
        expect(setSpy.calledWith('free')).toBe(true);
        drawToolbar.props().setMapViewButtonSelected();
        expect(setSpy.callCount).toBe(3);
        expect(setSpy.calledWith('mapView')).toBe(true);
        drawToolbar.props().setImportButtonSelected();
        expect(setSpy.callCount).toBe(4);
        expect(setSpy.calledWith('import')).toBe(true);

        const searchToolbar = wrapper.find(SearchAOIToolbar);
        searchToolbar.props().setSearchAOIButtonSelected();
        expect(setSpy.callCount).toBe(5);
        expect(setSpy.calledWith('search')).toBe(true);
    });

    it('componentDidMount should initialize the map, setJoyRideSteps, and handle aoiInfo if present', () => {
        const aoiInfo = { ...props.aoiInfo };
        aoiInfo.geojson = geojson;
        aoiInfo.selectionType = 'fake type';
        aoiInfo.description = 'fake';
        aoiInfo.geomType = 'Polygon';
        const initSpy = sinon.spy(ExportAOI.prototype, 'initializeOpenLayers');
        const readSpy = sinon.spy(GeoJSONFormat.prototype, 'readFeatures');
        const addSpy = sinon.spy(VectorSource.prototype, 'addFeatures');
        const fitSpy = sinon.spy(View.prototype, 'fit');
        const joyrideSpy = sinon.spy(ExportAOI.prototype, 'joyrideAddSteps');
        const setSpy = sinon.spy(ExportAOI.prototype, 'setButtonSelected');
        setup({ aoiInfo });
        expect(initSpy.calledOnce).toBe(true);
        expect(readSpy.called).toBe(true);
        expect(readSpy.calledWith(props.aoiInfo.geojson, {
            dataProjection: WGS84,
            featureProjection: WEB_MERCATOR,
        })).toBe(true);
        expect(addSpy.calledOnce).toBe(true);
        expect(fitSpy.calledOnce).toBe(true);
        expect(joyrideSpy.calledOnce).toBe(true);
        expect(props.setNextEnabled.calledOnce).toBe(true);
        expect(setSpy.calledOnce).toBe(true);
        expect(setSpy.calledWith('fake type')).toBe(true);
        initSpy.restore();
        readSpy.restore();
        addSpy.restore();
        fitSpy.restore();
        setSpy.restore();
        joyrideSpy.restore();
    });

    it('componentDidMount should initialize the map and ignore empty geojson value', () => {
        const initSpy = sinon.spy(ExportAOI.prototype, 'initializeOpenLayers');
        const readSpy = sinon.spy(GeoJSONFormat.prototype, 'readFeatures');
        const addSpy = sinon.spy(VectorSource.prototype, 'addFeature');
        const fitSpy = sinon.spy(View.prototype, 'fit');
        const setSpy = sinon.spy(ExportAOI.prototype, 'setButtonSelected');
        setup();
        expect(initSpy.calledOnce).toBe(true);
        expect(readSpy.called).toBe(false);
        expect(addSpy.called).toBe(false);
        expect(fitSpy.called).toBe(false);
        expect(props.setNextEnabled.called).toBe(false);
        expect(setSpy.called).toBe(false);
        initSpy.restore();
        readSpy.restore();
        addSpy.restore();
        fitSpy.restore();
        setSpy.restore();
    });

    it('componentDidUpdate should update map size', () => {
        const updateMapSpy = sinon.spy(Map.prototype, 'updateSize');
        const updateSpy = sinon.spy(instance, 'componentDidUpdate');
        expect(updateSpy.called).toBe(false);
        expect(updateMapSpy.called).toBe(false);
        instance.componentDidUpdate();
        wrapper.update();
        expect(updateSpy.calledOnce).toBe(true);
        expect(updateMapSpy.calledOnce).toBe(true);
        updateSpy.restore();
        updateMapSpy.restore();
    });

    it('componentDidUpdate should handle geojson upload if processed', () => {
        props.importGeom.processed = null;
        setup({ importGeom: { ...props.importGeom, processed: null }});
        const uploadStub = sinon.stub(instance, 'handleGeoJSONUpload');
        const nextProps = getProps();
        nextProps.importGeom.processed = true;
        nextProps.importGeom.featureCollection = new Point([1, 1]);
        wrapper.setProps(nextProps);
        expect(uploadStub.called).toBe(true);
        expect(uploadStub.calledWith(nextProps.importGeom)).toBe(true);
    });

    it('setButtonSelected should update the specified icon state to SELECTED and all others to INACTIVE', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        expect(stateSpy.called).toBe(false);
        instance.setButtonSelected('box');
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({
            toolbarIcons: {
                box: 'SELECTED',
                free: 'INACTIVE',
                mapView: 'INACTIVE',
                import: 'INACTIVE',
                search: 'INACTIVE',
            },
        })).toBe(true);
    });

    it('setAllButtonsDefault should update the icon state', () => {
        const initialIconState = {
            box: 'SELECTED',
            free: 'INACTIVE',
            mapView: 'INACTIVE',
            import: 'INACTIVE',
            search: 'INACTIVE',
        };
        const expectedIconState = {
            box: 'DEFAULT',
            free: 'DEFAULT',
            mapView: 'DEFAULT',
            import: 'DEFAULT',
            search: 'DEFAULT',
        };
        wrapper.setState({ toolbarIcons: initialIconState });
        expect(wrapper.state().toolbarIcons).toEqual(initialIconState);
        const stateSpy = sinon.spy(instance, 'setState');
        expect(stateSpy.called).toBe(false);
        instance.setAllButtonsDefault();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ toolbarIcons: expectedIconState })).toBe(true);
    });

    it('toggleImportModal should set the specified bool', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        expect(wrapper.state().showImportModal).toEqual(false);
        expect(stateSpy.called).toBe(false);
        instance.toggleImportModal(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showImportModal: true })).toBe(true);
    });

    it('toggleImportModal should negate the current state if no bool is passed in', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        expect(wrapper.state().showImportModal).toEqual(false);
        expect(stateSpy.called).toBe(false);
        instance.toggleImportModal();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showImportModal: true })).toBe(true);
    });

    it('showInvalidDrawWarning shoul set the specified bool', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        expect(wrapper.state().showInvalidDrawWarning).toEqual(false);
        expect(stateSpy.called).toBe(false);
        instance.showInvalidDrawWarning(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showInvalidDrawWarning: true })).toBe(true);
    });

    it('showInvalidDrawWarning should negate the current state if no bool is passed in', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        expect(wrapper.state().showInvalidDrawWarning).toEqual(false);
        expect(stateSpy.called).toBe(false);
        instance.showInvalidDrawWarning();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ showInvalidDrawWarning: true })).toBe(true);
    });

    it('handleCancel should hide invalid drawWarning, clear draw and aoiInfo, and set next disabled', () => {
        const clearSpy = sinon.spy(utils, 'clearDraw');
        instance.showInvalidDrawWarning = sinon.spy();
        instance.updateMode = sinon.spy();
        instance.handleCancel();
        expect(instance.showInvalidDrawWarning.calledOnce).toBe(true);
        expect(instance.updateMode.called).toBe(false);
        expect(clearSpy.calledOnce).toBe(true);
        expect(props.clearAoiInfo.calledOnce).toBe(true);
        expect(props.setNextDisabled.calledOnce).toBe(true);
        clearSpy.restore();
    });

    it('handleCancel  should call updateMode', () => {
        wrapper.setState({ mode: 'NOT_NORMAL' });
        const clearSpy = sinon.spy(utils, 'clearDraw');
        instance.showInvalidDrawWarning = sinon.spy();
        instance.updateMode = sinon.spy();
        instance.handleCancel();
        expect(instance.showInvalidDrawWarning.calledOnce).toBe(true);
        expect(instance.updateMode.calledOnce).toBe(true);
        expect(clearSpy.calledOnce).toBe(true);
        expect(props.clearAoiInfo.calledOnce).toBe(true);
        expect(props.setNextDisabled.calledOnce).toBe(true);
        clearSpy.restore();
    });

    it('handleResetMap should get the world extent and fit the view to it', () => {
        const transformSpy = sinon.spy(proj, 'transformExtent');
        const fitSpy = sinon.spy(View.prototype, 'fit');
        instance.handleResetMap();
        expect(transformSpy.calledOnce).toBe(true);
        expect(fitSpy.calledOnce).toBe(true);
        transformSpy.restore();
        fitSpy.restore();
    });

    it('checkForSearchUpdate should get new result if feature is a point and has no bbox', async () => {
        const feature: GeoJSON.Feature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [1, 1],
            },
            properties: {
                name: 'feature1',
            },
        };
        const returnedFeature = { ...feature };
        returnedFeature.bbox = [1, 1, 1, 1];
        const mock = new MockAdapter(axios, { delayResponse: 1 });
        mock.onGet('/geocode').reply(200, returnedFeature);
        const handleSearchStub = sinon.stub(instance, 'handleSearch')
            .returns(true);
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

    it('handleSearch should create a transformed geojson, update AoiInfo, zoom to, and set next enabled', () => {
        const clearSpy = sinon.spy(utils, 'clearDraw');
        const zoomSpy = sinon.spy(utils, 'zoomToFeature');
        const showSpy = sinon.spy(instance, 'showInvalidDrawWarning');
        const readSpy = sinon.spy(GeoJSONFormat.prototype, 'readFeature');
        const transformSpy = sinon.spy(Polygon.prototype, 'transform');
        const addSpy = sinon.spy(VectorSource.prototype, 'addFeature');
        expect(instance.handleSearch(geojson.features[0])).toBe(true);
        expect(clearSpy.calledOnce).toBe(true);
        expect(showSpy.calledOnce).toBe(true);
        expect(readSpy.calledOnce).toBe(true);
        expect(transformSpy.called).toBe(true);
        expect(addSpy.calledOnce).toBe(true);
        expect(props.updateAoiInfo.calledOnce).toBe(true);
        expect(zoomSpy.calledOnce).toBe(true);
        expect(props.setNextEnabled.calledOnce).toBe(true);
        clearSpy.restore();
        zoomSpy.restore();
        readSpy.restore();
        transformSpy.restore();
        addSpy.restore();
    });

    it('handleSearch should not setNextEnabled', () => {
        const point = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [1, 1],
            },
        };
        instance.handleSearch(point);
        expect(props.setNextEnabled.called).toBe(false);
    });

    it('handleGeoJSONUpload should clearDraw, addFeature, createGeoJSON, zoomTo, updateAoiInfo, and set next enabled', () => {
        const clearSpy = sinon.spy(utils, 'clearDraw');
        const areaSpy = sinon.stub(utils, 'allHaveArea').returns(true);
        const readSpy = sinon.spy(GeoJSONFormat.prototype, 'readFeatures');
        const fitSpy = sinon.spy(View.prototype, 'fit');
        const enableStub = sinon.stub(instance, 'shouldEnableNext').returns(true);
        const addSpy = sinon.spy(VectorSource.prototype, 'addFeatures');
        const hasPointOrLineStub = sinon.stub(utils, 'hasPointOrLine')
            .returns(false);
        const featureCollection = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [1, 1],
                    },
                },
            ],
        };
        instance.handleGeoJSONUpload({ featureCollection, filename: 'filename.geojson' });
        expect(clearSpy.calledOnce).toBe(true);
        expect(addSpy.calledOnce).toBe(true);
        expect(readSpy.calledOnce).toBe(true);
        expect(fitSpy.calledOnce).toBe(true);
        expect(props.updateAoiInfo.calledOnce).toBe(true);
        expect(props.setNextEnabled.calledOnce).toBe(true);
        clearSpy.restore();
        areaSpy.restore();
        readSpy.restore();
        fitSpy.restore();
        addSpy.restore();
        hasPointOrLineStub.restore();
        enableStub.restore();
    });

    it('setMapView should clear the drawing, calculate map extent add feature, and update aoiInfo and next enabled', () => {
        const clearSpy = sinon.spy(utils, 'clearDraw');
        const unwrapSpy = sinon.spy(utils, 'unwrapCoordinates');
        const createSpy = sinon.spy(utils, 'createGeoJSON');
        const calcSpy = sinon.spy(View.prototype, 'calculateExtent');
        const fromExtentSpy = sinon.spy(Polygon, 'fromExtent');
        const getCoordSpy = sinon.spy(Polygon.prototype, 'getCoordinates');
        const addSpy = sinon.spy(VectorSource.prototype, 'addFeature');
        const enableStub = sinon.stub(instance, 'shouldEnableNext').returns(true);
        instance.setMapView();
        expect(clearSpy.calledOnce).toBe(true);
        expect(calcSpy.calledOnce).toBe(true);
        expect(fromExtentSpy.calledOnce).toBe(true);
        expect(getCoordSpy.called).toBe(true);
        expect(unwrapSpy.calledOnce).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(addSpy.calledOnce).toBe(true);
        expect(props.updateAoiInfo.calledOnce).toBe(true);
        expect(props.setNextEnabled.calledOnce).toBe(true);
        clearSpy.restore();
        unwrapSpy.restore();
        createSpy.restore();
        calcSpy.restore();
        fromExtentSpy.restore();
        getCoordSpy.restore();
        addSpy.restore();
        enableStub.restore();
    });

    it('updateMode should set interactions false then activate BBOX interaction', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        const activeSpy = sinon.spy(Draw.prototype, 'setActive');
        const viewSpy = sinon.spy(utils, 'isViewOutsideValidExtent');
        expect(wrapper.state().mode).toEqual('MODE_NORMAL');
        expect(activeSpy.called).toBe(false);
        instance.updateMode('MODE_DRAW_BBOX');
        expect(activeSpy.calledThrice).toBe(true);
        expect(activeSpy.calledWith(true)).toBe(true);
        expect(activeSpy.calledWith(false)).toBe(true);
        expect(viewSpy.calledOnce).toBe(true);
        expect(viewSpy.alwaysReturned(false)).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ mode: 'MODE_DRAW_BBOX' })).toBe(true);
        activeSpy.restore();
        viewSpy.restore();
    });

    it('updateMode should set interactions false then activate FREE interaction', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        const activeSpy = sinon.spy(Draw.prototype, 'setActive');
        const viewSpy = sinon.spy(utils, 'isViewOutsideValidExtent');
        expect(wrapper.state().mode).toEqual('MODE_NORMAL');
        expect(activeSpy.called).toBe(false);
        instance.updateMode('MODE_DRAW_FREE');
        expect(activeSpy.calledThrice).toBe(true);
        expect(activeSpy.calledWith(true)).toBe(true);
        expect(activeSpy.calledWith(false)).toBe(true);
        expect(viewSpy.calledOnce).toBe(true);
        expect(viewSpy.alwaysReturned(false)).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ mode: 'MODE_DRAW_FREE' })).toBe(true);
        activeSpy.restore();
        viewSpy.restore();
    });

    it('updateMode should not activate draw interactions and should just update the state', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        const activeSpy = sinon.spy(Draw.prototype, 'setActive');
        const viewSpy = sinon.spy(utils, 'isViewOutsideValidExtent');
        expect(wrapper.state().mode).toEqual('MODE_NORMAL');
        expect(activeSpy.called).toBe(false);
        instance.updateMode('MODE_SOMETHING_ELSE');
        expect(activeSpy.calledTwice).toBe(true);
        expect(activeSpy.calledWith(true)).toBe(false);
        expect(activeSpy.calledWith(false)).toBe(true);
        expect(viewSpy.calledOnce).toBe(true);
        expect(viewSpy.alwaysReturned(false)).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ mode: 'MODE_SOMETHING_ELSE' })).toBe(true);
        activeSpy.restore();
        viewSpy.restore();
    });

    it('updateMode should call goToValidExtent', () => {
        const goToSpy = sinon.spy(utils, 'goToValidExtent');
        const viewSpy = sinon.spy(utils, 'isViewOutsideValidExtent');
        const view = instance.map.getView();
        const worldWidth = extent.getWidth(view.getProjection().getExtent());
        const center = view.getCenter();
        // set the center to be somewhere that require the map to wrap
        view.setCenter([center[0] + (3 * worldWidth), center[1]]);
        expect(wrapper.state().mode).toEqual('MODE_NORMAL');
        instance.updateMode('MODE_SOMETHING_ELSE');
        expect(viewSpy.calledOnce).toBe(true);
        expect(viewSpy.alwaysReturned(true)).toBe(true);
        expect(goToSpy.calledOnce).toBe(true);
        viewSpy.restore();
        goToSpy.restore();
    });

    it('handleDrawEnd should handle a FREE DRAW event', () => {
        wrapper.setState({ mode: 'MODE_DRAW_FREE' });
        const unwrapSpy = sinon.spy(utils, 'unwrapCoordinates');
        const createSpy = sinon.spy(utils, 'createGeoJSON');
        const isValidSpy = sinon.stub(utils, 'isGeoJSONValid').returns(true);
        const updateSpy = sinon.spy(instance, 'updateMode');

        const geom = new Polygon([[
            [100.0, 0.0],
            [101.0, 0.0],
            [101.0, 1.0],
            [100.0, 1.0],
            [100.0, 0.0],
        ]]).transform(WGS84, WEB_MERCATOR);
        const getCoordSpy = sinon.spy(geom, 'getCoordinates');
        const setCoordSpy = sinon.spy(geom, 'setCoordinates');
        const feat = new Feature({
            geometry: geom,
        });
        const getGeomSpy = sinon.spy(feat, 'getGeometry');
        const event = {
            feature: feat,
        };

        instance.handleDrawEnd(event);
        expect(getGeomSpy.calledOnce).toBe(true);
        expect(getCoordSpy.called).toBe(true);
        expect(unwrapSpy.calledOnce).toBe(true);
        expect(setCoordSpy.calledOnce).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(isValidSpy.calledOnce).toBe(true);
        expect(props.updateAoiInfo.calledOnce).toBe(true);
        expect(props.setNextEnabled.calledOnce).toBe(true);
        expect(updateSpy.calledOnce).toBe(true);
        getGeomSpy.restore();
        getCoordSpy.restore();
        unwrapSpy.restore();
        setCoordSpy.restore();
        createSpy.restore();
        isValidSpy.restore();
    });

    it('handleDrawEnd should handle an INVALID FREE DRAW event', () => {
        wrapper.setState({ mode: 'MODE_DRAW_FREE' });
        const isValidSpy = sinon.stub(utils, 'isGeoJSONValid').returns(false);
        const updateSpy = sinon.spy(instance, 'updateMode');
        const showWarningSpy = sinon.spy(instance, 'showInvalidDrawWarning');
        const event = {
            feature: new Feature({
                geometry: new Polygon([[
                    [100.0, 0.0],
                    [101.0, 0.0],
                    [101.0, 1.0],
                    [100.0, 1.0],
                    [100.0, 0.0],
                ]]).transform(WGS84, WEB_MERCATOR),
            }),
        };
        instance.handleDrawEnd(event);
        expect(isValidSpy.calledOnce).toBe(true);
        expect(showWarningSpy.calledOnce).toBe(true);
        expect(props.updateAoiInfo.called).toBe(false);
        expect(props.setNextEnabled.called).toBe(false);
        expect(updateSpy.calledOnce).toBe(true);
        isValidSpy.restore();
    });

    it('handleDrawEnd should handle a BBOX DRAW event', () => {
        wrapper.setState({ mode: 'MODE_DRAW_BBOX' });
        const unwrapSpy = sinon.spy(utils, 'unwrapCoordinates');
        const createSpy = sinon.spy(utils, 'createGeoJSON');
        const updateSpy = sinon.spy(instance, 'updateMode');
        const geom = new Polygon([[
            [100.0, 0.0],
            [101.0, 0.0],
            [101.0, 1.0],
            [100.0, 1.0],
            [100.0, 0.0],
        ]]).transform(WGS84, WEB_MERCATOR);
        const feat = new Feature({
            geometry: geom,
        });
        const event = {
            feature: feat,
        };
        const getGeomSpy = sinon.spy(feat, 'getGeometry');
        const getCoordSpy = sinon.spy(geom, 'getCoordinates');
        const setCoordSpy = sinon.spy(geom, 'setCoordinates');

        instance.handleDrawEnd(event);
        expect(getGeomSpy.calledOnce).toBe(true);
        expect(getCoordSpy.called).toBe(true);
        expect(unwrapSpy.calledOnce).toBe(true);
        expect(setCoordSpy.calledOnce).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(props.updateAoiInfo.calledOnce).toBe(true);
        expect(props.setNextEnabled.calledOnce).toBe(true);
        expect(updateSpy.calledOnce).toBe(true);
        getGeomSpy.restore();
        getCoordSpy.restore();
        unwrapSpy.restore();
        setCoordSpy.restore();
        createSpy.restore();
    });

    it('handleDrawEnd should ignore the event if the bbox has no area', () => {
        wrapper.setState({ mode: 'MODE_DRAW_BBOX' });
        const updateSpy = sinon.spy(instance, 'updateMode');
        const event = {
            feature: new Feature({
                geometry: new Polygon([[
                    [100.0, 0.0],
                    [100.0, 0.0],
                    [100.0, 0.0],
                    [100.0, 0.0],
                    [100.0, 0.0],
                ]]).transform(WGS84, WEB_MERCATOR),
            }),
        };
        instance.handleDrawEnd(event);
        expect(props.updateAoiInfo.called).toBe(false);
        expect(props.setNextEnabled.called).toBe(false);
        expect(updateSpy.called).toBe(false);
    });

    it('handleDrawStart should clearDraw', () => {
        const clearSpy = sinon.spy(utils, 'clearDraw');
        expect(clearSpy.called).toBe(false);
        instance.handleDrawStart();
        expect(clearSpy.calledOnce).toBe(true);
        clearSpy.restore();
    });

    it('initializeOpenLayers should create the map and necessary interactions', () => {
        const layerSpy = sinon.spy(utils, 'generateDrawLayer');
        const boxSpy = sinon.spy(utils, 'generateDrawBoxInteraction');
        const freeSpy = sinon.spy(utils, 'generateDrawFreeInteraction');
        const addInteractionSpy = sinon.spy(Map.prototype, 'addInteraction');
        const addLayerSpy = sinon.spy(Map.prototype, 'addLayer');
        instance.initializeOpenLayers();
        expect(layerSpy.calledThrice).toBe(true);
        expect(boxSpy.calledOnce).toBe(true);
        expect(freeSpy.calledOnce).toBe(true);
        expect(addInteractionSpy.calledThrice).toBe(true);
        expect(addLayerSpy.calledThrice).toBe(true);
        layerSpy.restore();
        boxSpy.restore();
        freeSpy.restore();
        addInteractionSpy.restore();
        addLayerSpy.restore();
    });

    it('upEvent should return false if there is no feature', () => {
        expect(instance.upEvent({})).toBe(false);
    });

    it('upEvent should check for a feature then updateAOI info if its a valid box', () => {
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
        const g = utils.createGeoJSON(feature.getGeometry());
        const unwrapStub = sinon.stub(utils, 'unwrapCoordinates')
            .callsFake(coords => (coords));
        const setSpy = sinon.spy(geom, 'setCoordinates');
        const writeSpy = sinon.stub(GeoJSONFormat.prototype, 'writeFeaturesObject')
            .returns(g);
        const validStub = sinon.stub(utils, 'isGeoJSONValid')
            .callsFake(() => (true));
        const warningSpy = sinon.stub(instance, 'showInvalidDrawWarning');

        instance.feature = feature;
        const ret = instance.upEvent({});
        expect(ret).toBe(false);
        expect(unwrapStub.calledOnce).toBe(true);
        expect(setSpy.calledOnce).toBe(true);
        expect(writeSpy.calledOnce).toBe(true);
        expect(validStub.calledOnce).toBe(true);
        expect(props.updateAoiInfo.calledOnce).toBe(true);
        expect(props.updateAoiInfo.calledWith({
            ...props.aoiInfo,
            geojson: g,
            originalGeojson: g,
            buffer: 0,
        })).toBe(true);
        expect(warningSpy.calledOnce).toBe(true);
        expect(warningSpy.calledWith(false)).toBe(true);
        expect(props.setNextEnabled.calledOnce).toBe(true);

        unwrapStub.restore();
        setSpy.restore();
        writeSpy.restore();
        validStub.restore();
        warningSpy.restore();
    });

    it('upEvent should display the invalid draw warning)', () => {
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
        const ret = instance.upEvent({});
        expect(ret).toBe(false);
        expect(validStub.calledOnce).toBe(true);
        expect(props.updateAoiInfo.called).toBe(false);
        expect(warningSpy.calledOnce).toBe(true);
        expect(warningSpy.calledWith(true)).toBe(true);
        expect(props.setNextDisabled.calledOnce).toBe(true);

        unwrapStub.restore();
        validStub.restore();
        warningSpy.restore();
    });

    it('dragEvent should transform a bbox and update its coordinates then move the vertex marker', () => {
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
        const ret = instance.dragEvent(evt);
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

    it('dragEvent should transform a polygon and update its coordinates then move the vertex marker', () => {
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
        const ret = instance.dragEvent(evt);
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

    it('dragEvent return false if updated feature has no area', () => {
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
        const ret = instance.dragEvent(evt);
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

    it('moveEvent should add a marker feature to the map', () => {
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
        instance.moveEvent(evt);
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

    it('moveEvent should not add a marker if pixel is not occupied by a vertex', () => {
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
        instance.moveEvent(evt);
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

    it('moveEvent should go to the valid extent', () => {
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
        instance.moveEvent(evt);
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

    it('moveEvent should clear the markerLayer', () => {
        const feature = new Feature({
            geometry: new Point([100.0, 0.0]),
        });
        const hasFeatureStub = sinon.stub(Map.prototype, 'hasFeatureAtPixel')
            .returns(false);
        const clearStub = sinon.stub(utils, 'clearDraw');

        instance.markerLayer.getSource().addFeature(feature);
        const evt = { pixel: [1, 1], map: instance.map };
        instance.moveEvent(evt);
        expect(clearStub.calledOnce).toBe(true);
        expect(hasFeatureStub.calledOnce).toBe(true);

        hasFeatureStub.restore();
        clearStub.restore();
    });

    it('moveEvent should skip features that are not polygons', () => {
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
        instance.moveEvent(evt);
        expect(hasFeatureStub.calledOnce).toBe(true);
        expect(getFeaturesStub.calledOnce).toBe(true);
        expect(vertexStub.called).toBe(false);

        hasFeatureStub.restore();
        getFeaturesStub.restore();
        vertexStub.restore();
        viewStub.restore();
    });

    it('downEvent should check if there is a feature at the target pixel and return true', () => {
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
        const ret = instance.downEvent(evt);
        expect(ret).toBe(true);
        expect(instance.feature).toBe(feature);
        expect(instance.coordinate).toEqual([100.0, 0.0]);

        hasFeatureStub.restore();
        getFeaturesStub.restore();
        vertexStub.restore();
    });

    it('downEvent should return false if map has no feature at pixel', () => {
        const hasFeatureStub = sinon.stub(Map.prototype, 'hasFeatureAtPixel')
            .returns(false);
        const evt = { pixel: [1, 1], map: instance.map };
        const ret = instance.downEvent(evt);
        expect(ret).toBe(false);
        hasFeatureStub.restore();
    });

    it('downEvent should return false if feature is not a polygon', () => {
        const feature = new Feature({
            geometry: new Point([1, 1]),
        });
        const hasFeatureStub = sinon.stub(Map.prototype, 'hasFeatureAtPixel')
            .returns(true);
        const getFeaturesStub = sinon.stub(Map.prototype, 'getFeaturesAtPixel')
            .returns([feature]);
        const evt = { pixel: [1, 1], map: instance.map };
        const ret = instance.downEvent(evt);
        expect(ret).toBe(false);
        hasFeatureStub.restore();
        getFeaturesStub.restore();
    });

    it('downEvent should return false if it is not a vertex', () => {
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
        const ret = instance.downEvent(evt);
        expect(ret).toBe(false);
        hasFeatureStub.restore();
        getFeaturesStub.restore();
        vertexStub.restore();
    });

    it('handleZoomToSelection should read in a geojson then zoom to the geom', () => {
        const aoiInfo = { ...props.aoiInfo };
        aoiInfo.geojson = geojson;
        aoiInfo.geomType = 'Polygon';
        setup({ aoiInfo });
        const readSpy = sinon.spy(GeoJSONFormat.prototype, 'readFeatures');
        const zoomSpy = sinon.spy(View.prototype, 'fit');
        instance.handleZoomToSelection();
        expect(readSpy.calledOnce).toBe(true);
        expect(readSpy.calledWith(geojson)).toBe(true);
        expect(zoomSpy.calledOnce).toBe(true);
        readSpy.restore();
        zoomSpy.restore();
    });

    it('bufferMapFeature should return false if no geojson in aoiInfo', () => {
        setup({ aoiInfo: { ...props.aoiInfo, geojson: {} } });
        expect(instance.bufferMapFeature(11)).toBe(false);
    });

    it('bufferMapFeature should return true, update AOI info and set next enabled', () => {
        const aoiInfo = { ...props.aoiInfo };
        aoiInfo.geojson = geojson;
        aoiInfo.geomType = 'Polygon';
        setup({ aoiInfo });
        props.setNextEnabled.reset();
        const fakeFeature = new Feature();

        const addStub = sinon.stub(VectorSource.prototype, 'addFeatures');
        const readStub = sinon.stub(GeoJSONFormat.prototype, 'readFeatures')
            .returns([fakeFeature]);
        const enableStub = sinon.stub(instance, 'shouldEnableNext').returns(true);
        instance.bufferFeatures = geojson;
        expect(instance.bufferMapFeature(111)).toBe(true);
        expect(addStub.calledOnce).toBe(true);
        expect(readStub.calledOnce).toBe(true);
        expect(readStub.calledWith(geojson)).toBe(true);
        expect(props.updateAoiInfo.calledOnce).toBe(true);
        expect(props.setNextEnabled.calledOnce).toBe(true);

        addStub.restore();
        readStub.restore();
        enableStub.restore();
    });

    it('openResetDialog should set showReset to true', () => {
        const aoiInfo = { ...props.aoiInfo };
        aoiInfo.geojson = geojson;
        aoiInfo.geomType = 'Polygon';
        setup({ aoiInfo });
        const stateSpy = sinon.spy(instance, 'setState');
        instance.openResetDialog();
        expect(stateSpy.called).toBe(true);
        expect(stateSpy.calledWith({ showReset: true })).toBe(true);
        stateSpy.restore();
    });

    it('closeResetDialog should set showReset to false', () => {
        const stateSpy = sinon.spy(instance, 'setState');
        instance.closeResetDialog();
        expect(stateSpy.called).toBe(true);
        expect(stateSpy.calledWith({ showReset: false })).toBe(true);
        stateSpy.restore();
    });

    it('resetAoi should replace the layer and geojson with the orginal version', () => {
        const readSpy = sinon.spy(GeoJSONFormat.prototype, 'readFeatures');
        const clearSpy = sinon.spy(utils, 'clearDraw');
        const addSpy = sinon.spy(VectorSource.prototype, 'addFeatures');
        const stateSpy = sinon.spy(ExportAOI.prototype, 'setState');
        setup({ aoiInfo: { ...props.aoiInfo, originalGeojson: geojson }});
        const enableStub = sinon.stub(instance, 'shouldEnableNext').returns(true);
        instance.resetAoi();
        expect(readSpy.calledOnce).toBe(true);
        expect(readSpy.calledWith(geojson, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
        })).toBe(true);
        expect(clearSpy.calledOnce).toBe(true);
        expect(addSpy.calledOnce).toBe(true);
        expect(props.updateAoiInfo.calledOnce).toBe(true);
        expect(props.updateAoiInfo.calledWith({
            ...props.aoiInfo,
            geojson,
            buffer: 0,
        })).toBe(true);
        expect(stateSpy.calledWith({ showReset: false })).toBe(true);
        expect(props.setNextDisabled.called).toBe(false);
        readSpy.restore();
        clearSpy.restore();
        addSpy.restore();
        stateSpy.restore();
        enableStub.restore();
    });

    it('shouldEnabledNext should rturn false if not all feature have area', () => {
        const areaStub = sinon.stub(utils, 'allHaveArea').returns(false);
        const enable = instance.shouldEnableNext({});
        expect(enable).toBe(false);
        areaStub.restore();
    });

    it('shouldEnableNext should return false if the area exceeds the limit', () => {
        const areaStub = sinon.stub(utils, 'allHaveArea').returns(true);
        const getStub = sinon.stub(generic, 'getSqKm').returns(9999999);
        const enable = instance.shouldEnableNext({});
        expect(enable).toBe(false);
        areaStub.restore();
        getStub.restore();
    });

    it('shouldEnableNext should return true', () => {
        const areaStub = sinon.stub(utils, 'allHaveArea').returns(true);
        const getStub = sinon.stub(generic, 'getSqKm').returns(10);
        const enable = instance.shouldEnableNext({});
        expect(enable).toBe(true);
        areaStub.restore();
        getStub.restore();
    });

    it('joyrideAddSteps should set state for steps in tour', () => {
        const steps = [{
            title: 'Search for location',
            text: 'Type in location name to set area of interest.',
            selector: '.bootstrap-typeahead-input',
            position: 'bottom',
            style: {},
        }];
        const stateSpy = sinon.spy(instance, 'setState');
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
        const stateSpy = sinon.spy(ExportAOI.prototype, 'setState');
        instance.callback(callbackData);
        expect(stateSpy.calledWith({ isRunning: false }));
        stateSpy.restore();
    });

    it('callback function should draw fake bbox if none is currently drawn on map', () => {
        const callbackData = {
            action: 'next',
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
        props.aoiInfo.description = null;
        const stateSpy = sinon.spy(instance, 'setState');
        const drawFakeBboxSpy = sinon.spy(instance, 'drawFakeBbox');
        instance.callback(callbackData);
        expect(drawFakeBboxSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({ fakeData: true }));
        stateSpy.restore();
        drawFakeBboxSpy.restore();
    });
});
