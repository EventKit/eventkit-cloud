import React from 'react';
import sinon from 'sinon';
import {mount, shallow} from 'enzyme';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {GridList} from 'material-ui/GridList'
import DataPackListItem from '../../components/DataPackPage/DataPackListItem';
import LoadButtons from '../../components/DataPackPage/LoadButtons';
import MapPopup from '../../components/DataPackPage/MapPopup';
import CustomScrollbar from '../../components/CustomScrollbar';
import ol from 'openlayers';
import isEqual from 'lodash/isEqual';
import css from '../../styles/ol3map.css';
import {Card, CardHeader, CardTitle, CardActions} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';
import SearchAOIToolbar from '../../components/MapTools/SearchAOIToolbar.js';
import DrawAOIToolbar from '../../components/MapTools/DrawAOIToolbar.js';
import InvalidDrawWarning from '../../components/MapTools/InvalidDrawWarning.js';
import DropZone from '../../components/MapTools/DropZone.js';
import * as utils from '../../utils/mapUtils';

import MapView, {RED_STYLE, BLUE_STYLE} from '../../components/DataPackPage/MapView';

// this polyfills requestAnimationFrame in the test browser, required for ol3
import raf from 'raf';
raf.polyfill();

describe('MapView component', () => {
    injectTapEventPlugin();
    const muiTheme = getMuiTheme();
    const getProps = () => {
        return {
            runs: getRuns(),
            user: {data: {user: {username: 'admin'}}},
            onRunDelete: () => {},
            range: '12/24',
            handleLoadLess: () => {},
            handleLoadMore: () => {},
            loadLessDisabled: true,
            loadMoreDisabled: false,
            geocode: {},
            getGeocode: () => {},
            importGeom: {},
            processGeoJSONFile: () => {},
            resetGeoJSONFile: () => {},
            onMapFilter: () => {}
        }
    };

    const getWrapper = (props) => {
        return mount(<MapView {...props}/>, {
            context: {muiTheme},
            childContextTypes: {muiTheme: React.PropTypes.object}
        });
    }

    const initOverlay = MapView.prototype.initOverlay;
    beforeEach(() => {
        MapView.prototype.initOverlay = new sinon.spy();
        const stub1 = new sinon.stub(utils, 'generateDrawBoxInteraction', () => {return {on: () => {}, setActive: () => {}}})
        const stub2 = new sinon.stub(utils, 'generateDrawFreeInteraction', () => {return {on: () => {}, setActive: () => {}}})
        ol.Map.prototype.addInteraction = new sinon.spy()
    });

    afterEach(() => {
        MapView.prototype.initOverlay = initOverlay;
        utils.generateDrawBoxInteraction.restore();
        utils.generateDrawFreeInteraction.restore();
    });

    it('should render all the basic components', () => {        
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(CustomScrollbar)).toHaveLength(1);
        expect(wrapper.find(GridList)).toHaveLength(1);
        expect(wrapper.find(LoadButtons)).toHaveLength(1);
        expect(wrapper.find(DataPackListItem)).toHaveLength(props.runs.length);
        expect(wrapper.find('#map')).toHaveLength(1);
        expect(wrapper.find(SearchAOIToolbar)).toHaveLength(1);
        expect(wrapper.find(DrawAOIToolbar)).toHaveLength(1);
        expect(wrapper.find(InvalidDrawWarning)).toHaveLength(1);
        expect(wrapper.find(DropZone)).toHaveLength(1);
        expect(wrapper.find('#popup')).toHaveLength(1);
        expect(wrapper.find('#popup-closer')).toHaveLength(1);
        expect(wrapper.find('#popup-content')).toHaveLength(1);
        // feature info popup should not be visible by default
        expect(wrapper.find(MapPopup)).toHaveLength(0);
    });

    it('should display the feature info popup', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.find(MapPopup)).toHaveLength(0);
        wrapper.setState({showPopup: true, selectedFeature: props.runs[0].uid});
        expect(wrapper.find(MapPopup)).toHaveLength(1);
    });

    it('should create map, overlay, source, layer, add features, fit view, and register listener on mount', () => {
        // create a whole lot of spies/mocked functions
        const mountSpy = new sinon.spy(MapView.prototype, 'componentDidMount');
        const mapSpy = new sinon.spy(MapView.prototype, 'initMap');
        const sourceSpy = new sinon.spy(ol.source, 'Vector');
        ol.source.Vector.prototype.getExtent = () => {return [-20, -20, 20, 20]}
        const layerSpy = new sinon.spy(ol.layer, 'Vector');
        const addLayerSpy = new sinon.spy(ol.Map.prototype, 'addLayer');
        const addRunFeatures = MapView.prototype.addRunFeatures;
        MapView.prototype.addRunFeatures = new sinon.spy();
        const getViewSpy = new sinon.spy(ol.Map.prototype, 'getView');
        const fitSpy = new sinon.spy(ol.View.prototype, 'fit');
        const onSpy = new sinon.spy(ol.Map.prototype, 'on');
        
        // check that expected function calls were made
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(mountSpy.calledOnce).toBe(true);
        expect(mapSpy.calledOnce).toBe(true);
        expect(MapView.prototype.initOverlay.calledOnce).toBe(true);
        expect(sourceSpy.calledTwice).toBe(true);
        expect(sourceSpy.calledWith({wrapX: false})).toBe(true);
        expect(layerSpy.calledTwice).toBe(true);
        expect(layerSpy.calledWith(
            {source: wrapper.instance().source, style: BLUE_STYLE}
        )).toBe(true);
        expect(addLayerSpy.calledTwice).toBe(true);
        expect(addLayerSpy.calledWith(wrapper.instance().layer)).toBe(true);
        expect(addLayerSpy.calledWith(wrapper.instance().drawLayer)).toBe(true);
        expect(MapView.prototype.addRunFeatures.calledOnce).toBe(true);
        expect(MapView.prototype.addRunFeatures.calledWith(props.runs, wrapper.instance().source)).toBe(true);
        expect(getViewSpy.calledOnce).toBe(true);
        expect(fitSpy.calledOnce).toBe(true);
        expect(fitSpy.calledWith(wrapper.instance().source.getExtent(), wrapper.instance().map.getSize())).toBe(true);
        expect(onSpy.calledOnce).toBe(true);
        expect(onSpy.calledWith('singleclick', wrapper.instance().onMapClick)).toBe(true);
        
        // restore all the spys
        mountSpy.restore();
        mapSpy.restore();
        sourceSpy.restore();
        layerSpy.restore();
        addLayerSpy.restore();
        getViewSpy.restore();
        fitSpy.restore();
        onSpy.restore();
        MapView.prototype.addRunFeatures = addRunFeatures;
    });

    it('should clear the source, re-add features, and fit view when new features are received', () => {
        const props = getProps();
        const receiveSpy = new sinon.spy(MapView.prototype, 'componentWillReceiveProps');
        const wrapper = getWrapper(props);
        const clearSpy = new sinon.spy(ol.source.Vector.prototype, 'clear');
        const addRunSpy = new sinon.spy(wrapper.instance(), 'addRunFeatures');
        const getViewSpy = new sinon.spy(ol.Map.prototype, 'getView');
        const fitSpy = new sinon.spy(ol.View.prototype, 'fit');
        wrapper.instance().drawLayer = {
            getSource: () => {
                return {
                    getFeatures: () => {return {length:1}}, 
                    getExtent: () => {return [-1, -1, 1, 1]}
                }
            }
        }
        
        expect(receiveSpy.notCalled).toBe(true);
        let nextProps = getProps();
        let run = {...getRuns()[0]};
        run.uid = '123456789';
        nextProps.runs.push(run);
        wrapper.setProps({...nextProps});
        expect(receiveSpy.calledOnce).toBe(true);
        expect(clearSpy.calledOnce).toBe(true);
        expect(addRunSpy.calledOnce).toBe(true);
        expect(addRunSpy.calledWith(nextProps.runs, wrapper.instance().source)).toBe(true);
        expect(getViewSpy.calledOnce).toBe(true);
        expect(fitSpy.calledOnce).toBe(true);
        expect(fitSpy.calledWith(wrapper.instance().source.getExtent(), wrapper.instance().map.getSize()));
        receiveSpy.restore();
        clearSpy.restore();
        addRunSpy.restore();
        getViewSpy.restore();
        fitSpy.restore();
    });

    it('should update map size when component updates', () => {
        const updateSpy = new sinon.spy(MapView.prototype, 'componentDidUpdate');
        const mapUpdateSpy = new sinon.spy(ol.Map.prototype, 'updateSize');
        const props = getProps();
        const wrapper = getWrapper(props);
        const updates = updateSpy.args.length;
        const mapUpdate = mapUpdateSpy.args.length;
        wrapper.update();
        expect(updateSpy.args.length).toEqual(updates + 1);
        expect(mapUpdateSpy.args.length).toEqual(mapUpdate + 1);
        updateSpy.restore();
        mapUpdateSpy.restore();
    });

    it('addRunFeatures should read in geom from each run and add it to the source', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const readerSpy = new sinon.spy(ol.format.GeoJSON.prototype, 'readFeature');
        const idSpy = new sinon.spy(ol.Feature.prototype, 'setId');
        const propSpy = new sinon.spy(ol.Feature.prototype, 'setProperties');
        const addSpy = new sinon.spy(ol.source.Vector.prototype, 'addFeatures');
        const source = new ol.source.Vector({wrapX: false});
        wrapper.instance().addRunFeatures(props.runs, source);
        expect(readerSpy.callCount).toEqual(props.runs.length);
        expect(idSpy.callCount).toEqual(props.runs.length);
        expect(propSpy.callCount).toEqual(props.runs.length);
        props.runs.forEach((run) => {
            expect(readerSpy.calledWith(run.job.extent, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
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

    it('initMap should return a map with controls, interactions, and view', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const inheritSpy = new sinon.spy(ol, 'inherits');
        const mapSpy = new sinon.spy(ol, 'Map');
        const attributeSpy = new sinon.spy(ol.control, 'Attribution');
        const zoomSpy = new sinon.spy(ol.control, 'Zoom');
        const overviewSpy = new sinon.spy(ol.control, 'OverviewMap');
        const interactionSpy = new sinon.spy(ol.interaction, 'defaults');
        const layerSpy = new sinon.spy(ol.layer, 'Tile');
        const osmSpy = new sinon.spy(ol.source, 'OSM');
        const viewSpy = new sinon.spy(ol, 'View');
        expect(inheritSpy.notCalled).toBe(true);
        wrapper.instance().initMap();
        expect(inheritSpy.calledOnce).toBe(true);
        expect(inheritSpy.calledWith(utils.zoomToExtent, ol.control.Control)).toBe(true);
        expect(mapSpy.calledOnce).toBe(true);
        expect(attributeSpy.calledOnce).toBe(true);
        expect(zoomSpy.calledOnce).toBe(true);
        expect(overviewSpy.calledOnce).toBe(true);
        expect(interactionSpy.calledOnce).toBe(true);
        expect(layerSpy.calledOnce).toBe(true);
        expect(osmSpy.calledOnce).toBe(true);
        expect(viewSpy.calledOnce).toBe(true);
        inheritSpy.restore();
        mapSpy.restore();
        attributeSpy.restore();
        zoomSpy.restore();
        interactionSpy.restore();
        layerSpy.restore();
        osmSpy.restore();
        viewSpy.restore();
    });

    it('initOverlay should create an overlay for in map popups', () => {
        MapView.prototype.initOverlay = initOverlay;
        const overlaySpy = new sinon.spy(ol, 'Overlay');
        const stub = sinon.stub(document, 'getElementById');
        const div = document.createElement('div');
        const a = document.createElement('a');
        stub.withArgs('popup').returns(div);
        stub.withArgs('popup-closer').returns(a);
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.instance().map.addOverlay = new sinon.spy();
        wrapper.instance().initOverlay();
        expect(stub.calledWith('popup')).toBe(true);
        expect(stub.calledWith('popup-content')).toBe(true);
        expect(stub.calledWith('popup-closer')).toBe(true);
        expect(overlaySpy.calledWith({
            element: div,
            autoPan: true,
            autoPanAnimation: {
                duration: 250
            },
            stopEvent: false
        })).toBe(true);
        expect(wrapper.instance().closer.onclick).toEqual(wrapper.instance().handleOlPopupClose);
        expect((wrapper.instance().map.addOverlay.calledOnce)).toBe(true);
        stub.restore();
    });

    it('handleOlPopupClose should call setPosition on overlay and blur on closer', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const setSpy = new sinon.spy();
        const blurSpy = new sinon.spy();
        wrapper.instance().overlay = {setPosition: setSpy};
        wrapper.instance().closer = {blur: blurSpy};
        wrapper.instance().handleOlPopupClose();
        expect(setSpy.calledOnce).toBe(true);
        expect(setSpy.calledWith(undefined)).toBe(true);
        expect(blurSpy.calledOnce).toBe(true);
    });

    it('handleClick should return false if there is no runId or feature associated with runId', () => {
        const getSpy = new sinon.spy(ol.source.Vector.prototype, 'getFeatureById');
        const props = getProps();
        const wrapper = getWrapper(props);
        expect(wrapper.instance().handleClick()).toBe(false);
        expect(getSpy.notCalled).toBe(true);
        expect(wrapper.instance().handleClick('22222')).toBe(false);
        expect(getSpy.calledOnce).toBe(true);
        getSpy.restore();
    });

    it('handleClick should deselect feature if its already clicked', () => {
        const stateSpy = new sinon.spy(MapView.prototype, 'setState');
        const deselectSpy = new sinon.spy(MapView.prototype, 'setFeatureNotSelected');
        const feature = new ol.Feature({
            geometry: new ol.geom.Point([-10, 10])
        });
        feature.setId('12345');
        feature.setStyle(RED_STYLE);
        feature.setProperties({name: 'name', event: 'event', job: {uid: '12345'}});
        const props = getProps();
        const wrapper = getWrapper(props);
        const stub = new sinon.stub(wrapper.instance().source, 'getFeatureById');
        stub.withArgs('12345').returns(feature);
        wrapper.setState({selectedFeature: '12345'});
        expect(wrapper.instance().handleClick('12345')).toBe(true);
        expect(stateSpy.calledWith({showPopup: false})).toBe(true);
        expect(deselectSpy.calledOnce).toBe(true);
        expect(deselectSpy.calledWith(feature)).toBe(true);
        expect(stateSpy.calledWith({selectedFeature: null})).toBe(true);
        stateSpy.restore();
        deselectSpy.restore();
    });

    it('handleClick should center on feature', () => {
        const stateSpy = new sinon.spy(MapView.prototype, 'setState');
        const deselectSpy = new sinon.spy(MapView.prototype, 'setFeatureNotSelected');
        const selectSpy = new sinon.spy(MapView.prototype, 'setFeatureSelected');
        const setCenterSpy = new sinon.spy(ol.View.prototype, 'setCenter');
        const newFeature = new ol.Feature({
            geometry: new ol.geom.Point([-10, 10])
        });
        newFeature.setId('12345');
        newFeature.setStyle(BLUE_STYLE);
        newFeature.setProperties({name: 'feature name', event: 'feature event', job: {uid: '12345'}});
        const oldFeature = new ol.Feature();
        oldFeature.setId('56789');
        oldFeature.setStyle(RED_STYLE);
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.instance().map.getView().fit([-500,-300,-400,-200])
        const stub = new sinon.stub(wrapper.instance().source, 'getFeatureById');
        stub.withArgs('12345').returns(newFeature);
        stub.withArgs('56789').returns(oldFeature);
        wrapper.setState({selectedFeature: '56789'});
        expect(wrapper.instance().handleClick('12345')).toBe(true);
        expect(stateSpy.calledWith({showPopup: false}));
        expect(deselectSpy.calledOnce).toBe(true);
        expect(deselectSpy.calledWith(oldFeature)).toBe(true);
        expect(selectSpy.calledOnce).toBe(true);
        expect(selectSpy.calledWith(newFeature)).toBe(true);
        expect(stateSpy.calledWith({selectedFeature: newFeature.getId(), showPopup: true})).toBe(true);
        expect(setCenterSpy.calledOnce).toBe(true);
        stateSpy.restore();
        deselectSpy.restore();
        selectSpy.restore();
        setCenterSpy.restore();
    });

    it('handleClick should trigger an animation', () => {
        const stateSpy = new sinon.spy(MapView.prototype, 'setState');
        const deselectSpy = new sinon.spy(MapView.prototype, 'setFeatureNotSelected');
        const selectSpy = new sinon.spy(MapView.prototype, 'setFeatureSelected');
        const setCenterSpy = new sinon.spy(ol.View.prototype, 'setCenter');
        const newFeature = new ol.Feature({
            geometry: new ol.geom.Point([-1, 1])
        });
        newFeature.setId('12345');
        newFeature.setStyle(BLUE_STYLE);
        newFeature.setProperties({name: 'feature name', event: 'feature event', job: {uid: '12345'}});
        const oldFeature = new ol.Feature();
        oldFeature.setId('56789');
        oldFeature.setStyle(RED_STYLE);
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.instance().map.render = new sinon.spy();
        const stub = new sinon.stub(wrapper.instance().source, 'getFeatureById');
        stub.withArgs('12345').returns(newFeature);
        stub.withArgs('56789').returns(oldFeature);
        wrapper.setState({selectedFeature: '56789'});
        wrapper.instance().handleClick('12345');
        expect(stateSpy.calledWith({showPopup: false}));
        expect(deselectSpy.calledOnce).toBe(true);
        expect(deselectSpy.calledWith(oldFeature)).toBe(true);
        expect(selectSpy.calledOnce).toBe(true);
        expect(selectSpy.calledWith(newFeature)).toBe(true);
        expect(stateSpy.calledWith({selectedFeature: newFeature.getId(), showPopup: true})).toBe(true);
        expect(setCenterSpy.notCalled).toBe(true);
        expect(wrapper.instance().map.render.calledOnce).toBe(true);
        stateSpy.restore();
        deselectSpy.restore();
        selectSpy.restore();
        setCenterSpy.restore();
    });

    it('handleClick should remove listener and set to null', () => {
        const unSpy = new sinon.spy(ol.Observable, 'unByKey');
        const newFeature = new ol.Feature({
            geometry: new ol.geom.Point([-1, 1])
        });
        newFeature.setId('12345');
        newFeature.setStyle(BLUE_STYLE);
        newFeature.setProperties({name: 'feature name', event: 'feature event', job: {uid: '12345'}});
        const oldFeature = new ol.Feature();
        oldFeature.setId('56789');
        oldFeature.setStyle(RED_STYLE);
        const props = getProps();
        const wrapper = getWrapper(props);
        wrapper.instance().map.render = new sinon.spy();
        const stub = new sinon.stub(wrapper.instance().source, 'getFeatureById');
        stub.withArgs('12345').returns(newFeature);
        stub.withArgs('56789').returns(oldFeature);
        const listener = () => {};
        wrapper.instance().listener = listener
        wrapper.setState({selectedFeature: '56789'});
        wrapper.instance().handleClick('12345');
        expect(unSpy.calledOnce).toBe(true);
        expect(unSpy.calledWith(listener)).toBe(true);
        expect(wrapper.instance().listener).not.toEqual(listener);
        expect(wrapper.instance().map.render.calledOnce).toBe(true);
        unSpy.restore();
    });

    it('animate should render a geom for animation', () => {
        const Circle = ol.style.Circle;
        ol.style.Circle = new sinon.spy();
        const styleSpy = new sinon.spy(ol.style, 'Style');
        const maxSpy = new sinon.spy(Math, 'max');
        const unSpy = new sinon.spy(ol.Observable, 'unByKey');
        const renderSpy = new sinon.spy(ol.Map.prototype, 'render');
        const props = getProps();
        const wrapper = getWrapper(props);
        const setStyleSpy = new sinon.spy();
        const geomSpy = new sinon.spy();
        const event = {vectorContext: {setStyle: setStyleSpy, drawGeometry: geomSpy}, frameState: {time: 500}}
        const geom = new ol.geom.Polygon([[[-29,9],[-4,9],[-4,28],[-29,28],[-29,9]]]);
        const stub = new sinon.stub(wrapper.instance().map, 'getPixelFromCoordinate');
        stub.withArgs([-29,28]).returns([10, 50]);
        stub.withArgs([-4,28]).returns([50,50]);
        stub.withArgs([-29,9]).returns([10,100]);
        const renderCalls = renderSpy.callCount;
        wrapper.instance().animate(event, geom, 300);
        expect(maxSpy.calledWith(40,50)).toBe(true);
        expect(styleSpy.called).toBe(true);
        expect(ol.style.Circle.calledOnce).toBe(true);
        expect(event.vectorContext.setStyle.calledOnce).toBe(true);
        expect(event.vectorContext.drawGeometry.calledOnce).toBe(true);
        expect(unSpy.notCalled).toBe(true);
        expect(renderSpy.callCount).toEqual(renderCalls + 1);
        ol.style.Circle = Circle;
        maxSpy.restore();
        unSpy.restore();
        renderSpy.restore();
        styleSpy.restore();
    });

    it('animate should unregister the listener and return 0', () => {
        const Circle = ol.style.Circle;
        ol.style.Circle = new sinon.spy();
        const styleSpy = new sinon.spy(ol.style, 'Style');
        const unSpy = new sinon.spy(ol.Observable, 'unByKey');
        const renderSpy = new sinon.spy(ol.Map.prototype, 'render');
        const props = getProps();
        const wrapper = getWrapper(props);
        const setStyleSpy = new sinon.spy();
        const geomSpy = new sinon.spy();
        const event = {vectorContext: {setStyle: setStyleSpy, drawGeometry: geomSpy}, frameState: {time: 4000}}
        const geom = new ol.geom.Polygon([[[-29,9],[-4,9],[-4,28],[-29,28],[-29,9]]]);
        const stub = new sinon.stub(wrapper.instance().map, 'getPixelFromCoordinate');
        stub.withArgs([-29,28]).returns([10, 50]);
        stub.withArgs([-4,28]).returns([50,50]);
        stub.withArgs([-29,9]).returns([10,100]);
        const renderCalls = renderSpy.callCount;
        expect(wrapper.instance().animate(event, geom, 500)).toEqual(0);
        expect(styleSpy.called).toBe(true);
        expect(ol.style.Circle.calledOnce).toBe(true);
        expect(event.vectorContext.setStyle.calledOnce).toBe(true);
        expect(event.vectorContext.drawGeometry.calledOnce).toBe(true);
        expect(unSpy.called).toBe(true);
        expect(renderSpy.callCount).toEqual(renderCalls);
        ol.style.Circle = Circle;
        unSpy.restore();
        renderSpy.restore();
        styleSpy.restore();
    });

    it('onMapClick should check for features, if multiple it should display in map popup', () => {
        const forEachFeatureAtPixel = ol.Map.prototype.forEachFeatureAtPixel;
        MapView.prototype.overlay = {setPosition: new sinon.spy()};
        // create a mock function to replace map.forEachFeatureAtPixel
        const forEachMock = (pixel, func, options) => {
            const feature1 = new ol.Feature(new ol.geom.Polygon([-1,-1,1,1]));
            feature1.setId('1');
            feature1.setProperties({name: 'number 1'});
            const feature2 = new ol.Feature(new ol.geom.Polygon([0,0,1,1]));
            feature2.setId('2');
            feature2.setProperties({name: 'number 2'});
            [feature1, feature2].forEach((feature) => {
                func(feature);
            });
        }
        ol.Map.prototype.forEachFeatureAtPixel = forEachMock;
        const forEachSpy = new sinon.spy(ol.Map.prototype, 'forEachFeatureAtPixel');
        const props = getProps();
        const wrapper = getWrapper(props);
        const event = {pixel: 'fake', coordinate: [0,0]}
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        wrapper.instance().onMapClick(event);
        expect(forEachSpy.calledOnce).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(MapView.prototype.overlay.setPosition.calledOnce).toBe(true);
        expect(MapView.prototype.overlay.setPosition.calledWith(event.coordinate)).toBe(true);
        //restore
        stateSpy.restore();
        ol.Map.prototype.forEachFeatureAtPixel = forEachFeatureAtPixel;
    });

    it('onMapClick should check for features, if single feature it should call handle click', () => {
        const handleClickSpy = new sinon.spy(MapView.prototype, 'handleClick');
        const forEachFeatureAtPixel = ol.Map.prototype.forEachFeatureAtPixel;
        // create a mock function to replace map.forEachFeatureAtPixel
        const forEachMock = (pixel, func, options) => {
            const feature1 = new ol.Feature(new ol.geom.Polygon([-1,-1,1,1]));
            feature1.setId('1');
            feature1.setProperties({name: 'number 1'});
            [feature1].forEach((feature) => {
                func(feature);
            });
        }
        ol.Map.prototype.forEachFeatureAtPixel = forEachMock;
        const forEachSpy = new sinon.spy(ol.Map.prototype, 'forEachFeatureAtPixel');
        const props = getProps();
        const wrapper = getWrapper(props);
        const event = {pixel: 'fake', coordinate: [0,0]}
        wrapper.instance().onMapClick(event);
        expect(forEachSpy.calledOnce).toBe(true);
        expect(handleClickSpy.calledOnce).toBe(true);
        expect(handleClickSpy.calledWith('1')).toBe(true);
        //restore
        handleClickSpy.restore();
        ol.Map.prototype.forEachFeatureAtPixel = forEachFeatureAtPixel;
    });

    it('zoomToSelected should zoom to the selectedFeature in state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const getFeature = new sinon.spy(ol.source.Vector.prototype, 'getFeatureById');
        const zoomToSpy = new sinon.spy(utils, 'zoomToGeometry');
        wrapper.setState({selectedFeature: '6870234f-d876-467c-a332-65fdf0399a0d'});
        wrapper.instance().zoomToSelected();
        // called twice because of the render method also using it
        expect(getFeature.calledTwice).toBe(true);
        expect(getFeature.calledWith('6870234f-d876-467c-a332-65fdf0399a0d')).toBe(true);
        expect(zoomToSpy.calledOnce).toBe(true);
        getFeature.restore();
        zoomToSpy.restore();
    });

    it('handlePopupClose should call handleClick', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const handleClickSpy = new sinon.spy();
        wrapper.instance().handleClick = handleClickSpy;
        expect(handleClickSpy.notCalled).toBe(true);
        wrapper.setState({selectedFeature: '1234'});
        wrapper.instance().handlePopupClose();
        expect(handleClickSpy.calledOnce).toBe(true);
        expect(handleClickSpy.calledWith('1234')).toBe(true);
    });

    it('setFeatureNotSelected should set style to BLUE_STYLE and z-index 1', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const setStyleSpy = new sinon.spy(ol.Feature.prototype, 'setStyle');
        const getStyleSpy = new sinon.spy(ol.Feature.prototype, 'getStyle');
        const setIndexSpy = new sinon.spy(ol.style.Style.prototype, 'setZIndex');
        const feature = new ol.Feature();
        expect(setStyleSpy.notCalled).toBe(true);
        expect(getStyleSpy.notCalled).toBe(true);
        expect(setIndexSpy.notCalled).toBe(true);
        wrapper.instance().setFeatureNotSelected(feature);
        expect(setStyleSpy.called).toBe(true);
        expect(setStyleSpy.calledWith(BLUE_STYLE)).toBe(true);
        expect(getStyleSpy.called).toBe(true);
        expect(setIndexSpy.called).toBe(true);
        expect(setIndexSpy.calledWith(1)).toBe(true);
        setStyleSpy.restore();
        getStyleSpy.restore();
        setIndexSpy.restore();
    });

    it('setFeatureSelected should set style to RED_STYLE and z-index 100', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const setStyleSpy = new sinon.spy(ol.Feature.prototype, 'setStyle');
        const getStyleSpy = new sinon.spy(ol.Feature.prototype, 'getStyle');
        const setIndexSpy = new sinon.spy(ol.style.Style.prototype, 'setZIndex');
        const feature = new ol.Feature();
        expect(setStyleSpy.notCalled).toBe(true);
        expect(getStyleSpy.notCalled).toBe(true);
        expect(setIndexSpy.notCalled).toBe(true);
        wrapper.instance().setFeatureSelected(feature);
        expect(setStyleSpy.called).toBe(true);
        expect(setStyleSpy.calledWith(RED_STYLE)).toBe(true);
        expect(getStyleSpy.called).toBe(true);
        expect(setIndexSpy.called).toBe(true);
        expect(setIndexSpy.calledWith(100)).toBe(true);
        setStyleSpy.restore();
        getStyleSpy.restore();
        setIndexSpy.restore();
    });

    it('handleSearch should clearDraw, hide warning, create and add a feature, zoom to feature, and call onMapFitler if its a polygon', () => {
        const result = {
            geometry: {
                type: "Polygon",
                coordinates: [[[-77.479588, 38.802139], [-77.401989, 38.802139], [-77.401989, 38.873112], [-77.479588, 38.873112], [-77.479588, 38.802139]]]
            },
            type: "Feature",
        }
        const props = getProps();
        props.onMapFilter = new sinon.spy();
        const wrapper = getWrapper(props);
        const clearSpy = new sinon.spy(utils, 'clearDraw');
        const warningSpy = new sinon.spy(wrapper.instance(), 'showInvalidDrawWarning');
        const readSpy = new sinon.spy(ol.format.GeoJSON.prototype, 'readFeature');
        const transformSpy = new sinon.spy(ol.geom.Polygon.prototype, 'transform');
        const addSpy = new sinon.spy(ol.source.Vector.prototype, 'addFeature');
        const zoomSpy = new sinon.spy(utils, 'zoomToGeometry');
        const typeSpy = new sinon.spy(ol.geom.Polygon.prototype, 'getType');
        const createSpy = new sinon.spy(utils, 'createGeoJSONGeometry');
        expect(wrapper.instance().handleSearch(result)).toBe(true);
        expect(clearSpy.calledOnce).toBe(true);
        expect(clearSpy.calledWith(wrapper.instance().drawLayer)).toBe(true);
        expect(warningSpy.calledOnce).toBe(true);
        expect(warningSpy.calledWith(false)).toBe(true);
        expect(readSpy.calledOnce).toBe(true);
        expect(readSpy.calledWith(result)).toBe(true);
        expect(transformSpy.called).toBe(true);
        expect(transformSpy.calledWith('EPSG:4326', 'EPSG:3857')).toBe(true);
        expect(addSpy.calledOnce).toBe(true);
        expect(zoomSpy.calledOnce).toBe(true);
        expect(typeSpy.calledThrice).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(props.onMapFilter.calledOnce).toBe(true);
        clearSpy.restore();
        readSpy.restore();
        transformSpy.restore();
        addSpy.restore();
        zoomSpy.restore();
        typeSpy.restore();
        createSpy.restore();
    })

    it('handleCancel should hide warning, set mode to normal, clearDraw, and call onMapFilter', () => {
        const props = getProps();
        props.onMapFilter = new sinon.spy();
        const wrapper = getWrapper(props);
        wrapper.setState({mode: 'NOT_NORMAL_MODE'});
        const warningSpy = new sinon.spy(wrapper.instance(), 'showInvalidDrawWarning');
        const updateSpy = new sinon.spy(wrapper.instance(), 'updateMode');
        const clearSpy = new sinon.spy(utils, 'clearDraw');
        wrapper.instance().handleCancel();
        expect(warningSpy.calledOnce).toBe(true);
        expect(warningSpy.calledWith(false)).toBe(true);
        expect(updateSpy.calledOnce).toBe(true);
        expect(updateSpy.calledWith('MODE_NORMAL')).toBe(true);
        expect(clearSpy.calledOnce).toBe(true);
        expect(clearSpy.calledWith(wrapper.instance().drawLayer)).toBe(true);
        expect(props.onMapFilter.calledOnce).toBe(true);
        expect(props.onMapFilter.calledWith(null)).toBe(true);
        clearSpy.restore();
    });

    it('setButtonSelected should set target icon SELECTED and the rest INACTIVE', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const initial = {
            box: "DEFAULT",
            free: "DEFAULT",
            mapView: "DEFAULT",
            import: "DEFAULT",
            search: "DEFAULT",
        };
        const expected = {
            box: 'SELECTED',
            free: 'INACTIVE',
            mapView: 'INACTIVE',
            import: 'INACTIVE',
            search: 'INACTIVE'
        };
        expect(wrapper.state()['toolbarIcons']).toEqual(initial);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        wrapper.instance().setButtonSelected('box');
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({toolbarIcons: expected})).toBe(true);
    });

    it('setAllButtonsDefault should set all toolbarIcons to DEFAULT', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const icons = {
            box: "SELECTED",
            free: "INACTIVE",
            mapView: "INACTIVE",
            import: "INACTIVE",
            search: "INACTIVE",
        };
        const expected = {
            box: "DEFAULT",
            free: "DEFAULT",
            mapView: "DEFAULT",
            import: "DEFAULT",
            search: "DEFAULT",
        }
        wrapper.setState({toolbarIcons: icons});
        expect(wrapper.state()['toolbarIcons']).toEqual(icons);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        wrapper.instance().setAllButtonsDefault();
        expect(stateSpy.calledOnce);
        expect(stateSpy.calledWith({toolbarIcons: expected})).toBe(true);
    });

    it('toggleImportModal should set state to true', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        wrapper.instance().toggleImportModal(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({showImportModal: true})).toBe(true);
    });

    it('toggleImportModal should toggle the state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        const before = wrapper.state()['showImportModal'];
        wrapper.instance().toggleImportModal();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({showImportModal: !before})).toBe(true);
    });

    it('showInvalidDrawWarning should set state to true', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        wrapper.instance().showInvalidDrawWarning(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({showInvalidDrawWarning: true})).toBe(true);
    });

    it('showInvalidDrawWarning should toggle state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        const before = wrapper.state()['showInvalidDrawWarning'];
        wrapper.instance().showInvalidDrawWarning();
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({showInvalidDrawWarning: !before})).toBe(true);
    });

    it('onDrawStart should call clearDraw', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const clearSpy = new sinon.spy(utils, 'clearDraw');
        wrapper.instance().onDrawStart();
        expect(clearSpy.calledOnce).toBe(true);
        expect(clearSpy.calledWith(wrapper.instance().drawLayer)).toBe(true);
        clearSpy.restore();
    });

    it('onDrawEnd should handle a free draw polygon', () => {
        const props = getProps();
        props.onMapFilter = new sinon.spy();
        const modeSpy = new sinon.spy(MapView.prototype, 'updateMode');
        const wrapper = getWrapper(props);
        const geom = new ol.geom.Polygon([[[-29,9],[-4,9],[-4,28],[-29,28],[-29,9]]]);
        const feature = new ol.Feature({geometry: geom});
        const event = {feature: feature};
        const geomSpy = new sinon.spy(ol.Feature.prototype, 'getGeometry');
        const createSpy = new sinon.spy(utils, 'createGeoJSON');
        const featureSpy = new sinon.spy(ol, 'Feature');
        const addSpy = new sinon.spy(ol.source.Vector.prototype, 'addFeature');
        const validSpy = new sinon.spy(utils, 'isGeoJSONValid');
        const createGeomSpy = new sinon.spy(utils, 'createGeoJSONGeometry');
        wrapper.setState({mode: 'MODE_DRAW_FREE'});
        wrapper.instance().onDrawEnd(event);
        expect(geomSpy.calledOnce).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(createSpy.calledWith(geom)).toBe(true);
        expect(featureSpy.calledOnce).toBe(true);
        expect(featureSpy.calledWith({geometry: geom})).toBe(true);
        expect(addSpy.calledOnce).toBe(true);
        expect(validSpy.calledOnce).toBe(true);
        expect(validSpy.calledWith(utils.createGeoJSON(geom))).toBe(true);
        expect(createGeomSpy.calledOnce).toBe(true);
        expect(createGeomSpy.calledWith(geom)).toBe(true);
        expect(props.onMapFilter.calledOnce).toBe(true);
        expect(props.onMapFilter.calledWith(utils.createGeoJSONGeometry(geom))).toBe(true);
        expect(modeSpy.calledOnce).toBe(true);
        expect(modeSpy.calledWith('MODE_NORMAL')).toBe(true);
        modeSpy.restore();
        geomSpy.restore();
        createSpy.restore();
        featureSpy.restore();
        addSpy.restore();
        validSpy.restore();
        createGeomSpy.restore();
    });

    it('onDrawEnd should handle an invalid free draw', () => {
        const props = getProps();
        const modeSpy = new sinon.spy(MapView.prototype, 'updateMode');
        const warningSpy = new sinon.spy(MapView.prototype, 'showInvalidDrawWarning');
        const wrapper = getWrapper(props);
        const geom = new ol.geom.Polygon([[[-29,9],[-4,9],[-4,28],[-29,28],[-29,9]]]);
        const feature = new ol.Feature({geometry: geom});
        const event = {feature: feature};
        const geomSpy = new sinon.spy(ol.Feature.prototype, 'getGeometry');
        const createSpy = new sinon.spy(utils, 'createGeoJSON');
        const featureSpy = new sinon.spy(ol, 'Feature');
        const addSpy = new sinon.spy(ol.source.Vector.prototype, 'addFeature');
        const validSpy = new sinon.stub(utils, 'isGeoJSONValid', () => {return false});
        wrapper.setState({mode: 'MODE_DRAW_FREE'});
        wrapper.instance().onDrawEnd(event);
        expect(geomSpy.calledOnce).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(createSpy.calledWith(geom)).toBe(true);
        expect(featureSpy.calledOnce).toBe(true);
        expect(featureSpy.calledWith({geometry: geom})).toBe(true);
        expect(validSpy.calledOnce).toBe(true);
        expect(validSpy.calledWith(utils.createGeoJSON(geom))).toBe(true);
        expect(warningSpy.calledOnce).toBe(true);
        expect(warningSpy.calledWith(true)).toBe(true);
        expect(modeSpy.calledOnce).toBe(true);
        expect(modeSpy.calledWith('MODE_NORMAL')).toBe(true);
        modeSpy.restore();
        warningSpy.restore();
        geomSpy.restore();
        createSpy.restore();
        featureSpy.restore();
        addSpy.restore();
        validSpy.restore();
    });

    it('onDrawEnd should handle a bbox polygon', () => {
        const props = getProps();
        props.onMapFilter = new sinon.spy();
        const modeSpy = new sinon.spy(MapView.prototype, 'updateMode');
        const wrapper = getWrapper(props);
        const geom = new ol.geom.Polygon([[[-29,9],[-4,9],[-4,28],[-29,28],[-29,9]]]);
        const feature = new ol.Feature({geometry: geom});
        const event = {feature: feature};
        const geomSpy = new sinon.spy(ol.Feature.prototype, 'getGeometry');
        const createSpy = new sinon.spy(utils, 'createGeoJSON');
        const createGeomSpy = new sinon.spy(utils, 'createGeoJSONGeometry');
        const addSpy = new sinon.spy(ol.source.Vector.prototype, 'addFeature');        
        const validSpy = new sinon.stub(utils, 'isGeoJSONValid', () => {return false});        
        wrapper.setState({mode: 'MODE_DRAW_BOX'});
        wrapper.instance().onDrawEnd(event);
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
        modeSpy.restore();
        geomSpy.restore();
        createSpy.restore();
        createGeomSpy.restore();
        validSpy.restore();
        addSpy.restore();
    });

    it('setMapView should clear draw, create a feature from extent, and call onMapFilter', () => {
        const props = getProps();
        props.onMapFilter = new sinon.spy();
        const wrapper = getWrapper(props);
        const clearSpy = new sinon.spy(utils, 'clearDraw');
        const calculateSpy = new sinon.spy(ol.View.prototype, 'calculateExtent');
        const extentSpy =  new sinon.spy(ol.geom.Polygon, 'fromExtent');
        const featureSpy = new sinon.spy(ol, 'Feature');
        const addSpy = new sinon.spy(ol.source.Vector.prototype, 'addFeature');
        const createSpy = new sinon.spy(utils, 'createGeoJSONGeometry');
        wrapper.instance().setMapView();
        expect(clearSpy.calledOnce).toBe(true);
        expect(clearSpy.calledWith(wrapper.instance().drawLayer)).toBe(true);
        expect(calculateSpy.calledOnce).toBe(true);
        expect(calculateSpy.calledWith(wrapper.instance().map.getSize())).toBe(true);
        expect(extentSpy.calledOnce).toBe(true);
        const extent = wrapper.instance().map.getView().calculateExtent(wrapper.instance().map.getSize());
        expect(extentSpy.calledWith(extent)).toBe(true);
        expect(featureSpy.calledOnce).toBe(true);
        expect(addSpy.calledOnce).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(props.onMapFilter.calledOnce).toBe(true);
        clearSpy.restore();
        calculateSpy.restore();
        extentSpy.restore();
        featureSpy.restore();
        addSpy.restore();
        createSpy.restore();
    });

    it('updateMode should set interactions to inactive, activate drawBox, and update the state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        const boxSpy = new sinon.spy();
        const freeSpy = new sinon.spy();
        wrapper.instance().drawBoxInteraction = {setActive: boxSpy}
        wrapper.instance().drawFreeInteraction = {setActive: freeSpy}
        wrapper.instance().updateMode('MODE_DRAW_BBOX');
        expect(freeSpy.calledOnce).toBe(true);
        expect(freeSpy.calledWith(false)).toBe(true);
        expect(boxSpy.calledTwice).toBe(true);
        expect(boxSpy.calledWith(true)).toBe(true);
        expect(boxSpy.calledWith(false)).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({mode: 'MODE_DRAW_BBOX'})).toBe(true);
    });

    it('updateMode should set interactions to inactive, activate drawFree, and update state', () => {
        const props = getProps();
        const wrapper = getWrapper(props);
        const stateSpy = new sinon.spy(wrapper.instance(), 'setState');
        const boxSpy = new sinon.spy();
        const freeSpy = new sinon.spy();
        wrapper.instance().drawBoxInteraction = {setActive: boxSpy}
        wrapper.instance().drawFreeInteraction = {setActive: freeSpy}
        wrapper.instance().updateMode('MODE_DRAW_FREE');
        expect(boxSpy.calledOnce).toBe(true);
        expect(boxSpy.calledWith(false)).toBe(true);
        expect(freeSpy.calledTwice).toBe(true);
        expect(freeSpy.calledWith(true)).toBe(true);
        expect(freeSpy.calledWith(false)).toBe(true);
        expect(stateSpy.calledOnce).toBe(true);
        expect(stateSpy.calledWith({mode: 'MODE_DRAW_FREE'})).toBe(true);
    });

    it('handleGeoJSONUpload should clear the draw layer, add a feature, zoom, and call onMapFilter', () => {
        const props = getProps();
        props.onMapFilter = new sinon.spy();
        const wrapper = getWrapper(props);
        const clearSpy = new sinon.spy(utils, 'clearDraw');
        const zoomSpy = new sinon.spy(utils, 'zoomToGeometry');
        const addSpy = new sinon.spy(ol.source.Vector.prototype, 'addFeature');
        const featureSpy = new sinon.spy(ol, 'Feature');
        const createSpy = new sinon.spy(utils, 'createGeoJSONGeometry');
        const geom = new ol.geom.Polygon([[[-29,9],[-4,9],[-4,28],[-29,28],[-29,9]]]);
        wrapper.instance().handleGeoJSONUpload(geom);
        expect(clearSpy.calledOnce).toBe(true);
        expect(clearSpy.calledWith(wrapper.instance().drawLayer)).toBe(true);
        expect(addSpy.calledOnce).toBe(true);
        expect(featureSpy.calledOnce).toBe(true);
        expect(featureSpy.calledWith({geometry: geom})).toBe(true);
        expect(zoomSpy.calledOnce).toBe(true);
        expect(zoomSpy.calledWith(geom, wrapper.instance().map)).toBe(true);
        expect(createSpy.calledOnce).toBe(true);
        expect(createSpy.calledWith(geom)).toBe(true);
        expect(props.onMapFilter.calledOnce).toBe(true);
        expect(props.onMapFilter.calledWith(utils.createGeoJSONGeometry(geom))).toBe(true);
        clearSpy.restore();
        zoomSpy.restore();
        addSpy.restore();
        featureSpy.restore();
        createSpy.restore();
    });

});

