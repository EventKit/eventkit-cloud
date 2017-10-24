import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import Map from 'ol/map';
import View from 'ol/view';
import proj from 'ol/proj';
import extent from 'ol/extent';
import GeoJSON from 'ol/format/geojson';
import Feature from 'ol/feature';
import Point from 'ol/geom/point';
import Polygon from 'ol/geom/polygon';
import Style from 'ol/style/style';
import Fill from 'ol/style/fill';
import Stroke from 'ol/style/stroke';
import Circle from 'ol/style/circle';
import ScaleLine from 'ol/control/scaleline';
import Attribution from 'ol/control/attribution';
import Zoom from 'ol/control/zoom';
import ZoomToExtent from 'ol/control/zoomtoextent';
import interaction from 'ol/interaction';
import Pointer from 'ol/interaction/pointer';
import Tile from 'ol/layer/tile';
import XYZ from 'ol/source/xyz';

import css from '../../styles/ol3map.css';
import AoiInfobar from './AoiInfobar.js';
import SearchAOIToolbar from '../MapTools/SearchAOIToolbar.js';
import DrawAOIToolbar from '../MapTools/DrawAOIToolbar.js';
import InvalidDrawWarning from '../MapTools/InvalidDrawWarning.js';
import DropZone from '../MapTools/DropZone.js';
import { updateAoiInfo, clearAoiInfo, stepperNextDisabled, stepperNextEnabled } from '../../actions/exportsActions.js';
import { getGeocode } from '../../actions/searchToolbarActions';
import { processGeoJSONFile, resetGeoJSONFile } from '../../actions/mapToolActions';
import { generateDrawLayer, generateDrawBoxInteraction, generateDrawFreeInteraction,
    serialize, isGeoJSONValid, createGeoJSON, clearDraw,
    MODE_DRAW_BBOX, MODE_NORMAL, MODE_DRAW_FREE, zoomToGeometry, unwrapCoordinates,
    isViewOutsideValidExtent, goToValidExtent, isBox, isVertex, convertGeoJSONtoJSTS, jstsGeomToOlGeom} from '../../utils/mapUtils';

export const WGS84 = 'EPSG:4326';
export const WEB_MERCATOR = 'EPSG:3857';

export class ExportAOI extends Component {
    constructor(props) {
        super(props);
        this.setButtonSelected = this.setButtonSelected.bind(this);
        this.setAllButtonsDefault = this.setAllButtonsDefault.bind(this);
        this.toggleImportModal = this.toggleImportModal.bind(this);
        this.showInvalidDrawWarning = this.showInvalidDrawWarning.bind(this);
        this.handleDrawStart = this.handleDrawStart.bind(this);
        this.handleDrawEnd = this.handleDrawEnd.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleResetMap = this.handleResetMap.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.setMapView = this.setMapView.bind(this);
        this.handleGeoJSONUpload = this.handleGeoJSONUpload.bind(this);
        this.updateMode = this.updateMode.bind(this);
        this.handleZoomToSelection = this.handleZoomToSelection.bind(this);
        this.doesMapHaveFeatures = this.doesMapHaveFeatures.bind(this);
        this.bufferMapFeature = this.bufferMapFeature.bind(this);
        this.downEvent = this.downEvent.bind(this);
        this.moveEvent = this.moveEvent.bind(this);
        this.dragEvent = this.dragEvent.bind(this);
        this.upEvent = this.upEvent.bind(this);
        this.state = {
            toolbarIcons: {
                box: 'DEFAULT',
                free: 'DEFAULT',
                mapView: 'DEFAULT',
                import: 'DEFAULT',
                search: 'DEFAULT',
            },
            showImportModal: false,
            showInvalidDrawWarning: false,
            mode: MODE_NORMAL,
        };
    }

    componentDidMount() {
        this.initializeOpenLayers();
        if (Object.keys(this.props.aoiInfo.geojson).length !== 0) {
            const bbox = this.props.aoiInfo.geojson.features[0].bbox;
            const reader = new GeoJSON();
            const feature = reader.readFeatures(this.props.aoiInfo.geojson, {
                dataProjection: WGS84,
                featureProjection: WEB_MERCATOR,
            });
            this.drawLayer.getSource().addFeature(feature[0]);
            this.map.getView().fit(this.drawLayer.getSource().getExtent());
            this.props.setNextEnabled();
            this.setButtonSelected(this.props.aoiInfo.selectionType);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.importGeom.processed && !this.props.importGeom.processed) {
            this.handleGeoJSONUpload(nextProps.importGeom.geom);
        }
    }

