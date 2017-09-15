import React from 'react';
import sinon from 'sinon';
import {mount} from 'enzyme';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import {ExportAOI, WGS84, WEB_MERCATOR} from '../../components/CreateDataPack/ExportAOI';
import ol from 'openlayers';
import AoiInfobar from '../../components/CreateDataPack/AoiInfobar.js';
import SearchAOIToolbar from '../../components/MapTools/SearchAOIToolbar.js';
import DrawAOIToolbar from '../../components/MapTools/DrawAOIToolbar.js';
import InvalidDrawWarning from '../../components/MapTools/InvalidDrawWarning.js';
import DropZone from '../../components/MapTools/DropZone.js';
import * as utils from '../../utils/mapUtils';

// this polyfills requestAnimationFrame in the test browser, required for ol3
import raf from 'raf';
raf.polyfill();


describe('ExportAOI component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();

    const geojson = { 
        "type": "FeatureCollection",
        "features": [{ 
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
                    [100.0, 1.0], [100.0, 0.0] ]
                ]
            },
            "bbox": [100.0, 0.0, 101.0, 1.0]
        }]
    }

    const getProps = () => {
        return {
            aoiInfo: {
                geojson: {},
                geomType: null,
                title: null,
                description: null,
                selectionType: null
            },
            importGeom: {
                processing: false,
                processed: false,
                geom: {},
                error: null,
            },
            drawerOpen: true,
            geocode: {
                fetching: false,
                fetched: false,
                data: [],
                error: null,
            },
            updateAoiInfo: () => {},
            clearAoiInfo: () => {},
            setNextDisabled: () => {},
            setNextEnabled: () => {},
            getGeocode: () => {},
            processGeoJSONFile: () => {},
            resetGeoJSONFile: () => {}
        }
    }

    const getWrapper = (props) => {
        const config = {BASEMAP_URL: 'http://my-osm-tile-service/{z}/{x}/{y}.png'};        
        return mount(<ExportAOI {...props}/>, {
            context: {muiTheme, config},
            childContextTypes: {
                muiTheme: React.PropTypes.object,
                config: React.PropTypes.object
            }
        });
    }

    const regShape = ol.style.RegularShape;
    beforeEach(() => {
        ol.style.RegularShape = new sinon.spy();
    });

    afterEach(() => {
        ol.style.RegularShape = regShape;
    });

    it('should render the basic elements', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find('#map')).toHaveLength(1);
        expect(wrapper.find(AoiInfobar)).toHaveLength(1);
        expect(wrapper.find(SearchAOIToolbar)).toHaveLength(1);
        expect(wrapper.find(DrawAOIToolbar)).toHaveLength(1);
        expect(wrapper.find(InvalidDrawWarning)).toHaveLength(1);
        expect(wrapper.find(DropZone)).toHaveLength(1);
    });

    it('componentDidMount should initialize the map and handle aoiInfo if present', () => {
        const props = getProps();
        props.aoiInfo.geojson = geojson;
        props.aoiInfo.selectionType = 'fake type';
        const mountSpy = new sinon.spy(ExportAOI.prototype, 'componentDidMount');
        const initSpy = new sinon.spy(ExportAOI.prototype, 'initializeOpenLayers');
        const readSpy = new sinon.spy(ol.format.GeoJSON.prototype, 'readFeatures');
        const addSpy = new sinon.spy(ol.source.Vector.prototype, 'addFeature');
        const fitSpy = new sinon.spy(ol.View.prototype, 'fit');
        props.setNextEnabled = new sinon.spy();
        const setSpy = new sinon.spy(ExportAOI.prototype, 'setButtonSelected');
        const wrapper = getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(initSpy.calledOnce).toBe(true);
        expect(readSpy.calledOnce).toBe(true);
        expect(readSpy.calledWith(props.aoiInfo.geojson, {
            dataProjection: WGS84,
            featureProjection: WEB_MERCATOR
        })).toBe(true);
        expect(addSpy.calledOnce).toBe(true);
        expect(fitSpy.calledOnce).toBe(true);
        expect(props.setNextEnabled.calledOnce).toBe(true);
        expect(setSpy.calledOnce).toBe(true);
        expect(setSpy.calledWith('fake type')).toBe(true);
        mountSpy.restore();
        initSpy.restore();
        readSpy.restore();
        addSpy.restore();
        fitSpy.restore();
        setSpy.restore();
    });

    it('componentDidMount should initialize the map and ignore empty geojson value', () => {
        const props = getProps();
        const mountSpy = new sinon.spy(ExportAOI.prototype, 'componentDidMount');
        const initSpy = new sinon.spy(ExportAOI.prototype, 'initializeOpenLayers');
        const readSpy = new sinon.spy(ol.format.GeoJSON.prototype, 'readFeatures');
        const addSpy = new sinon.spy(ol.source.Vector.prototype, 'addFeature');
        const fitSpy = new sinon.spy(ol.View.prototype, 'fit');
        props.setNextEnabled = new sinon.spy();
        const setSpy = new sinon.spy(ExportAOI.prototype, 'setButtonSelected');
        const wrapper = getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(initSpy.calledOnce).toBe(true);
        expect(readSpy.called).toBe(false);
        expect(addSpy.called).toBe(false);
        expect(fitSpy.called).toBe(false);
        expect(props.setNextEnabled.called).toBe(false);
        expect(setSpy.called).toBe(false);
        mountSpy.restore();
        initSpy.restore();
        readSpy.restore();
        addSpy.restore();
        fitSpy.restore();
        setSpy.restore();
    });

    it('componentDidUpdate should update map size', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const updateMapSpy = new sinon.spy(ol.Map.prototype, 'updateSize');
        const updateSpy = new sinon.spy(wrapper.instance(), 'componentDidUpdate');
        expect(updateSpy.called).toBe(false);
        expect(updateMapSpy.called).toBe(false);
        wrapper.update();
        expect(updateSpy.calledOnce).toBe(true);
        expect(updateMapSpy.calledOnce).toBe(true);
        updateSpy.restore();
        updateMapSpy.restore();
    });

    it('componentWillReceiveProps should handle geojson upload if processed', () => {
        const props = getProps();
        const propsSpy = new sinon.spy(ExportAOI.prototype, 'componentWillReceiveProps');
        const wrapper = getWrapper(props);
        wrapper.instance().handleGeoJSONUpload = new sinon.spy();
        wrapper.instance().updateAoiInfo = new sinon.spy();
        const nextProps = getProps();
        nextProps.importGeom.processed = true;
        nextProps.importGeom.geom = new ol.geom.Point([1,1]);
        wrapper.setProps(nextProps);
        expect(propsSpy.calledOnce).toBe(true);
        expect(wrapper.instance().handleGeoJSONUpload.calledOnce).toBe(true);
        expect(wrapper.instance().handleGeoJSONUpload.calledWith(nextProps.importGeom.geom)).toBe(true);
        propsSpy.restore();
    });

    it('setButtonSelected should update the specified icon state to SELECTED and all others to INACTIVE', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');        
        expect(stateSpy.called).toBe(false);
        wrapper.instance().setButtonSelected('box');
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({
            toolbarIcons: {
                box: 'SELECTED',
                free: 'INACTIVE',
                mapView: 'INACTIVE',
                import: 'INACTIVE',
                search: 'INACTIVE',
            }
        })).toBe(true);
    });

    it('setAllButtonsDefault should update the icon state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const initialIconState = {
            box: 'SELECTED',
            free: 'INACTIVE',
            mapView: 'INACTIVE',
            import: 'INACTIVE',
            search: 'INACTIVE',
        }
        const expectedIconState = {
            box: 'DEFAULT',
            free: 'DEFAULT',
            mapView: 'DEFAULT',
            import: 'DEFAULT',
            search: 'DEFAULT',
        }
        wrapper.setState({toolbarIcons: initialIconState});
        expect(wrapper.state().toolbarIcons).toEqual(initialIconState);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        expect(stateSpy.called).toBe(false);
        wrapper.instance().setAllButtonsDefault();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({toolbarIcons: expectedIconState})).toBe(true);
    });

    it('toggleImportModal should set the specified bool', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        expect(wrapper.state().showImportModal).toEqual(false);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().toggleImportModal(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({showImportModal: true})).toBe(true);
    });

    it('toggleImportModal should negate the current state if no bool is passed in', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        expect(wrapper.state().showImportModal).toEqual(false);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().toggleImportModal();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({showImportModal: true})).toBe(true);
    });

    it('showInvalidDrawWarning shoul set the specified bool', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        expect(wrapper.state().showInvalidDrawWarning).toEqual(false);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().showInvalidDrawWarning(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({showInvalidDrawWarning: true})).toBe(true);
    });

    it('showInvalidDrawWarning should negate the current state if no bool is passed in', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        expect(wrapper.state().showInvalidDrawWarning).toEqual(false);
        expect(stateSpy.called).toBe(false);
        wrapper.instance().showInvalidDrawWarning();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({showInvalidDrawWarning: true})).toBe(true);
    });

    it('handleCancel should hide invalid drawWarning, updateMode, clear draw and aoiInfo, and set next disabled', () => {
        const props = getProps();
        props.clearAoiInfo = new sinon.spy();
        props.setNextDisabled = new sinon.spy();
        const wrapper = getWrapper(props);
        const clearSpy = new sinon.spy(utils, 'clearDraw');
        wrapper.instance().showInvalidDrawWarning = new sinon.spy();
        wrapper.instance().updateMode = new sinon.spy();
        wrapper.instance().handleCancel();
        expect(wrapper.instance().showInvalidDrawWarning.calledOnce).toBe(true);
        expect(wrapper.instance().updateMode.called).toBe(false);
        expect(clearSpy.calledOnce).toBe(true);
        expect(props.clearAoiInfo.calledOnce).toBe(true);
        expect(props.setNextDisabled.calledOnce).toBe(true);
        clearSpy.restore();
    });

    it('handleResetMap should get the world extent and fit the view to it', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const transformSpy = new sinon.spy(ol.proj, 'transformExtent');
        const fitSpy = new sinon.spy(ol.View.prototype, 'fit');
        wrapper.instance().handleResetMap();
        expect(transformSpy.calledOnce).toBe(true);
        expect(fitSpy.calledOnce).toBe(true);
        transformSpy.restore();
        fitSpy.restore();
    });

    it('handleSearch should create a transformed geojson, update AoiInfo, zoom to, and set next enabled', () => {
        const props = getProps();
        props.updateAoiInfo = new sinon.spy();
        props.setNextEnabled = new sinon.spy();
        const clearSpy = new sinon.spy(utils, 'clearDraw');
        const createSpy = new sinon.spy(utils, 'createGeoJSON');
        const zoomSpy = new sinon.spy(utils, 'zoomToGeometry');
        const wrapper = getWrapper(props);
        const showSpy = wrapper.instance().showInvalidDrawWarning = new sinon.spy();
        const readSpy = new sinon.spy(ol.format.GeoJSON.prototype, 'readFeature');
        const transformSpy = new sinon.spy(ol.geom.Polygon.prototype, 'transform');
        const addSpy = new sinon.spy(ol.source.Vector.prototype, 'addFeature');
        expect(wrapper.instance().handleSearch(geojson.features[0])).toBe(true);
        expect(clearSpy.calledOnce).toBe(true);
        expect(showSpy.calledOnce).toBe(true);
        expect(readSpy.calledOnce).toBe(true);
        expect(transformSpy.called).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(addSpy.calledOnce).toBe(true);
        expect(props.updateAoiInfo.calledOnce).toBe(true);
        expect(zoomSpy.calledOnce).toBe(true);
        expect(props.setNextEnabled.calledOnce).toBe(true);
        clearSpy.restore();
        createSpy.restore();
        zoomSpy.restore();
        readSpy.restore();
        transformSpy.restore();
        addSpy.restore();
    });

    it('handleSearch should not setNextEnabled', () => {
        const props = getProps();
        props.setNextEnabled = new sinon.spy();
        const point = { 
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [1,1]
            },
        }
        const wrapper = getWrapper(props);
        wrapper.instance().handleSearch(point);
        expect(props.setNextEnabled.called).toBe(false);
    });

    it('handleGeoJSONUpload should clearDraw, addFeature, createGeoJSON, zoomTo, updateAoiInfo, and set next enabled', () => {
        const props = getProps();
        props.updateAoiInfo = new sinon.spy();
        props.setNextEnabled = new sinon.spy();
        const clearSpy = new sinon.spy(utils, 'clearDraw');
        const createSpy = new sinon.spy(utils, 'createGeoJSON');
        const zoomSpy = new sinon.spy(utils, 'zoomToGeometry');
        const wrapper = getWrapper(props);
        const addSpy = new sinon.spy(ol.source.Vector.prototype, 'addFeature');
        const geom = new ol.geom.Point([1,1]);
        wrapper.instance().handleGeoJSONUpload(geom);
        expect(clearSpy.calledOnce).toBe(true);
        expect(addSpy.calledOnce).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(zoomSpy.calledOnce).toBe(true);
        expect(props.updateAoiInfo.calledOnce).toBe(true);
        expect(props.setNextEnabled.calledOnce).toBe(true);
        clearSpy.restore();
        createSpy.restore();
        zoomSpy.restore();
        addSpy.restore();
    });

    it('setMapView should clear the drawing, calculate map extent add feature, and update aoiInfo and next enabled', () => {
        const props = getProps();
        props.updateAoiInfo = new sinon.spy();
        props.setNextEnabled = new sinon.spy();
        const clearSpy = new sinon.spy(utils, 'clearDraw');
        const unwrapSpy = new sinon.spy(utils, 'unwrapCoordinates');
        const createSpy = new sinon.spy(utils, 'createGeoJSON');
        const serializeSpy = new sinon.spy(utils, 'serialize');
        const wrapper = getWrapper(props);
        const calcSpy = new sinon.spy(ol.View.prototype, 'calculateExtent');
        const fromExtentSpy = new sinon.spy(ol.geom.Polygon, 'fromExtent');
        const getCoordSpy = new sinon.spy(ol.geom.Polygon.prototype, 'getCoordinates');
        const addSpy = new sinon.spy(ol.source.Vector.prototype, 'addFeature');
        wrapper.instance().setMapView();
        expect(clearSpy.calledOnce).toBe(true);
        expect(calcSpy.calledOnce).toBe(true);
        expect(fromExtentSpy.calledOnce).toBe(true);
        expect(getCoordSpy.called).toBe(true);
        expect(unwrapSpy.calledOnce).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(serializeSpy.calledOnce).toBe(true);
        expect(addSpy.calledOnce).toBe(true);
        expect(props.updateAoiInfo.calledOnce).toBe(true);
        expect(props.setNextEnabled.calledOnce).toBe(true);
        clearSpy.restore();
        unwrapSpy.restore();
        createSpy.restore();
        serializeSpy.restore();
        calcSpy.restore();
        fromExtentSpy.restore();
        getCoordSpy.restore();
        addSpy.restore();
    });

    it('updateMode should set interactions false then activate BBOX interaction', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        const activeSpy = new sinon.spy(ol.interaction.Draw.prototype, 'setActive');
        const viewSpy = new sinon.spy(utils, 'isViewOutsideValidExtent');
        expect(wrapper.state().mode).toEqual('MODE_NORMAL');
        expect(activeSpy.called).toBe(false);
        wrapper.instance().updateMode('MODE_DRAW_BBOX');
        expect(activeSpy.calledThrice).toBe(true);
        expect(activeSpy.calledWith(true)).toBe(true);
        expect(activeSpy.calledWith(false)).toBe(true);
        expect(viewSpy.calledOnce).toBe(true);
        expect(viewSpy.alwaysReturned(false)).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({mode: 'MODE_DRAW_BBOX'})).toBe(true);
        activeSpy.restore();
        viewSpy.restore();
    });

    it('updateMode should set interactions false then activate FREE interaction', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        const activeSpy = new sinon.spy(ol.interaction.Draw.prototype, 'setActive');
        const viewSpy = new sinon.spy(utils, 'isViewOutsideValidExtent');
        expect(wrapper.state().mode).toEqual('MODE_NORMAL');
        expect(activeSpy.called).toBe(false);
        wrapper.instance().updateMode('MODE_DRAW_FREE');
        expect(activeSpy.calledThrice).toBe(true);
        expect(activeSpy.calledWith(true)).toBe(true);
        expect(activeSpy.calledWith(false)).toBe(true);
        expect(viewSpy.calledOnce).toBe(true);
        expect(viewSpy.alwaysReturned(false)).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({mode: 'MODE_DRAW_FREE'})).toBe(true);
        activeSpy.restore();
        viewSpy.restore();
    });

    it('updateMode should not activate draw interactions and should just update the state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        const activeSpy = new sinon.spy(ol.interaction.Draw.prototype, 'setActive');
        const viewSpy = new sinon.spy(utils, 'isViewOutsideValidExtent');
        expect(wrapper.state().mode).toEqual('MODE_NORMAL');
        expect(activeSpy.called).toBe(false);
        wrapper.instance().updateMode('MODE_SOMETHING_ELSE');
        expect(activeSpy.calledTwice).toBe(true);
        expect(activeSpy.calledWith(true)).toBe(false);
        expect(activeSpy.calledWith(false)).toBe(true);
        expect(viewSpy.calledOnce).toBe(true);
        expect(viewSpy.alwaysReturned(false)).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({mode: 'MODE_SOMETHING_ELSE'})).toBe(true);
        activeSpy.restore();
        viewSpy.restore();
    });

    it('updateMode should call goToValidExtent', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const goToSpy = new sinon.spy(utils, 'goToValidExtent');
        const viewSpy = new sinon.spy(utils, 'isViewOutsideValidExtent');
        const view = wrapper.instance().map.getView();
        const worldWidth = ol.extent.getWidth(view.getProjection().getExtent());
        const center = view.getCenter();
        // set the center to be somewhere that require the map to wrap
        view.setCenter([center[0] + (3 * worldWidth), center[1]]);
        expect(wrapper.state().mode).toEqual('MODE_NORMAL');
        wrapper.instance().updateMode('MODE_SOMETHING_ELSE');
        expect(viewSpy.calledOnce).toBe(true);
        expect(viewSpy.alwaysReturned(true)).toBe(true);
        expect(goToSpy.calledOnce).toBe(true);
        viewSpy.restore();
        goToSpy.restore();
    });

    it('handleDrawEnd should handle a FREE DRAW event', () => {
        const props = getProps();
        props.updateAoiInfo = new sinon.spy();
        props.setNextEnabled = new sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setState({mode: 'MODE_DRAW_FREE'})
        const getGeomSpy = new sinon.spy(ol.Feature.prototype, 'getGeometry');
        const getCoordSpy = new sinon.spy(ol.geom.Polygon.prototype, 'getCoordinates');
        const unwrapSpy = new sinon.spy(utils, 'unwrapCoordinates');
        const setCoordSpy = new sinon.spy(ol.geom.Polygon.prototype, 'setCoordinates');
        const createSpy = new sinon.spy(utils, 'createGeoJSON');
        const addSpy = new sinon.spy(ol.source.Vector.prototype, 'addFeature');
        const isValidSpy = new sinon.stub(utils, 'isGeoJSONValid').returns(true);
        const updateSpy = wrapper.instance().updateMode = new sinon.spy();
        const event = {
            feature: new ol.Feature({
                geometry: new ol.geom.Polygon(
                    [[
                        [100.0, 0.0], 
                        [101.0, 0.0], 
                        [101.0, 1.0],
                        [100.0, 1.0], 
                        [100.0, 0.0]
                    ]]
                ).transform(WGS84,WEB_MERCATOR)
            })
        }
        wrapper.instance().handleDrawEnd(event);
        expect(getGeomSpy.calledOnce).toBe(true);
        expect(getCoordSpy.called).toBe(true);
        expect(unwrapSpy.calledOnce).toBe(true);
        expect(setCoordSpy.calledOnce).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(addSpy.calledOnce).toBe(true);
        expect(isValidSpy.calledOnce).toBe(true);
        expect(props.updateAoiInfo.calledOnce).toBe(true);
        expect(props.setNextEnabled.calledOnce).toBe(true);
        expect(updateSpy.calledOnce).toBe(true);
        getGeomSpy.restore();
        getCoordSpy.restore();
        unwrapSpy.restore();
        setCoordSpy.restore();
        createSpy.restore();
        addSpy.restore();
        isValidSpy.restore();
    });

    it('handleDrawEnd should handle an INVALID FREE DRAW event', () => {
        const props = getProps();
        props.updateAoiInfo = new sinon.spy();
        props.setNextEnabled = new sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setState({mode: 'MODE_DRAW_FREE'})
        const addSpy = new sinon.spy(ol.source.Vector.prototype, 'addFeature');
        const isValidSpy = new sinon.stub(utils, 'isGeoJSONValid').returns(false);
        const updateSpy = wrapper.instance().updateMode = new sinon.spy();
        const showWarningSpy = wrapper.instance().showInvalidDrawWarning = new sinon.spy();
        const event = {
            feature: new ol.Feature({
                geometry: new ol.geom.Polygon(
                    [[
                        [100.0, 0.0], 
                        [101.0, 0.0], 
                        [101.0, 1.0],
                        [100.0, 1.0], 
                        [100.0, 0.0]
                    ]]
                ).transform(WGS84,WEB_MERCATOR)
            })
        }
        wrapper.instance().handleDrawEnd(event);
        expect(addSpy.calledOnce).toBe(true);
        expect(isValidSpy.calledOnce).toBe(true);
        expect(showWarningSpy.calledOnce).toBe(true)
        expect(props.updateAoiInfo.called).toBe(false);
        expect(props.setNextEnabled.called).toBe(false);
        expect(updateSpy.calledOnce).toBe(true);
        addSpy.restore();
        isValidSpy.restore();
    });

    it('handleDrawEnd should handle a BBOX DRAW event', () => {
        const props = getProps();
        props.updateAoiInfo = new sinon.spy();
        props.setNextEnabled = new sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setState({mode: 'MODE_DRAW_BBOX'})
        const getGeomSpy = new sinon.spy(ol.Feature.prototype, 'getGeometry');
        const getCoordSpy = new sinon.spy(ol.geom.Polygon.prototype, 'getCoordinates');
        const unwrapSpy = new sinon.spy(utils, 'unwrapCoordinates');
        const setCoordSpy = new sinon.spy(ol.geom.Polygon.prototype, 'setCoordinates');
        const createSpy = new sinon.spy(utils, 'createGeoJSON');
        const serializeSpy = new sinon.spy(utils, 'serialize');
        const updateSpy = wrapper.instance().updateMode = new sinon.spy();
        const event = {
            feature: new ol.Feature({
                geometry: new ol.geom.Polygon(
                    [[ 
                        [100.0, 0.0], 
                        [101.0, 0.0], 
                        [101.0, 1.0],
                        [100.0, 1.0], 
                        [100.0, 0.0]
                    ]]
                ).transform(WGS84,WEB_MERCATOR)
            })
        }
        wrapper.instance().handleDrawEnd(event);
        expect(getGeomSpy.calledOnce).toBe(true);
        expect(getCoordSpy.called).toBe(true);
        expect(unwrapSpy.calledOnce).toBe(true);
        expect(setCoordSpy.calledOnce).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(serializeSpy.calledOnce).toBe(true);
        expect(props.updateAoiInfo.calledOnce).toBe(true);
        expect(props.setNextEnabled.calledOnce).toBe(true);
        expect(updateSpy.calledOnce).toBe(true);
        getGeomSpy.restore();
        getCoordSpy.restore();
        unwrapSpy.restore();
        setCoordSpy.restore();
        createSpy.restore();
        serializeSpy.restore();
    });

    it('handleDrawEnd should ignore the event if the bbox has no area', () => {
        const props = getProps();
        props.updateAoiInfo = new sinon.spy();
        props.setNextEnabled = new sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setState({mode: 'MODE_DRAW_BBOX'})
        const updateSpy = wrapper.instance().updateMode = new sinon.spy();
        const event = {
            feature: new ol.Feature({
                geometry: new ol.geom.Polygon(
                    [[ 
                        [100.0, 0.0], 
                        [100.0, 0.0], 
                        [100.0, 0.0],
                        [100.0, 0.0], 
                        [100.0, 0.0]
                    ]]
                ).transform(WGS84,WEB_MERCATOR)
            })
        }
        wrapper.instance().handleDrawEnd(event);
        expect(props.updateAoiInfo.called).toBe(false);
        expect(props.setNextEnabled.called).toBe(false);
        expect(updateSpy.called).toBe(false);
    });

    it('handleDrawStart should clearDraw', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const clearSpy = new sinon.spy(utils, 'clearDraw');
        expect(clearSpy.called).toBe(false);
        wrapper.instance().handleDrawStart();
        expect(clearSpy.calledOnce).toBe(true);
        clearSpy.restore();
    });

    it('initializeOpenLayers should create the map and necessary interactions', () => {

    });
});
