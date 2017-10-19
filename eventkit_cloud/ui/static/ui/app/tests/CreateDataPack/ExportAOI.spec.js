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
            drawer: 'open',
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

    it('the left position should be 200px if drawer is open, otherwise 0px', () => {
        const props = getProps();
        props.drawer = 'open';
        const wrapper = getWrapper(props);
        window.resizeTo(1300, 800);
        expect(window.innerWidth).toBe(1300);
        wrapper.update();
        expect(wrapper.find('#map').props().style.left).toEqual('200px');
        const nextProps = getProps();
        nextProps.drawer = 'closed';
        wrapper.setProps(nextProps);
        expect(wrapper.find('#map').props().style.left).toEqual('0px');
    });

    it('the functions passed to DrawAOIToolbar and SearchAOIToolbar should call setButtonSelected with the correct values', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const drawToolbar = wrapper.find(DrawAOIToolbar);
        const setSpy = wrapper.instance().setButtonSelected = new sinon.spy();
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

    it('handleCancel should hide invalid drawWarning, clear draw and aoiInfo, and set next disabled', () => {
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

    it('handleCancel  should call updateMode', () => {
        const props = getProps();
        props.clearAoiInfo = new sinon.spy();
        props.setNextDisabled = new sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setState({mode: 'NOT_NORMAL'})
        const clearSpy = new sinon.spy(utils, 'clearDraw');
        wrapper.instance().showInvalidDrawWarning = new sinon.spy();
        wrapper.instance().updateMode = new sinon.spy();
        wrapper.instance().handleCancel();
        expect(wrapper.instance().showInvalidDrawWarning.calledOnce).toBe(true);
        expect(wrapper.instance().updateMode.calledOnce).toBe(true);
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
        const props = getProps();
        const wrapper = getWrapper(props);
        const layerSpy = new sinon.spy(utils, 'generateDrawLayer');
        const boxSpy = new sinon.spy(utils, 'generateDrawBoxInteraction');
        const freeSpy = new sinon.spy(utils, 'generateDrawFreeInteraction');
        const mapSpy = new sinon.spy(ol, 'Map');
        const addInteractionSpy = new sinon.spy(ol.Map.prototype, 'addInteraction');
        const addLayerSpy = new sinon.spy(ol.Map.prototype, 'addLayer');
        wrapper.instance().initializeOpenLayers();
        expect(layerSpy.calledTwice).toBe(true);
        expect(boxSpy.calledOnce).toBe(true);
        expect(freeSpy.calledOnce).toBe(true);
        expect(mapSpy.calledOnce).toBe(true);
        expect(addInteractionSpy.calledThrice).toBe(true);
        expect(addLayerSpy.calledTwice).toBe(true);
        layerSpy.restore();
        boxSpy.restore();
        freeSpy.restore();
        mapSpy.restore();
        addInteractionSpy.restore();
        addLayerSpy.restore();
    });

    it('upEvent should return false if there is no feature', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.instance().upEvent({})).toBe(false);
    });

    it('upEvent should check for a feature then updateAOI info if its a valid box', () => {
        const props = getProps();
        const feature = new ol.Feature({
            geometry: new ol.geom.Polygon(
                [[
                    [100.0, 0.0], 
                    [101.0, 0.0], 
                    [101.0, 1.0],
                    [100.0, 1.0], 
                    [100.0, 0.0]
                ]]
            )
        });
        const geojson = utils.createGeoJSON(feature.getGeometry());
        const unwrapStub = new sinon.stub(utils, 'unwrapCoordinates')
            .callsFake((coords) => {return coords});
        const setSpy = new sinon.spy(ol.geom.Polygon.prototype, 'setCoordinates');
        const createSpy = new sinon.spy(utils, 'createGeoJSON');
        const validStub = new sinon.stub(utils, 'isGeoJSONValid')
            .callsFake(() => {return true});
        const boxStub = new sinon.stub(utils, 'isBox')
            .callsFake(() => {return true});
        const warningSpy = new sinon.stub(ExportAOI.prototype, 'showInvalidDrawWarning');
        props.updateAoiInfo = new sinon.spy();
        props.setNextEnabled = new sinon.spy();

        const wrapper = getWrapper(props);
        wrapper.instance().feature = feature;
        const ret = wrapper.instance().upEvent({});
        expect(ret).toBe(false);
        expect(unwrapStub.calledOnce).toBe(true);
        expect(setSpy.calledOnce).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(validStub.calledOnce).toBe(true);
        expect(boxStub.calledOnce).toBe(true);
        expect(props.updateAoiInfo.calledOnce).toBe(true);
        expect(props.updateAoiInfo.calledWith(geojson, 'Polygon', 'Custom Polygon', 'Box', 'box')).toBe(true);
        expect(warningSpy.calledOnce).toBe(true);
        expect(warningSpy.calledWith(false)).toBe(true);
        expect(props.setNextEnabled.calledOnce).toBe(true);

        unwrapStub.restore();
        setSpy.restore();
        createSpy.restore();
        validStub.restore();
        boxStub.restore();
        warningSpy.restore();
    });

    it('upEvent should check for a feature then updateAOI info if its a valid polygon (but not a box)', () => {
        const props = getProps();
        const feature = new ol.Feature({
            geometry: new ol.geom.Polygon(
                [[
                    [100.0, 0.0], 
                    [101.0, 0.0], 
                    [103.0, 1.0],
                    [100.0, 1.0], 
                    [100.0, 0.0]
                ]]
            )
        });
        const geojson = utils.createGeoJSON(feature.getGeometry());
        const unwrapStub = new sinon.stub(utils, 'unwrapCoordinates')
            .callsFake((coords) => {return coords});
        const setSpy = new sinon.spy(ol.geom.Polygon.prototype, 'setCoordinates');
        const createSpy = new sinon.spy(utils, 'createGeoJSON');
        const validStub = new sinon.stub(utils, 'isGeoJSONValid')
            .callsFake(() => {return true});
        const boxStub = new sinon.stub(utils, 'isBox')
            .callsFake(() => {return false});
        const warningSpy = new sinon.stub(ExportAOI.prototype, 'showInvalidDrawWarning');
        props.updateAoiInfo = new sinon.spy();
        props.setNextEnabled = new sinon.spy();

        const wrapper = getWrapper(props);
        wrapper.instance().feature = feature;
        const ret = wrapper.instance().upEvent({});
        expect(ret).toBe(false);
        expect(unwrapStub.calledOnce).toBe(true);
        expect(setSpy.calledOnce).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(validStub.calledOnce).toBe(true);
        expect(boxStub.calledOnce).toBe(true);
        expect(props.updateAoiInfo.calledOnce).toBe(true);
        expect(props.updateAoiInfo.calledWith(geojson, 'Polygon', 'Custom Polygon', 'Draw', 'free')).toBe(true);
        expect(warningSpy.calledOnce).toBe(true);
        expect(warningSpy.calledWith(false)).toBe(true);
        expect(props.setNextEnabled.calledOnce).toBe(true);

        unwrapStub.restore();
        setSpy.restore();
        createSpy.restore();
        validStub.restore();
        boxStub.restore();
        warningSpy.restore();
    });

    it('upEvent should display the invalid draw warning)', () => {
        const props = getProps();
        const feature = new ol.Feature({
            geometry: new ol.geom.Polygon(
                [[
                    [100.0, 0.0], 
                    [101.0, 0.0], 
                    [103.0, 1.0],
                    [100.0, 1.0], 
                    [100.0, 0.0]
                ]]
            )
        });
        const unwrapStub = new sinon.stub(utils, 'unwrapCoordinates')
            .callsFake((coords) => {return coords});
        const validStub = new sinon.stub(utils, 'isGeoJSONValid')
            .callsFake(() => {return false});
        const warningSpy = new sinon.stub(ExportAOI.prototype, 'showInvalidDrawWarning');
        props.updateAoiInfo = new sinon.spy();
        props.setNextDisabled = new sinon.spy();

        const wrapper = getWrapper(props);
        wrapper.instance().feature = feature;
        const ret = wrapper.instance().upEvent({});
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
        const props = getProps();
        const feature = new ol.Feature({
            geometry: new ol.geom.Polygon(
                [[
                    [100.0, 0.0], 
                    [101.0, 0.0], 
                    [101.0, 1.0],
                    [100.0, 1.0], 
                    [100.0, 0.0]
                ]]
            )
        });
        const coord = [101.0, 1.0]
        const eventCoord = [103.0, 1.0];
        const evt = {coordinate: eventCoord};
        const boxStub = new sinon.stub(utils, 'isBox').returns(true);
        const clearStub = new sinon.stub(utils, 'clearDraw');
        const addStub = new sinon.stub(ol.source.Vector.prototype, 'addFeature');

        const wrapper = getWrapper(props);
        wrapper.instance().coordinate = coord;
        wrapper.instance().feature = feature;
        const ret = wrapper.instance().dragEvent(evt);
        expect(ret).toBe(true);
        expect(boxStub.calledOnce).toBe(true);
        expect(clearStub.calledOnce).toBe(true);
        expect(addStub.calledOnce).toBe(true);
        expect(wrapper.instance().coordinate).toEqual([103.0, 1.0]);
        expect(wrapper.instance().feature.getGeometry().getCoordinates())
            .toEqual([[
                [100.0, 0.0], 
                [103.0, 0.0], 
                [103.0, 1.0],
                [100.0, 1.0], 
                [100.0, 0.0]
            ]]);

        boxStub.restore();
        clearStub.restore();
        addStub.restore();
    });

    it('dragEvent should transform a polygon and update its coordinates then move the vertex marker', () => {
        const props = getProps();
        const feature = new ol.Feature({
            geometry: new ol.geom.Polygon(
                [[
                    [100.0, 0.0], 
                    [101.0, 0.0], 
                    [103.0, 1.0],
                    [100.0, 1.0], 
                    [100.0, 0.0]
                ]]
            )
        });
        const coord = [103.0, 1.0]
        const eventCoord = [109.0, 1.0];
        const evt = {coordinate: eventCoord};
        const boxStub = new sinon.stub(utils, 'isBox').returns(false);
        const clearStub = new sinon.stub(utils, 'clearDraw');
        const addStub = new sinon.stub(ol.source.Vector.prototype, 'addFeature');

        const wrapper = getWrapper(props);
        wrapper.instance().coordinate = coord;
        wrapper.instance().feature = feature;
        const ret = wrapper.instance().dragEvent(evt);
        expect(ret).toBe(true);
        expect(boxStub.calledOnce).toBe(true);
        expect(clearStub.calledOnce).toBe(true);
        expect(addStub.calledOnce).toBe(true);
        expect(wrapper.instance().coordinate).toEqual([109.0, 1.0]);
        expect(wrapper.instance().feature.getGeometry().getCoordinates())
            .toEqual([[
                [100.0, 0.0], 
                [101.0, 0.0], 
                [109.0, 1.0],
                [100.0, 1.0], 
                [100.0, 0.0]
            ]]);

        boxStub.restore();
        clearStub.restore();
        addStub.restore();
    });

    it('dragEvent return false if updated feature has no area', () => {
        const props = getProps();
        const feature = new ol.Feature({
            geometry: new ol.geom.Polygon(
                [[
                    [100.0, 0.0], 
                    [101.0, 0.0], 
                    [101.0, 1.0],
                    [100.0, 1.0], 
                    [100.0, 0.0]
                ]]
            )
        });
        const coord = [101.0, 1.0]
        const eventCoord = [100.0, 0.0];
        const evt = {coordinate: eventCoord};
        const boxStub = new sinon.stub(utils, 'isBox').returns(true);
        const clearStub = new sinon.stub(utils, 'clearDraw');
        const addStub = new sinon.stub(ol.source.Vector.prototype, 'addFeature');

        const wrapper = getWrapper(props);
        wrapper.instance().coordinate = coord;
        wrapper.instance().feature = feature;
        const ret = wrapper.instance().dragEvent(evt);
        expect(ret).toBe(false);
        expect(boxStub.calledOnce).toBe(true);
        expect(clearStub.called).toBe(false);
        expect(addStub.called).toBe(false);
        expect(wrapper.instance().coordinate).toEqual([101.0, 1.0]);
        expect(wrapper.instance().feature.getGeometry().getCoordinates())
            .toEqual([[
                [100.0, 0.0], 
                [101.0, 0.0], 
                [101.0, 1.0],
                [100.0, 1.0], 
                [100.0, 0.0]
            ]]);

        boxStub.restore();
        clearStub.restore();
        addStub.restore();
    });

    it('moveEvent should add a marker feature to the map', () => {
        const props = getProps();
        const feature = new ol.Feature({
            geometry: new ol.geom.Polygon(
                [[
                    [100.0, 0.0], 
                    [101.0, 0.0], 
                    [101.0, 1.0],
                    [100.0, 1.0], 
                    [100.0, 0.0]
                ]]
            )
        });
        const hasFeatureStub = new sinon.stub(ol.Map.prototype, 'hasFeatureAtPixel')
            .returns(true);
        const getFeaturesStub = new sinon.stub(ol.Map.prototype, 'getFeaturesAtPixel')
            .returns([feature]);
        const vertexStub = new sinon.stub(utils, 'isVertex')
            .returns([100.0, 0.0]);
        const viewStub = new sinon.stub(utils, 'isViewOutsideValidExtent')
            .returns(false);
        const addStub = new sinon.stub(ol.source.Vector.prototype, 'addFeature');

        const wrapper = getWrapper(props);
        const evt = {pixel: [1,1], map: wrapper.instance().map}
        wrapper.instance().moveEvent(evt);
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
        const props = getProps();
        const feature = new ol.Feature({
            geometry: new ol.geom.Polygon(
                [[
                    [100.0, 0.0], 
                    [101.0, 0.0], 
                    [101.0, 1.0],
                    [100.0, 1.0], 
                    [100.0, 0.0]
                ]]
            )
        });
        const hasFeatureStub = new sinon.stub(ol.Map.prototype, 'hasFeatureAtPixel')
            .returns(true);
        const getFeaturesStub = new sinon.stub(ol.Map.prototype, 'getFeaturesAtPixel')
            .returns([feature]);
        const vertexStub = new sinon.stub(utils, 'isVertex')
            .returns(false);
        const viewStub = new sinon.stub(utils, 'isViewOutsideValidExtent')
            .returns(false);
        const addStub = new sinon.stub(ol.source.Vector.prototype, 'addFeature');

        const wrapper = getWrapper(props);
        const evt = {pixel: [1,1], map: wrapper.instance().map}
        wrapper.instance().moveEvent(evt);
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
        const props = getProps();
        const feature = new ol.Feature({
            geometry: new ol.geom.Polygon(
                [[
                    [100.0, 0.0], 
                    [101.0, 0.0], 
                    [101.0, 1.0],
                    [100.0, 1.0], 
                    [100.0, 0.0]
                ]]
            )
        });
        const hasFeatureStub = new sinon.stub(ol.Map.prototype, 'hasFeatureAtPixel')
            .returns(true);
        const getFeaturesStub = new sinon.stub(ol.Map.prototype, 'getFeaturesAtPixel')
            .returns([feature]);
        const viewStub = new sinon.stub(utils, 'isViewOutsideValidExtent')
            .returns(true);
        const goToStub = new sinon.stub(utils, 'goToValidExtent');
        const vertexStub = new sinon.stub(utils, 'isVertex')
            .returns(false);

        const wrapper = getWrapper(props);
        const evt = {pixel: [1,1], map: wrapper.instance().map}
        wrapper.instance().moveEvent(evt);
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
        const props = getProps();
        const feature = new ol.Feature({
            geometry: new ol.geom.Point([100.0, 0.0])
        });
        const hasFeatureStub = new sinon.stub(ol.Map.prototype, 'hasFeatureAtPixel')
            .returns(false);
        const clearStub = new sinon.stub(utils, 'clearDraw');

        const wrapper = getWrapper(props);
        wrapper.instance().markerLayer.getSource().addFeature(feature);
        const evt = {pixel: [1,1], map: wrapper.instance().map}
        wrapper.instance().moveEvent(evt);
        expect(clearStub.calledOnce).toBe(true);
        expect(hasFeatureStub.calledOnce).toBe(true);

        hasFeatureStub.restore();
        clearStub.restore();
    });

    it('moveEvent should skip features that are not polygons', () => {
        const props = getProps();
        const feature = new ol.Feature({
            geometry: new ol.geom.Point([100.0, 0.0])
        });
        const hasFeatureStub = new sinon.stub(ol.Map.prototype, 'hasFeatureAtPixel')
            .returns(true);
        const getFeaturesStub = new sinon.stub(ol.Map.prototype, 'getFeaturesAtPixel')
            .returns([feature]);
        const vertexStub = new sinon.stub(utils, 'isVertex');
        const viewStub = new sinon.stub(utils, 'isViewOutsideValidExtent')
            .returns(false);

        const wrapper = getWrapper(props);
        const evt = {pixel: [1,1], map: wrapper.instance().map}
        wrapper.instance().moveEvent(evt);
        expect(hasFeatureStub.calledOnce).toBe(true);
        expect(getFeaturesStub.calledOnce).toBe(true);
        expect(vertexStub.called).toBe(false);

        hasFeatureStub.restore();
        getFeaturesStub.restore();
        vertexStub.restore();
        viewStub.restore();
    });

    it('downEvent should check if there is a feature at the target pixel and return true', () => {
        const props = getProps();
        const feature = new ol.Feature({
            geometry: new ol.geom.Polygon(
                [[
                    [100.0, 0.0], 
                    [101.0, 0.0], 
                    [101.0, 1.0],
                    [100.0, 1.0], 
                    [100.0, 0.0]
                ]]
            )
        });
        const hasFeatureStub = new sinon.stub(ol.Map.prototype, 'hasFeatureAtPixel')
            .returns(true);
        const getFeaturesStub = new sinon.stub(ol.Map.prototype, 'getFeaturesAtPixel')
            .returns([feature]);
        const vertexStub = new sinon.stub(utils, 'isVertex')
            .returns([100.0, 0.0]);
        
        const wrapper = getWrapper(props);
        const evt = {pixel: [1,1], map: wrapper.instance().map};
        const ret = wrapper.instance().downEvent(evt);
        expect(ret).toBe(true);
        expect(wrapper.instance().feature).toBe(feature);
        expect(wrapper.instance().coordinate).toEqual([100.0, 0.0]);

        hasFeatureStub.restore();
        getFeaturesStub.restore();
        vertexStub.restore();
    });

    it('downEvent should return false if map has no feature at pixel', () => {
        const props = getProps();
        const hasFeatureStub = new sinon.stub(ol.Map.prototype, 'hasFeatureAtPixel')
            .returns(false);
        const wrapper = getWrapper(props);
        const evt = {pixel: [1,1], map: wrapper.instance().map};
        const ret = wrapper.instance().downEvent(evt);
        expect(ret).toBe(false);
        hasFeatureStub.restore();
    });

    it('downEvent should return false if feature is not a polygon', () => {
        const props = getProps();
        const feature = new ol.Feature({
            geometry: new ol.geom.Point([1,1])
        });
        const hasFeatureStub = new sinon.stub(ol.Map.prototype, 'hasFeatureAtPixel')
            .returns(true);
        const getFeaturesStub = new sinon.stub(ol.Map.prototype, 'getFeaturesAtPixel')
            .returns([feature]);
        const wrapper = getWrapper(props);
        const evt = {pixel: [1,1], map: wrapper.instance().map};
        const ret = wrapper.instance().downEvent(evt);
        expect(ret).toBe(false);
        hasFeatureStub.restore();
        getFeaturesStub.restore();
    });

    it('downEvent should return false if it is not a vertex', () => {
        const props = getProps();
        const feature = new ol.Feature({
            geometry: new ol.geom.Polygon(
                [[
                    [100.0, 0.0], 
                    [101.0, 0.0], 
                    [101.0, 1.0],
                    [100.0, 1.0], 
                    [100.0, 0.0]
                ]]
            )
        });
        const hasFeatureStub = new sinon.stub(ol.Map.prototype, 'hasFeatureAtPixel')
            .returns(true);
        const getFeaturesStub = new sinon.stub(ol.Map.prototype, 'getFeaturesAtPixel')
            .returns([feature]);
        const vertexStub = new sinon.stub(utils, 'isVertex').returns(false);
        const wrapper = getWrapper(props);
        const evt = {pixel: [1,1], map: wrapper.instance().map};
        const ret = wrapper.instance().downEvent(evt);
        expect(ret).toBe(false);
        hasFeatureStub.restore();
        getFeaturesStub.restore();
        vertexStub.restore();
    });

    it('handleZoomToSelection should read in a geojson then zoom to the geom', () => {
        const props = getProps();
        props.aoiInfo.geojson = geojson;
        const wrapper = getWrapper(props);
        const readSpy = new sinon.spy(ol.format.GeoJSON.prototype, 'readGeometry');
        const zoomSpy = new sinon.spy(utils, 'zoomToGeometry');
        wrapper.instance().handleZoomToSelection();
        expect(readSpy.calledOnce).toBe(true);
        expect(readSpy.calledWith(geojson.features[0].geometry)).toBe(true);
        expect(zoomSpy.calledOnce).toBe(true);
        readSpy.restore();
        zoomSpy.restore();
    });
});