function getRuns() {
    return [
    {
        "uid": "6870234f-d876-467c-a332-65fdf0399a0d",
        "url": "http://cloud.eventkit.dev/api/runs/6870234f-d876-467c-a332-65fdf0399a0d",
        "started_at": "2017-03-10T15:52:35.637331Z",
        "finished_at": "2017-03-10T15:52:39.837Z",
        "duration": "0:00:04.199825",
        "user": "admin",
        "status": "COMPLETED",
        "job": {
            "uid": "7643f806-1484-4446-b498-7ddaa65d011a",
            "name": "Test1",
            "event": "Test1 event",
            "description": "Test1 description",
            "url": "http://cloud.eventkit.dev/api/jobs/7643f806-1484-4446-b498-7ddaa65d011a",
            "extent": {
                "type": "Feature",
                "properties": {
                    "uid": "7643f806-1484-4446-b498-7ddaa65d011a",
                    "name": "Test1"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [
                                -0.077419,
                                50.778155
                            ],
                            [
                                -0.077419,
                                50.818517
                            ],
                            [
                                -0.037251,
                                50.818517
                            ],
                            [
                                -0.037251,
                                50.778155
                            ],
                            [
                                -0.077419,
                                50.778155
                            ]
                        ]
                    ]
                }
            },
            "selection": "",
            "published": false
        },
        "provider_tasks": [],
        "zipfile_url": "http://cloud.eventkit.dev/downloads/6870234f-d876-467c-a332-65fdf0399a0d/TestGPKG-WMTS-TestProject-eventkit-20170310.zip",
        "expiration": "2017-03-24T15:52:35.637258Z"
    },
    {
        "uid": "c7466114-8c0c-4160-8383-351414b11e37",
        "url": "http://cloud.eventkit.dev/api/runs/c7466114-8c0c-4160-8383-351414b11e37",
        "started_at": "2017-03-10T15:52:29.311523Z",
        "finished_at": "2017-03-10T15:52:33.612Z",
        "duration": "0:00:04.301278",
        "user": "notAdmin",
        "status": "COMPLETED",
        "job": {
            "uid": "5488a864-89f2-4e9c-8370-18291ecdae4a",
            "name": "Test2",
            "event": "Test2 event",
            "description": "Test2 description",
            "url": "http://cloud.eventkit.dev/api/jobs/5488a864-89f2-4e9c-8370-18291ecdae4a",
            "extent": {
                "type": "Feature",
                "properties": {
                    "uid": "5488a864-89f2-4e9c-8370-18291ecdae4a",
                    "name": "Test2"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [
                                -0.077419,
                                50.778155
                            ],
                            [
                                -0.077419,
                                50.818517
                            ],
                            [
                                -0.037251,
                                50.818517
                            ],
                            [
                                -0.037251,
                                50.778155
                            ],
                            [
                                -0.077419,
                                50.778155
                            ]
                        ]
                    ]
                }
            },
            "selection": "",
            "published": true
        },
        "provider_tasks": [],
        "zipfile_url": "http://cloud.eventkit.dev/downloads/c7466114-8c0c-4160-8383-351414b11e37/TestGPKG-WMS-TestProject-eventkit-20170310.zip",
        "expiration": "2017-03-24T15:52:29.311458Z"
    },
    {
        "uid": "282816a6-7d16-4f59-a1a9-18764c6339d6",
        "url": "http://cloud.eventkit.dev/api/runs/282816a6-7d16-4f59-a1a9-18764c6339d6",
        "started_at": "2017-03-10T15:52:18.796929Z",
        "finished_at": "2017-03-10T15:52:27.500Z",
        "duration": "0:00:08.703092",
        "user": "admin",
        "status": "COMPLETED",
        "job": {
            "uid": "78bbd59a-4066-4e30-8460-c7b0093a0d7a",
            "name": "Test3",
            "event": "Test3 event",
            "description": "Test3 description",
            "url": "http://cloud.eventkit.dev/api/jobs/78bbd59a-4066-4e30-8460-c7b0093a0d7a",
            "extent": {
                "type": "Feature",
                "properties": {
                    "uid": "78bbd59a-4066-4e30-8460-c7b0093a0d7a",
                    "name": "Test3"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [
                                -0.077419,
                                50.778155
                            ],
                            [
                                -0.077419,
                                50.818517
                            ],
                            [
                                -0.037251,
                                50.818517
                            ],
                            [
                                -0.037251,
                                50.778155
                            ],
                            [
                                -0.077419,
                                50.778155
                            ]
                        ]
                    ]
                }
            },
            "selection": "",
            "published": true
        },
        "provider_tasks": [],
        "zipfile_url": "http://cloud.eventkit.dev/downloads/282816a6-7d16-4f59-a1a9-18764c6339d6/TestGPKG-OSM-CLIP-TestProject-eventkit-20170310.zip",
        "expiration": "2017-03-24T15:52:18.796854Z"
    },]
}