    componentDidUpdate() {
        this.map.updateSize();
    }

    setButtonSelected(iconName) {
        const icons = { ...this.state.toolbarIcons };
        Object.keys(icons).forEach((key) => {
            if (key === iconName) {
                icons[key] = 'SELECTED';
            } else {
                icons[key] = 'INACTIVE';
            }
        });
        this.setState({ toolbarIcons: icons });
    }

    setAllButtonsDefault() {
        const icons = { ...this.state.toolbarIcons };
        Object.keys(icons).forEach((key) => {
            icons[key] = 'DEFAULT';
        });
        this.setState({ toolbarIcons: icons });
    }

    toggleImportModal(show) {
        if (show != undefined) {
            this.setState({ showImportModal: show });
        }
        else {
            this.setState({ showImportModal: !this.state.showImportModal });
        }
    }

    showInvalidDrawWarning(show) {
        if (show !== undefined) {
            this.setState({ showInvalidDrawWarning: show });
        } else {
            this.setState({ showInvalidDrawWarning: !this.state.showInvalidDrawWarning });
        }
    }

    handleCancel() {
        this.showInvalidDrawWarning(false);
        if (this.state.mode !== MODE_NORMAL) {
            this.updateMode(MODE_NORMAL);
        }
        clearDraw(this.drawLayer);
        this.props.clearAoiInfo();
        this.props.setNextDisabled();
    }

    handleResetMap() {
        const worldExtent = proj.transformExtent([-180, -90, 180, 90], WGS84, WEB_MERCATOR);
        this.map.getView().fit(worldExtent, this.map.getSize());
    }

    handleSearch(result) {
        clearDraw(this.drawLayer);
        this.showInvalidDrawWarning(false);

        const feature = (new GeoJSON()).readFeature(result);
        feature.getGeometry().transform(WGS84, WEB_MERCATOR);
        const geojson = createGeoJSON(feature.getGeometry());

        this.drawLayer.getSource().addFeature(feature);

        let description = '';
        description = description + (result.country ? result.country : '');
        description = description + (result.province ? ', ' + result.province : '');
        description = description + (result.region ? ', ' + result.region : '');

        this.props.updateAoiInfo(geojson, result.geometry.type, result.name, description, 'search');
        zoomToGeometry(feature.getGeometry(), this.map);
        if (feature.getGeometry().getType() === 'Polygon' || feature.getGeometry().getType() === 'MultiPolygon') {
            this.props.setNextEnabled();
        }
        return true;
    }

    handleGeoJSONUpload(geom) {
        clearDraw(this.drawLayer);
        this.drawLayer.getSource().addFeature(
            new Feature({
                geometry: geom,
            }),
        );
        const geojson = createGeoJSON(geom);
        zoomToGeometry(geom, this.map);
        this.props.updateAoiInfo(geojson, geom.getType(), 'Custom Area', 'Import', 'import');
        this.props.setNextEnabled();
    }

    setMapView() {
        clearDraw(this.drawLayer);
        const extent = this.map.getView().calculateExtent(this.map.getSize());
        const geom = new Polygon.fromExtent(extent);
        const coords = geom.getCoordinates();
        const unwrappedCoords = unwrapCoordinates(coords, this.map.getView().getProjection());
        geom.setCoordinates(unwrappedCoords);
        const geojson = createGeoJSON(geom);
        const bboxFeature = new Feature({
            geometry: geom,
        });
        const bbox = serialize(extent);
        this.drawLayer.getSource().addFeature(bboxFeature);
        this.props.updateAoiInfo(geojson, 'Polygon', 'Custom Polygon', 'Map View', 'mapView');
        this.props.setNextEnabled();
    }

    updateMode(mode) {
        // make sure interactions are deactivated
        this.drawBoxInteraction.setActive(false);
        this.drawFreeInteraction.setActive(false);
        if (isViewOutsideValidExtent(this.map.getView())) {
            // Even though we can 'wrap' the draw layer and 'unwrap' the draw coordinates
            // when needed, the draw interaction breaks if you wrap too many time, so to 
            // avoid that issue we go back to the valid extent but maintain the same view
            goToValidExtent(this.map.getView());
        };
        // if box or draw activate the respective interaction
        if (mode == MODE_DRAW_BBOX) {
            this.drawBoxInteraction.setActive(true);
        }
        else if (mode == MODE_DRAW_FREE) {
            this.drawFreeInteraction.setActive(true);
        }
        // update the state
        this.setState({mode: mode});
    }

