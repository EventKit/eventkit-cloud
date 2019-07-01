import * as PropTypes from 'prop-types';
import * as React from 'react';
import { withTheme, Theme } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import { connect } from 'react-redux';
import axios from 'axios';
import * as debounce from 'lodash/debounce';
import Joyride, { Step } from 'react-joyride';

import Map from 'ol/map';
import View from 'ol/view';
import proj from 'ol/proj';
import extent from 'ol/extent';
import VectorSource from 'ol/source/vector';
import GeoJSONFormat from 'ol/format/geojson';
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
import BufferDialog from './BufferDialog';
import RevertDialog from './RevertDialog';
import { updateAoiInfo, clearAoiInfo, clearExportInfo } from '../../actions/datacartActions';
import { stepperNextDisabled, stepperNextEnabled } from '../../actions/uiActions';
import { getGeocode } from '../../actions/geocodeActions';
import { processGeoJSONFile, resetGeoJSONFile } from '../../actions/fileActions';
import {
    generateDrawLayer, generateDrawBoxInteraction, generateDrawFreeInteraction,
    isGeoJSONValid, createGeoJSON, clearDraw,
    MODE_DRAW_BBOX, MODE_NORMAL, MODE_DRAW_FREE, zoomToFeature, unwrapCoordinates,
    isViewOutsideValidExtent, goToValidExtent, isBox, isVertex, bufferGeojson, allHaveArea,
    getDominantGeometry } from '../../utils/mapUtils';

import { getSqKm } from '../../utils/generic';
import ZoomLevelLabel from '../MapTools/ZoomLevelLabel';
import globe from '../../../images/globe-americas.svg';
import { joyride } from '../../joyride.config';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';

export const WGS84 = 'EPSG:4326';
export const WEB_MERCATOR = 'EPSG:3857';

export interface Props {
    aoiInfo: Eventkit.Store.AoiInfo;
    limits: {
        max: number;
        sizes: number[];
    };
    importGeom: Eventkit.Store.ImportGeom;
    drawer: string;
    geocode: object;
    updateAoiInfo: (args: any) => void;
    clearAoiInfo: () => void;
    setNextDisabled: () => void;
    setNextEnabled: () => void;
    getGeocode: () => void;
    processGeoJSONFile: () => void;
    resetGeoJSONFile: () => void;
    clearExportInfo: () => void;
    walkthroughClicked: boolean;
    onWalkthroughReset: () => void;
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
}

export interface State {
    toolbarIcons: {
        box: string;
        free: string;
        mapView: string;
        import: string;
        search: string;
    };
    showImportModal: boolean;
    showInvalidDrawWarning: boolean;
    showBuffer: boolean;
    validBuffer: boolean;
    mode: string;
    steps: Step[];
    stepIndex: number;
    isRunning: boolean;
    fakeData: boolean;
    showReset: boolean;
    zoomLevel: number;
}

export class ExportAOI extends React.Component<Props, State> {
    static contextTypes = {
        config: PropTypes.object,
    };

