import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import axios from 'axios';

import Map from 'ol/map';
import View from 'ol/view';
import proj from 'ol/proj';
import extent from 'ol/extent';
import VectorSource from 'ol/source/vector';
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
import AoiInfobar from './AoiInfobar';
import SearchAOIToolbar from '../MapTools/SearchAOIToolbar';
import DrawAOIToolbar from '../MapTools/DrawAOIToolbar';
import InvalidDrawWarning from '../MapTools/InvalidDrawWarning';
import DropZone from '../MapTools/DropZone';
import { updateAoiInfo, clearAoiInfo, stepperNextDisabled, stepperNextEnabled } from '../../actions/exportsActions';
import { getGeocode } from '../../actions/searchToolbarActions';
import { processGeoJSONFile, resetGeoJSONFile } from '../../actions/mapToolActions';
import { generateDrawLayer, generateDrawBoxInteraction, generateDrawFreeInteraction,
    serialize, isGeoJSONValid, createGeoJSON, clearDraw,
    MODE_DRAW_BBOX, MODE_NORMAL, MODE_DRAW_FREE, zoomToFeature, unwrapCoordinates,
    isViewOutsideValidExtent, goToValidExtent, isBox, isVertex, bufferGeojson, hasPointOrLine } from '../../utils/mapUtils';

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
        this.checkForSearchUpdate = this.checkForSearchUpdate.bind(this);
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
            const reader = new GeoJSON();
            const features = reader.readFeatures(this.props.aoiInfo.geojson, {
                dataProjection: WGS84,
                featureProjection: WEB_MERCATOR,
            });
            this.drawLayer.getSource().addFeatures(features);
            this.map.getView().fit(this.drawLayer.getSource().getExtent());
            if (!hasPointOrLine(this.props.aoiInfo.geojson)) {
                this.props.setNextEnabled();
            }
            // this.props.setNextEnabled();
            this.setButtonSelected(this.props.aoiInfo.selectionType);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.importGeom.processed && !this.props.importGeom.processed) {
            this.handleGeoJSONUpload(nextProps.importGeom.featureCollection);
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

    checkForSearchUpdate(result) {
        if (result.geometry.type === 'Point' && !(result.bbox || result.properties.bbox)) {
            return axios.get('/geocode', {
                params: {
                    result,
                },
            }).then(response => (
                this.handleSearch(response.data)
            )).catch((error) => {
                console.log(error.message);
                return this.handleSearch(result);
            });
        }
        return this.handleSearch(result);
    }

    handleSearch(result) {
        clearDraw(this.drawLayer);
        this.showInvalidDrawWarning(false);
        const searchFeature = (new GeoJSON()).readFeature(result);
        searchFeature.getGeometry().transform(WGS84, WEB_MERCATOR);
        this.drawLayer.getSource().addFeature(searchFeature);
        const geojson = {
            type: 'FeatureCollection',
            features: [
                result,
            ],
        };
        let description = '';
        description += (result.country || '');
        description += (result.province ? `, ${result.province}` : '');
        description += (result.region ? `, ${result.region}` : '');
        this.props.updateAoiInfo({
            ...this.props.aoiInfo,
            geojson,
            originalGeojson: geojson,
            geomType: result.geometry.type,
            title: result.name,
            description,
            selectionType: 'search',
        });
        zoomToFeature(searchFeature, this.map);
        if (searchFeature.getGeometry().getType() === 'Polygon' || searchFeature.getGeometry().getType() === 'MultiPolygon') {
            this.props.setNextEnabled();
        }
        return true;
    }

    handleGeoJSONUpload(featureCollection) {
        clearDraw(this.drawLayer);
        const reader = new GeoJSON();
        const features = reader.readFeatures(featureCollection, {
            dataProjection: WGS84,
            featureProjection: WEB_MERCATOR,
        });
        this.drawLayer.getSource().addFeatures(features);
        this.map.getView().fit(this.drawLayer.getSource().getExtent());
        this.props.updateAoiInfo({
            ...this.props.aoiInfo,
            geojson: featureCollection,
            originalGeojson: featureCollection,
            geomType: 'Polygon',
            title: 'Custom Area',
            description: 'Import',
            selectionType: 'import',
        });
        if (!hasPointOrLine(featureCollection)) {
            this.props.setNextEnabled();
        }
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
        this.props.updateAoiInfo({
            ...this.props.aoiInfo,
            geojson,
            originalGeojson: geojson,
            geomType: 'Polygon',
            title: 'Custom Polygon',
            description: 'Map View',
            selectionType: 'mapView',
        });
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
        }
        // if box or draw activate the respective interaction
        if (mode === MODE_DRAW_BBOX) {
            this.drawBoxInteraction.setActive(true);
        } else if (mode === MODE_DRAW_FREE) {
            this.drawFreeInteraction.setActive(true);
        }
        // update the state
        this.setState({ mode });
    }

    handleDrawEnd(event) {
        // get the drawn bounding box
        const geometry = event.feature.getGeometry();
        const coords = geometry.getCoordinates();
        const unwrappedCoords = unwrapCoordinates(coords, this.map.getView().getProjection());
        geometry.setCoordinates(unwrappedCoords);
        const geojson = createGeoJSON(geometry);
        // Since this is a controlled draw we make the assumption
        // that there is only one feature in the collection
        const { bbox } = geojson.features[0];
        // make sure the user didnt create a polygon with no area
        if (bbox[0] !== bbox[2] && bbox[1] !== bbox[3]) {
            if (this.state.mode === MODE_DRAW_FREE) {
                const drawFeature = new Feature({ geometry });
                this.drawLayer.getSource().addFeature(drawFeature);
                if (isGeoJSONValid(geojson)) {
                    this.props.updateAoiInfo({
                        geojson,
                        originalGeojson: geojson,
                        geomType: 'Polygon',
                        title: 'Custom Polygon',
                        description: 'Draw',
                        selectionType: 'free',
                    });
                    this.props.setNextEnabled();
                } else {
                    this.showInvalidDrawWarning(true);
                }
            } else if (this.state.mode === MODE_DRAW_BBOX) {
                this.props.updateAoiInfo({
                    geojson,
                    originalGeojson: geojson,
                    geomType: 'Polygon',
                    title: 'Custom Polygon',
                    description: 'Box',
                    selectionType: 'box',
                });
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

        const icon = document.createElement('i');
        icon.className = 'fa fa-globe';
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
                    label: icon,
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
        const upFeature = this.feature;
        if (upFeature) {
            const geom = upFeature.getGeometry();
            const coords = geom.getCoordinates();
            const unwrappedCoords = unwrapCoordinates(coords, this.map.getView().getProjection());
            geom.setCoordinates(unwrappedCoords);
            const geojson = new GeoJSON().writeFeaturesObject(this.drawLayer.getSource().getFeatures(), {
                dataProjection: WGS84,
                featureProjection: WEB_MERCATOR,
            });
            if (isGeoJSONValid(geojson)) {
                let description = '';
                let selectionType = '';
                if (isBox(upFeature)) {
                    description = 'Box';
                    selectionType = 'box';
                } else {
                    description = 'Draw';
                    selectionType = 'free';
                }
                this.props.updateAoiInfo({
                    ...this.props.aoiInfo,
                    geojson,
                    geomType: 'Polygon',
                    title: 'Custom Polygon',
                    description,
                    selectionType,
                });
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
        const dragFeature = this.feature;
        let coords = dragFeature.getGeometry().getCoordinates()[0];
        // create new coordinates for the feature based on new drag coordinate
        if (isBox(dragFeature)) {
            coords = coords.map((coord) => {
                const newCoord = [...coord];
                if (coord[0] === this.coordinate[0]) {
                    newCoord[0] = evt.coordinate[0];
                }
                if (coord[1] === this.coordinate[1]) {
                    newCoord[1] = evt.coordinate[1];
                }
                return newCoord;
            });
        } else {
            coords = coords.map((coord) => {
                let newCoord = [...coord];
                if (coord[0] === this.coordinate[0] && coord[1] === this.coordinate[1]) {
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
        dragFeature.getGeometry().setCoordinates([coords]);
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
            const mapFeatures = map.getFeaturesAtPixel(pixel, opts);
            for (let i = 0; i < mapFeatures.length; i += 1) {
                const geomType = mapFeatures[i].getGeometry().getType();
                if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
                    if (isViewOutsideValidExtent(this.map.getView())) {
                        goToValidExtent(this.map.getView());
                    }
                    const coords = isVertex(pixel, mapFeatures[i], 10, map);
                    if (coords) {
                        this.markerLayer.getSource().addFeature(new Feature({
                            geometry: new Point(coords),
                        }));
                        break;
                    }
                }
            }
        }
    }

    downEvent(evt) {
        const { map } = evt;
        const { pixel } = evt;
        const opts = { layerFilter: layer => (layer === this.drawLayer) };
        if (map.hasFeatureAtPixel(pixel, opts)) {
            const mapFeatures = map.getFeaturesAtPixel(pixel, opts);
            for (let i = 0; i < mapFeatures.length; i += 1) {
                const geomType = mapFeatures[i].getGeometry().getType();
                if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
                    const vertex = isVertex(pixel, mapFeatures[i], 10, map);
                    if (vertex) {
                        this.feature = mapFeatures[i];
                        this.coordinate = vertex;
                        return true;
                    }
                }
            }
        }
        return false;
    }

    handleZoomToSelection() {
        const reader = new GeoJSON();
        const features = reader.readFeatures(this.props.aoiInfo.geojson, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
        });
        if (features.length === 1) {
            zoomToFeature(features[0], this.map);
        } else {
            const source = new VectorSource({
                features,
            });
            this.map.getView().fit(source.getExtent());
        }
    }

    bufferMapFeature(size) {
        const { geojson } = this.props.aoiInfo;
        if (!size || Object.keys(this.props.aoiInfo.geojson).length === 0) {
            return false;
        }
        const reader = new GeoJSON();
        const bufferedFeatureCollection = bufferGeojson(geojson, size, true);
        const newFeatures = reader.readFeatures(bufferedFeatureCollection, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
        });
        clearDraw(this.drawLayer);
        this.drawLayer.getSource().addFeatures(newFeatures);
        this.props.updateAoiInfo({
            ...this.props.aoiInfo,
            geojson: bufferedFeatureCollection,
        });
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
                        handleSearch={this.checkForSearchUpdate}
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
        updateAoiInfo: (aoiInfo) => {
            dispatch(updateAoiInfo(aoiInfo));
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
        resetGeoJSONFile: () => {
            dispatch(resetGeoJSONFile());
        },
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(ExportAOI);