    handleDrawEnd(event) {
        // get the drawn bounding box
        const geometry = event.feature.getGeometry();
        const coords = geometry.getCoordinates();
        const unwrappedCoords = unwrapCoordinates(coords, this.map.getView().getProjection());
        geometry.setCoordinates(unwrappedCoords);
        const geojson = createGeoJSON(geometry);
        const bbox = geojson.features[0].bbox;
        // make sure the user didnt create a polygon with no area
        if (bbox[0] !== bbox[2] && bbox[1] !== bbox[3]) {
            if (this.state.mode === MODE_DRAW_FREE) {
                const drawFeature = new Feature({
                    geometry: geometry,
                });
                this.drawLayer.getSource().addFeature(drawFeature);

                if (isGeoJSONValid(geojson)) {
                    this.props.updateAoiInfo(geojson, 'Polygon', 'Custom Polygon', 'Draw', 'free');
                    this.props.setNextEnabled();
                } else {
                    this.showInvalidDrawWarning(true);
                }
            } else if (this.state.mode === MODE_DRAW_BBOX) {
                this.props.updateAoiInfo(geojson, 'Polygon', 'Custom Polygon', 'Box', 'box');
                this.props.setNextEnabled();
            }
            // exit drawing mode
            this.updateMode(MODE_NORMAL);
        }
    }

    handleDrawStart() {
        clearDraw(this.drawLayer);
    }

    initializeOpenLayers() {
        const scaleStyle = {
            background: 'white',
        };

        this.drawLayer = generateDrawLayer();
        this.markerLayer = generateDrawLayer();

        this.markerLayer.setStyle(new Style({
            image: new Circle({
                fill: new Fill({ color: 'rgba(255,255,255,0.4)' }),
                stroke: new Stroke({ color: '#ce4427', width: 1.25 }),
                radius: 5,
            }),
            fill: new Fill({ color: 'rgba(255,255,255,0.4)' }),
            stroke: new Stroke({ color: '#3399CC', width: 1.25 }),
        }));

        this.drawBoxInteraction = generateDrawBoxInteraction(this.drawLayer);
        this.drawBoxInteraction.on('drawstart', this.handleDrawStart);
        this.drawBoxInteraction.on('drawend', this.handleDrawEnd);

        this.drawFreeInteraction = generateDrawFreeInteraction(this.drawLayer);
        this.drawFreeInteraction.on('drawstart', this.handleDrawStart);
        this.drawFreeInteraction.on('drawend', this.handleDrawEnd);

        this.map = new Map({
            controls: [
                new ScaleLine({
                    className: css.olScaleLine,
                }),
                new Attribution({
                    className: ['ol-attribution', css['ol-attribution']].join(' '),
                    collapsible: false,
                    collapsed: false,
                }),
                new Zoom({
                    className: css.olZoom,
                }),
                new ZoomToExtent({
                    className: css.olZoomToExtent,
                    extent: [
                        -14251567.50789682,
                        -10584983.780136958,
                        14251787.50789682,
                        10584983.780136958,
                    ],
                }),
            ],
            interactions: interaction.defaults({
                keyboard: false,
                altShiftDragRotate: false,
                pinchRotate: false,
            }),
            layers: [
                // Order matters here
                new Tile({
                    source: new XYZ({
                        url: this.context.config.BASEMAP_URL,
                        wrapX: true,
                        attributions: this.context.config.BASEMAP_COPYRIGHT,
                    }),
                }),
            ],
            target: 'map',
            view: new View({
                projection: 'EPSG:3857',
                center: [110, 0],
                zoom: 2.5,
                minZoom: 2.5,
                maxZoom: 22,
            }),
        });

        this.pointer = new Pointer({
            handleDownEvent: this.downEvent,
            handleDragEvent: this.dragEvent,
            handleMoveEvent: this.moveEvent,
            handleUpEvent: this.upEvent,
        });

        this.map.addInteraction(this.pointer);
        this.map.addInteraction(this.drawBoxInteraction);
        this.map.addInteraction(this.drawFreeInteraction);
        this.map.addLayer(this.drawLayer);
        this.map.addLayer(this.markerLayer);
    }