    private bufferFunction: () => void;
    private drawLayer;
    private map;
    private drawBoxInteraction;
    private drawFreeInteraction;
    private markerLayer;
    private bufferLayer;
    private pointer;
    private feature;
    private coordinate;
    private bufferFeatures;
    private bounceBack: boolean;
    private joyride: Joyride;
    constructor(props: Props) {
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
        this.callback = this.callback.bind(this);
        this.bufferMapFeature = this.bufferMapFeature.bind(this);
        this.downEvent = this.downEvent.bind(this);
        this.moveEvent = this.moveEvent.bind(this);
        this.dragEvent = this.dragEvent.bind(this);
        this.upEvent = this.upEvent.bind(this);
        this.handleBufferClick = this.handleBufferClick.bind(this);
        this.openBufferDialog = this.openBufferDialog.bind(this);
        this.closeBufferDialog = this.closeBufferDialog.bind(this);
        this.handleBufferChange = this.handleBufferChange.bind(this);
        this.closeResetDialog = this.closeResetDialog.bind(this);
        this.openResetDialog = this.openResetDialog.bind(this);
        this.resetAoi = this.resetAoi.bind(this);
        this.updateZoomLevel = this.updateZoomLevel.bind(this);
        this.shouldEnableNext = this.shouldEnableNext.bind(this);
        this.bufferFunction = () => { /* do nothing */ };
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
            showBuffer: false,
            validBuffer: true,
            mode: MODE_NORMAL,
            steps: [],
            stepIndex: 0,
            isRunning: false,
            fakeData: false,
            showReset: false,
            zoomLevel: 2,
        };
    }

    componentDidMount() {
        // set up debounce functions for user text input
        this.bufferFunction = debounce((val) => {
            const valid = this.handleBufferChange(val);
            if (valid !== this.state.validBuffer) {
                this.setState({ validBuffer: valid });
            }
        }, 10);

        this.initializeOpenLayers();
        if (Object.keys(this.props.aoiInfo.geojson).length !== 0) {
            const reader = new GeoJSONFormat();
            const features = reader.readFeatures(this.props.aoiInfo.geojson, {
                dataProjection: WGS84,
                featureProjection: WEB_MERCATOR,
            });
            this.drawLayer.getSource().addFeatures(features);
            this.map.getView().fit(this.drawLayer.getSource().getExtent());
            const enable = this.shouldEnableNext(this.props.aoiInfo.geojson);
            if (enable) {
                this.props.setNextEnabled();
            }
            this.setButtonSelected(this.props.aoiInfo.selectionType);
        }

        const steps = joyride.ExportAOI as any[];
        this.joyrideAddSteps(steps);
    }

    componentDidUpdate(prevProps: Props) {
        if (this.props.importGeom.processed && !prevProps.importGeom.processed) {
            this.handleGeoJSONUpload(this.props.importGeom);
        }

        if (this.props.walkthroughClicked && !prevProps.walkthroughClicked && this.state.isRunning === false) {
            this.joyride.reset(true);
            this.setState({ isRunning: true });
        }

        this.map.updateSize();
    }

    private setButtonSelected(iconName: string) {
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

    private setAllButtonsDefault() {
        const icons = { ...this.state.toolbarIcons };
        Object.keys(icons).forEach((key) => {
            icons[key] = 'DEFAULT';
        });
        this.setState({ toolbarIcons: icons });
    }

    private setMapView() {
        clearDraw(this.drawLayer);
        const ext = this.map.getView().calculateExtent(this.map.getSize());
        const geom = Polygon.fromExtent(ext);
        const coords = geom.getCoordinates();
        const unwrappedCoords = unwrapCoordinates(coords, this.map.getView().getProjection());
        geom.setCoordinates(unwrappedCoords);
        const geojson = createGeoJSON(geom) as GeoJSON.FeatureCollection;
        const bboxFeature = new Feature({
            geometry: geom,
        });
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
        const enable = this.shouldEnableNext(geojson);
        if (enable) {
            this.props.setNextEnabled();
        } else {
            this.props.setNextDisabled();
        }
    }

    private toggleImportModal(show: boolean) {
        if (show !== undefined) {
            this.setState({ showImportModal: show });
        } else {
            this.setState({ showImportModal: !this.state.showImportModal });
        }
    }

    private showInvalidDrawWarning(show: boolean) {
        if (show !== undefined) {
            this.setState({ showInvalidDrawWarning: show });
        } else {
            this.setState({ showInvalidDrawWarning: !this.state.showInvalidDrawWarning });
        }
    }

    private handleCancel() {
        this.showInvalidDrawWarning(false);
        if (this.state.mode !== MODE_NORMAL) {
            this.updateMode(MODE_NORMAL);
        }
        clearDraw(this.drawLayer);
        this.props.clearAoiInfo();
        this.props.setNextDisabled();
    }

    private handleResetMap() {
        const worldExtent = proj.transformExtent([-180, -90, 180, 90], WGS84, WEB_MERCATOR);
        this.map.getView().fit(worldExtent, this.map.getSize());
    }

    private checkForSearchUpdate(result: GeoJSON.Feature) {
        if (result.geometry.type === 'Point' && !(result.bbox || result.properties.bbox)) {
            return axios.get('/geocode', {
                params: {
                    result,
                },
            }).then(response => (
                this.handleSearch(response.data)
            )).catch(() => (
                this.handleSearch(result)
            ));
        }
        return this.handleSearch(result);
    }

    private handleSearch(result: GeoJSON.Feature & GeoJSON.GeoJsonProperties) {
        clearDraw(this.drawLayer);
        this.showInvalidDrawWarning(false);
        const searchFeature = (new GeoJSONFormat()).readFeature(result);
        searchFeature.getGeometry().transform(WGS84, WEB_MERCATOR);
        this.drawLayer.getSource().addFeature(searchFeature);
        const geojson: GeoJSON.FeatureCollection = {
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
        const enable = this.shouldEnableNext(geojson);
        if (enable) {
            this.props.setNextEnabled();
        } else {
            this.props.setNextDisabled();
        }
        return true;
    }

    private handleGeoJSONUpload(importGeom: Eventkit.Store.ImportGeom) {
        const { featureCollection, filename } = importGeom;
        clearDraw(this.drawLayer);
        const reader = new GeoJSONFormat();
        const features = reader.readFeatures(featureCollection, {
            dataProjection: WGS84,
            featureProjection: WEB_MERCATOR,
        });
        this.drawLayer.getSource().addFeatures(features);
        this.map.getView().fit(this.drawLayer.getSource().getExtent());
        const geomType = getDominantGeometry(featureCollection);
        this.props.updateAoiInfo({
            ...this.props.aoiInfo,
            geojson: featureCollection,
            originalGeojson: featureCollection,
            geomType,
            title: filename,
            description: geomType,
            selectionType: 'import',
        });
        const enable = this.shouldEnableNext(featureCollection);
        if (enable) {
            this.props.setNextEnabled();
        } else {
            this.props.setNextDisabled();
        }
    }

    private updateMode(mode: string) {
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

    private handleDrawEnd(event: any) {
        // get the drawn bounding box
        const geometry = event.feature.getGeometry();
        const coords = geometry.getCoordinates();
        const unwrappedCoords = unwrapCoordinates(coords, this.map.getView().getProjection());
        geometry.setCoordinates(unwrappedCoords);
        const geojson = createGeoJSON(geometry) as GeoJSON.FeatureCollection;
        // Since this is a controlled draw we make the assumption
        // that there is only one feature in the collection
        const { bbox } = geojson.features[0];
        // make sure the user didnt create a polygon with no area
        if (bbox[0] !== bbox[2] && bbox[1] !== bbox[3]) {
            if (this.state.mode === MODE_DRAW_FREE) {
                if (isGeoJSONValid(geojson)) {
                    this.props.updateAoiInfo({
                        ...this.props.aoiInfo,
                        geojson,
                        originalGeojson: geojson,
                        geomType: 'Polygon',
                        title: 'Custom Polygon',
                        description: 'Draw',
                        selectionType: 'free',
                    });
                    const enable = this.shouldEnableNext(geojson);
                    if (enable) {
                        this.props.setNextEnabled();
                    } else {
                        this.props.setNextDisabled();
                    }
                } else {
                    this.showInvalidDrawWarning(true);
                }
            } else if (this.state.mode === MODE_DRAW_BBOX) {
                this.props.updateAoiInfo({
                    ...this.props.aoiInfo,
                    geojson,
                    originalGeojson: geojson,
                    geomType: 'Polygon',
                    title: 'Custom Polygon',
                    description: 'Box',
                    selectionType: 'box',
                });
                const enable = this.shouldEnableNext(geojson);
                if (enable) {
                    this.props.setNextEnabled();
                } else {
                    this.props.setNextDisabled();
                }
            }
            // exit drawing mode
            this.updateMode(MODE_NORMAL);
        }
    }

    private handleDrawStart() {
        clearDraw(this.drawLayer);
    }

    private initializeOpenLayers() {
        this.drawLayer = generateDrawLayer();
        this.markerLayer = generateDrawLayer();
        this.bufferLayer = generateDrawLayer();

        this.markerLayer.setStyle(new Style({
            image: new Circle({
                fill: new Fill({ color: this.props.theme.eventkit.colors.text_primary }),
                stroke: new Stroke({ color: this.props.theme.eventkit.colors.warning, width: 1.25 }),
                radius: 5,
            }),
            fill: new Fill({ color: this.props.theme.eventkit.colors.text_primary }),
            stroke: new Stroke({ color: '#3399CC', width: 1.25 }),
        }));
        this.bufferLayer.setStyle(new Style({
            stroke: new Stroke({
                color: this.props.theme.eventkit.colors.primary,
                width: 3,
            }),
        }));

        this.drawBoxInteraction = generateDrawBoxInteraction(this.drawLayer);
        this.drawBoxInteraction.on('drawstart', this.handleDrawStart);
        this.drawBoxInteraction.on('drawend', this.handleDrawEnd);

        this.drawFreeInteraction = generateDrawFreeInteraction(this.drawLayer);
        this.drawFreeInteraction.on('drawstart', this.handleDrawStart);
        this.drawFreeInteraction.on('drawend', this.handleDrawEnd);

        const img = document.createElement('img');
        img.src = globe;
        img.alt = 'globe';
        img.height = 16;
        img.width = 16;
        this.map = new Map({
            controls: [
                new ScaleLine({
                    className: css.olScaleLineLargeMap,
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
                    label: img,
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
                zoom: this.state.zoomLevel,
                minZoom: 2,
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
        this.map.addLayer(this.bufferLayer);

        this.updateZoomLevel();
        this.map.getView().on('change:resolution', this.updateZoomLevel);
    }

    private updateZoomLevel() {
        const lvl = Math.floor(this.map.getView().getZoom());
        if (lvl !== this.state.zoomLevel) {
            this.setState({ zoomLevel: lvl });
        }
    }

    private upEvent() {
        const upFeature = this.feature;
        if (upFeature) {
            const geom = upFeature.getGeometry();
            const coords = geom.getCoordinates();
            const unwrappedCoords = unwrapCoordinates(coords, this.map.getView().getProjection());
            geom.setCoordinates(unwrappedCoords);
            const geo = new GeoJSONFormat();
            const geojson = geo.writeFeaturesObject(this.drawLayer.getSource().getFeatures(), {
                dataProjection: WGS84,
                featureProjection: WEB_MERCATOR,
            });
            if (isGeoJSONValid(geojson)) {
                this.props.updateAoiInfo({
                    ...this.props.aoiInfo,
                    geojson,
                    originalGeojson: geojson,
                    buffer: 0,
                });
                this.showInvalidDrawWarning(false);
                const enable = this.shouldEnableNext(geojson);
                if (enable) {
                    this.props.setNextEnabled();
                } else {
                    this.props.setNextDisabled();
                }
            } else {
                this.props.setNextDisabled();
                this.showInvalidDrawWarning(true);
            }
        }
        this.coordinate = null;
        this.feature = null;
        return false;
    }

    private dragEvent(evt: any) {
        const dragFeature = this.feature;
        let coords = dragFeature.getGeometry().getCoordinates()[0];
        // create new coordinates for the feature based on new drag coordinate
        if (isBox(dragFeature)) {
            coords = coords.map((coord) => {
                const newCoord = [...coord];
                if (coord[0] === this.coordinate[0]) {
                    [newCoord[0]] = evt.coordinate;
                }
                if (coord[1] === this.coordinate[1]) {
                    [, newCoord[1]] = evt.coordinate;
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

    private moveEvent(evt: any) {
        const { map } = evt;
        const { pixel } = evt;
        if (this.markerLayer.getSource().getFeatures().length > 0) {
            clearDraw(this.markerLayer);
        }
        const opts = { layerFilter: layer => (layer === this.drawLayer) };
        if (map.hasFeatureAtPixel(pixel, opts)) {
            const mapFeatures = map.getFeaturesAtPixel(pixel, opts);
            for (const feature of mapFeatures) {
                const geomType = feature.getGeometry().getType();
                if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
                    if (isViewOutsideValidExtent(this.map.getView())) {
                        goToValidExtent(this.map.getView());
                    }
                    const coords = isVertex(pixel, feature, 10, map);
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

    private downEvent(evt: any) {
        const { map } = evt;
        const { pixel } = evt;
        const opts = { layerFilter: layer => (layer === this.drawLayer) };
        if (map.hasFeatureAtPixel(pixel, opts)) {
            const mapFeatures = map.getFeaturesAtPixel(pixel, opts);
            for (const feature of mapFeatures) {
                const geomType = feature.getGeometry().getType();
                if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
                    const vertex = isVertex(pixel, feature, 10, map);
                    if (vertex) {
                        this.feature = feature;
                        this.coordinate = vertex;
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private handleZoomToSelection() {
        const reader = new GeoJSONFormat();
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

    private bufferMapFeature() {
        const { bufferFeatures } = this;
        if (!bufferFeatures) {
            return false;
        }
        const reader = new GeoJSONFormat();
        const newFeatures = reader.readFeatures(bufferFeatures, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
        });
        clearDraw(this.drawLayer);
        clearDraw(this.bufferLayer);
        this.drawLayer.getSource().addFeatures(newFeatures);
        this.props.updateAoiInfo({
            ...this.props.aoiInfo,
            geojson: bufferFeatures,
        });
        const enable = this.shouldEnableNext(bufferFeatures);
        if (enable) {
            this.props.setNextEnabled();
        } else {
            this.props.setNextDisabled();
        }
        return true;
    }

    private handleBufferClick() {
        this.bufferMapFeature();
        this.setState({ showBuffer: false, validBuffer: true });
        this.bufferFeatures = null;
    }

    private openBufferDialog() {
        // this still executes the call to setState immediately
        // but it gives you the option to await the state change to be complete
        return new Promise(async (resolve) => {
            // resolve only when setState is completed
            this.setState({ showBuffer: true }, resolve);
        });
    }

    private closeBufferDialog() {
        this.setState({ showBuffer: false, validBuffer: true });
        this.bufferFeatures = null;
        this.props.updateAoiInfo({ ...this.props.aoiInfo, buffer: 0 });
        clearDraw(this.bufferLayer);
    }

    private handleBufferChange(value: string) {
        const buffer = Number(value);
        if (buffer <= 10000 && buffer >= 0) {
            this.props.updateAoiInfo({ ...this.props.aoiInfo, buffer });
            const { geojson } = this.props.aoiInfo;
            if (Object.keys(geojson).length === 0) {
                return false;
            }
            const reader = new GeoJSONFormat();
            const bufferedFeatureCollection = bufferGeojson(geojson, buffer, true);
            this.bufferFeatures = { ...bufferedFeatureCollection };
            const newFeatures = reader.readFeatures(bufferedFeatureCollection, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857',
            });
            clearDraw(this.bufferLayer);
            if (buffer !== 0 && newFeatures.length === 0) {
                return false;
            }
            this.bufferLayer.getSource().addFeatures(newFeatures);
            return true;
        }
        return this.state.validBuffer;
    }

    private openResetDialog() {
        this.setState({ showReset: true });
    }

    private closeResetDialog() {
        this.setState({ showReset: false });
    }

    private resetAoi() {
        const { originalGeojson } = this.props.aoiInfo;

        const reader = new GeoJSONFormat();
        const newFeatures = reader.readFeatures(originalGeojson, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
        });
        clearDraw(this.drawLayer);
        this.drawLayer.getSource().addFeatures(newFeatures);
        this.props.updateAoiInfo({
            ...this.props.aoiInfo,
            geojson: originalGeojson,
            buffer: 0,
        });
        this.setState({ showReset: false });
        if (this.shouldEnableNext(originalGeojson)) {
            this.props.setNextEnabled();
        } else {
            this.props.setNextDisabled();
        }
    }

    private shouldEnableNext(geojson: GeoJSON.FeatureCollection) {
        const area = allHaveArea(geojson);
        const { max } = this.props.limits;
        if (!max || !area) {
            return area;
        }
        return getSqKm(geojson) <= max;
    }

    private joyrideAddSteps(steps: Step[]) {
        let newSteps = steps;

        if (!Array.isArray(newSteps)) {
            newSteps = [newSteps];
        }

        if (!newSteps.length) {
            return;
        }

        this.setState((currentState: State) => {
            const nextState = { ...currentState };
            nextState.steps = nextState.steps.concat(newSteps);
            return nextState;
        });
    }

    async callback(data: any) {
        const {
            action,
            index,
            type,
            step,
        } = data;

        if (this.bounceBack) {
            // if "bounceBack" that means this callback is being fired as
            // part of an attempt to re-render a step and we want to immediately go forward again.
            // ** See the very long comment at end of function for more details **
            this.bounceBack = false;
            this.setState({ stepIndex: index + 1 });
            return;
        }

        if (!action) {
            return;
        }

        if (action === 'close' || action === 'skip' || type === 'finished') {
            if (this.state.fakeData === true) {
                // if we loaded fake data we need to clean it all up
                this.handleCancel();
                this.props.clearExportInfo();
                this.setAllButtonsDefault();
                if (this.state.showBuffer) {
                    this.setState({ showBuffer: false });
                }
                this.handleResetMap();
                this.setState({ fakeData: false });
            }

            this.setState({ isRunning: false, stepIndex: 0 });
            this.props.onWalkthroughReset();
            this.joyride.reset(true);
        } else {
            if (index === 2 && type === 'step:before') {
                //  if there is no aoi we load some fake data
                if (this.props.aoiInfo.description === null) {
                    this.drawFakeBbox();
                    this.setState({ fakeData: true });
                } else { // otherwise just zoom to whats already there
                    this.handleZoomToSelection();
                }
            }
            // if the buffer dialog is open we need to close it so its not hiding the AOI info
            if (step.selector === '.qa-AoiInfobar-body' && type === 'tooltip:before' && this.state.showBuffer) {
                this.closeBufferDialog();
            }
            // if we are done highlighting the buffer dialog we need to close it again
            if (step.selector === '.qa-BufferDialog-main' && type === 'step:after') {
                this.closeBufferDialog();
            }
            // if step:after or error we will want to advance to the next step
            if (type === 'step:after' || type === 'error:target_not_found') {
                if (type === 'error:target_not_found' && step.selector === '.qa-BufferDialog-main') {
                    // Okay, we can probably all agree that this is a very janky solution, but it
                    // was the best fix I could come up with of given the serious limitations of react-joyride at this time (v1.11.4).
                    // We cannot open the buffer dialog prior to the buffer step because it will be too soon
                    // and cover the AOI Infobar while that is being highlighted.
                    // We also cannot open the buffer dialog in the buffer step because the "before:step" type happens
                    // at the same time that react-joyride checks if an element exists.
                    // The solution here is to accept that the buffer will not be open before react-joyride checks for its existance.
                    // With that in mind we can check for the not_found error related to the buffer dialog.
                    // When that error happens we open and wait for the dialog
                    // then do a weird back and forth to get the tour to re-render the buffer step.

                    // this lets the callback know that the nextime it is call it needs to simple go forward to the next step and exit
                    this.bounceBack = true;
                    // open the buffer dialog and wait for it to complete
                    await this.openBufferDialog();
                    // once the dialog is open we go back to the previous step which will then forward to this step again,
                    // causing the tour step to render correctly this time
                    this.setState({ stepIndex: index - 1 });
                } else {
                    // If we are not accounting for the stupid buffer issue, just go the the proper step index
                    this.setState({ stepIndex: index + (action === 'back' ? -1 : 1) });
                }
            }
        }
    }

    private drawFakeBbox() {
        //  generate fake coordinates and have the map zoom to them.
        clearDraw(this.drawLayer);
        const coords = [
            [
                [55.25307655334473, 25.256418028713934],
                [55.32946586608887, 25.256418028713934],
                [55.32946586608887, 25.296621588996263],
                [55.25307655334473, 25.296621588996263],
                [55.25307655334473, 25.256418028713934],
            ],
        ];
        const polygon = new Polygon(coords);
        polygon.transform('EPSG:4326', 'EPSG:3857');
        const feature = new Feature({
            geometry: polygon,
        });
        const geojson = createGeoJSON(polygon) as GeoJSON.FeatureCollection;
        this.drawLayer.getSource().addFeature(feature);
        this.props.updateAoiInfo({
            ...this.props.aoiInfo,
            geojson,
            originalGeojson: geojson,
            geomType: 'Polygon',
            title: 'Custom Polygon',
            description: 'Box',
            selectionType: 'box',
        });
        this.props.setNextEnabled();
        this.setButtonSelected('box');
        zoomToFeature(feature, this.map);
    }

    render() {
        const { theme } = this.props;
        const { steps, isRunning } = this.state;

        const mapStyle = {
            left: undefined,
            right: '0px',
            backgroundImage: `url(${theme.eventkit.images.topo_light})`,
        };

        if (this.props.drawer === 'open' && isWidthUp('xl', this.props.width)) {
            mapStyle.left = '200px';
        } else {
            mapStyle.left = '0px';
        }

        let aoi = this.props.aoiInfo.geojson;
        if (this.state.showBuffer && this.bufferFeatures) {
            aoi = this.bufferFeatures;
        }

        return (
            <div>
                <Joyride
                    callback={this.callback}
                    ref={(instance) => { this.joyride = instance; }}
                    steps={steps}
                    stepIndex={this.state.stepIndex}
                    autoStart
                    type="continuous"
                    showSkipButton
                    showStepsProgress
                    locale={{
                        back: (<span>Back</span>) as any,
                        close: (<span>Close</span>) as any,
                        last: (<span>Done</span>) as any,
                        next: (<span>Next</span>) as any,
                        skip: (<span>Skip</span>) as any,
                    }}
                    run={isRunning}
                />
                <div id="map" className={css.map} style={mapStyle}>
                    <AoiInfobar
                        aoiInfo={this.props.aoiInfo}
                        showRevert={!!this.props.aoiInfo.buffer}
                        onRevertClick={this.openResetDialog}
                        clickZoomToSelection={this.handleZoomToSelection}
                        handleBufferClick={this.openBufferDialog}
                        limits={this.props.limits}
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
                    />
                    <ZoomLevelLabel
                        zoomLevel={this.state.zoomLevel}
                    />
                    <BufferDialog
                        show={this.state.showBuffer}
                        aoi={aoi}
                        limits={this.props.limits}
                        value={this.props.aoiInfo.buffer}
                        valid={this.state.validBuffer}
                        handleBufferClick={this.handleBufferClick}
                        handleBufferChange={this.bufferFunction}
                        closeBufferDialog={this.closeBufferDialog}
                    />
                    <RevertDialog
                        show={this.state.showReset}
                        onRevertClick={this.resetAoi}
                        onRevertClose={this.closeResetDialog}
                        aoiInfo={this.props.aoiInfo}
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
        clearExportInfo: () => {
            dispatch(clearExportInfo());
        },
    };
}

export default withWidth()(withTheme()(connect(mapStateToProps, mapDispatchToProps)(ExportAOI)));