    upEvent() {
        const { feature } = this;
        if (feature) {
            const geom = feature.getGeometry();
            const coords = geom.getCoordinates();
            const unwrappedCoords = unwrapCoordinates(coords, this.map.getView().getProjection());
            geom.setCoordinates(unwrappedCoords);
            const geojson = createGeoJSON(geom);
            if (isGeoJSONValid(geojson)) {
                if (isBox(feature)) {
                    this.props.updateAoiInfo(geojson, 'Polygon', 'Custom Polygon', 'Box', 'box');
                } else {
                    this.props.updateAoiInfo(geojson, 'Polygon', 'Custom Polygon', 'Draw', 'free');
                }
                this.showInvalidDrawWarning(false);
                this.props.setNextEnabled();
            } else {
                this.props.setNextDisabled();
                this.showInvalidDrawWarning(true);
            }
        }
        this.coordinate = null;
        this.feature = null;
        return false;
    }

    dragEvent(evt) {
        const deltaX = evt.coordinate[0] - this.coordinate[0];
        const deltaY = evt.coordinate[1] - this.coordinate[1];
        const feature = this.feature;
        let coords = feature.getGeometry().getCoordinates()[0];
         // create new coordinates for the feature based on new drag coordinate
        if (isBox(feature)) {
            coords = coords.map(coord => {
                let newCoord = [...coord]
                if (coord[0] == this.coordinate[0]) {
                    newCoord[0] = evt.coordinate[0];
                }
                if (coord[1] == this.coordinate[1]) {
                    newCoord[1] = evt.coordinate[1];
                }
                return newCoord;
            });
        }
        else {
            coords = coords.map(coord => {
                let newCoord = [...coord];
                if (coord[0] == this.coordinate[0] && coord[1] === this.coordinate[1]) {
                    newCoord = [...evt.coordinate];
                }
                return newCoord;
            });
        }
        const bounds = extent.boundingExtent(coords);
        // do not update the feature if it would have no area
        if (bounds[0] === bounds[2] || bounds[1] === bounds[3]) {
            return false;
        }
        feature.getGeometry().setCoordinates([coords]);
        clearDraw(this.markerLayer);
        this.markerLayer.getSource().addFeature(new Feature({
            geometry: new Point(evt.coordinate),
        }));
        this.coordinate = [...evt.coordinate];
        return true;
    }

    moveEvent(evt) {
        const { map } = evt;
        const { pixel } = evt;
        if (this.markerLayer.getSource().getFeatures().length > 0) {
            clearDraw(this.markerLayer);
        }
        const opts = { layerFilter: layer => (layer === this.drawLayer) };
        if (map.hasFeatureAtPixel(pixel, opts)) {
            const feature = map.getFeaturesAtPixel(pixel, opts)[0];
            if (feature.getGeometry().getType() === 'Polygon') {
                if (isViewOutsideValidExtent(this.map.getView())) {
                    goToValidExtent(this.map.getView());
                }
                const coords = isVertex(pixel, feature, 10, map);
                if (coords) {
                    this.markerLayer.getSource().addFeature(new Feature({
                        geometry: new Point(coords),
                    }));
                }
            }
        }
    }

    downEvent(evt) {
        const { map } = evt;
        const { pixel } = evt;
        const opts = { layerFilter: layer => (layer === this.drawLayer) };
        if (map.hasFeatureAtPixel(pixel, opts)) {
            const feature = map.getFeaturesAtPixel(pixel, opts)[0];
            if (feature.getGeometry().getType() === 'Polygon') {
                const vertex = isVertex(pixel, feature, 10, map);
                if (vertex) {
                    this.feature = feature;
                    this.coordinate = vertex;
                    return true;
                }
            }
        }
        return false;
    }

    handleZoomToSelection() {
        const ol3GeoJSON = new GeoJSON();
        const geom = ol3GeoJSON.readGeometry(this.props.aoiInfo.geojson.features[0].geometry, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
        });
        zoomToGeometry(geom, this.map);
    }

    bufferMapFeature(size) {
        const { geojson } = this.props.aoiInfo;
        if (Object.keys(this.props.aoiInfo.geojson).length === 0) {
            return false;
        }
        const bufferedFeature = convertGeoJSONtoJSTS(geojson, size, true);

        if (bufferedFeature.getArea() === 0) {
            return false;
        }

        const olGeometry = jstsGeomToOlGeom(bufferedFeature);
        const feature = this.drawLayer.getSource().getFeatures()[0];
        const newFeature = feature.clone();
        newFeature.setGeometry(olGeometry);
        clearDraw(this.drawLayer);
        this.drawLayer.getSource().addFeature(newFeature);
        const newGeojson = createGeoJSON(olGeometry);
        this.props.updateAoiInfo(
            newGeojson,
            this.props.aoiInfo.geomType,
            this.props.aoiInfo.title,
            this.props.aoiInfo.description,
            this.props.aoiInfo.selectionType,
        );
        this.props.setNextEnabled();
        return true;
    }

    doesMapHaveFeatures() {
        if (!this.props.aoiInfo.geojson) {
            return false;
        }
        return Object.keys(this.props.aoiInfo.geojson).length !== 0;
    }

    render() {
        const mapStyle = {
            right: '0px',
        };

        if (this.props.drawer === 'open' && window.innerWidth >= 1200) {
            mapStyle.left = '200px';
        } else {
            mapStyle.left = '0px';
        }

        const showBuffer = this.doesMapHaveFeatures();

        return (
            <div>
                <div id="map" className={css.map} style={mapStyle} ref="olmap">
                    <AoiInfobar
                        aoiInfo={this.props.aoiInfo}
                        disabled={false}
                        clickZoomToSelection={this.handleZoomToSelection}
                    />
                    <SearchAOIToolbar
                        handleSearch={this.handleSearch}
                        handleCancel={this.handleCancel}
                        geocode={this.props.geocode}
                        toolbarIcons={this.state.toolbarIcons}
                        getGeocode={this.props.getGeocode}
                        setAllButtonsDefault={this.setAllButtonsDefault}
                        setSearchAOIButtonSelected={() => { this.setButtonSelected('search'); }}
                    />
                    <DrawAOIToolbar
                        toolbarIcons={this.state.toolbarIcons}
                        updateMode={this.updateMode}
                        handleCancel={this.handleCancel}
                        setMapView={this.setMapView}
                        setAllButtonsDefault={this.setAllButtonsDefault}
                        setBoxButtonSelected={() => { this.setButtonSelected('box'); }}
                        setFreeButtonSelected={() => { this.setButtonSelected('free'); }}
                        setMapViewButtonSelected={() => { this.setButtonSelected('mapView'); }}
                        setImportButtonSelected={() => { this.setButtonSelected('import'); }}
                        setImportModalState={this.toggleImportModal}
                        showBufferButton={showBuffer}
                        onBufferClick={this.bufferMapFeature}
                    />
                    <InvalidDrawWarning
                        show={this.state.showInvalidDrawWarning}
                    />
                    <DropZone
                        importGeom={this.props.importGeom}
                        showImportModal={this.state.showImportModal}
                        setAllButtonsDefault={this.setAllButtonsDefault}
                        setImportModalState={this.toggleImportModal}
                        processGeoJSONFile={this.props.processGeoJSONFile}
                        resetGeoJSONFile={this.props.resetGeoJSONFile}
                    />
                </div>
            </div>
        );
    }
}

ExportAOI.contextTypes = {
    config: React.PropTypes.object
}

ExportAOI.propTypes = {
    aoiInfo: PropTypes.object,
    importGeom: PropTypes.object,
    drawer: PropTypes.string,
    geocode: PropTypes.object,
    updateAoiInfo: PropTypes.func,
    clearAoiInfo: PropTypes.func,
    setNextDisabled: PropTypes.func,
    setNextEnabled: PropTypes.func,
    getGeocode: PropTypes.func,
    processGeoJSONFile: PropTypes.func,
    resetGeoJSONFile: PropTypes.func,
}

function mapStateToProps(state) {
    return {
        aoiInfo: state.aoiInfo,
        importGeom: state.importGeom,
        drawer: state.drawer,
        geocode: state.geocode,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        updateAoiInfo: (geojson, geomType, title, description, selectionType) => {
            dispatch(updateAoiInfo(geojson, geomType, title, description, selectionType));
        },
        clearAoiInfo: () => {
            dispatch(clearAoiInfo());
        },
        setNextDisabled: () => {
            dispatch(stepperNextDisabled());
        },
        setNextEnabled: () => {
            dispatch(stepperNextEnabled());
        },
        getGeocode: (query) => {
            dispatch(getGeocode(query));
        },
        processGeoJSONFile: (file) => {
            dispatch(processGeoJSONFile(file));
        },
        resetGeoJSONFile: (file) => {
            dispatch(resetGeoJSONFile());
        },
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ExportAOI);
