import 'openlayers/dist/ol.css';
import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import ol from 'openlayers';
import css from '../../styles/ol3map.css';
import AoiInfobar from './AoiInfobar.js';
import SearchAOIToolbar from '../MapTools/SearchAOIToolbar.js';
import DrawAOIToolbar from '../MapTools/DrawAOIToolbar.js';
import InvalidDrawWarning from '../MapTools/InvalidDrawWarning.js';
import DropZone from '../MapTools/DropZone.js';
import {updateAoiInfo, clearAoiInfo, stepperNextDisabled, stepperNextEnabled} from '../../actions/exportsActions.js';
import {getGeocode} from '../../actions/searchToolbarActions';
import {processGeoJSONFile, resetGeoJSONFile} from '../../actions/mapToolActions';
import GeoJSONReader from 'jsts/org/locationtech/jts/io/GeoJSONReader';
import {generateDrawLayer, generateDrawBoxInteraction, generateDrawFreeInteraction, 
    serialize, isGeoJSONValid, createGeoJSON, zoomToExtent, clearDraw,
    MODE_DRAW_BBOX, MODE_NORMAL, MODE_DRAW_FREE, zoomToGeometry, unwrapCoordinates,
    isViewOutsideValidExtent, goToValidExtent} from '../../utils/mapUtils'

export const WGS84 = 'EPSG:4326';
export const WEB_MERCATOR = 'EPSG:3857';

export class ExportAOI extends Component {

    constructor(props) {
        super(props)
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
        this.state = {
            toolbarIcons: {
                box: "DEFAULT",
                free: "DEFAULT",
                mapView: "DEFAULT",
                import: "DEFAULT",
                search: "DEFAULT",
            },
            showImportModal: false,
            showInvalidDrawWarning: false,
            mode: MODE_NORMAL
        }
    }

    componentDidMount() {
        this.initializeOpenLayers();
        if(Object.keys(this.props.aoiInfo.geojson).length != 0) {
            const bbox = this.props.aoiInfo.geojson.features[0].bbox;
            const reader = new ol.format.GeoJSON();
            const feature = reader.readFeatures(this.props.aoiInfo.geojson, {
                dataProjection: WGS84,
                featureProjection: WEB_MERCATOR
            });
            this.drawLayer.getSource().addFeature(feature[0]);
            this.map.getView().fit(this.drawLayer.getSource().getExtent())
            this.props.setNextEnabled();
            this.setButtonSelected(this.props.aoiInfo.selectionType);
        }
    }

    componentDidUpdate() {
        this.map.updateSize();
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.importGeom.processed && !this.props.importGeom.processed) {
            this.handleGeoJSONUpload(nextProps.importGeom.geom);
        }
    }

    setButtonSelected(iconName) {
        const icons = {...this.state.toolbarIcons};
        Object.keys(icons).forEach((key) => {
            if (key == iconName) {
                icons[key] = 'SELECTED';
            }
            else {
                icons[key] = 'INACTIVE';
            }
        });
        this.setState({toolbarIcons: icons});
    }

    setAllButtonsDefault() {
        const icons = {...this.state.toolbarIcons};
        Object.keys(icons).forEach((key) => {
            icons[key] = 'DEFAULT';
        });
        this.setState({toolbarIcons: icons});
    }

    toggleImportModal(show) {
        if (show != undefined) {
            this.setState({showImportModal: show});
        }
        else {
            this.setState({showImportModal: !this.state.showImportModal});
        }
    }

    showInvalidDrawWarning(show) {
        if (show != undefined) {
            this.setState({showInvalidDrawWarning: show});
        }
        else {
            this.setState({showInvalidDrawWarning: !this.state.showInvalidDrawWarning});
        }
    }

    handleCancel() {
        this.showInvalidDrawWarning(false);
        if(this.state.mode != MODE_NORMAL) {
            this.updateMode(MODE_NORMAL);
        }
        clearDraw(this.drawLayer);
        this.props.clearAoiInfo();
        this.props.setNextDisabled();
    }

    handleResetMap() {
        let worldExtent = ol.proj.transformExtent([-180,-90,180,90], WGS84, WEB_MERCATOR)
        this.map.getView().fit(worldExtent, this.map.getSize());
    }

    handleSearch(result) {
        clearDraw(this.drawLayer);
        this.showInvalidDrawWarning(false);

        const feature = (new ol.format.GeoJSON()).readFeature(result);
        feature.getGeometry().transform(WGS84, WEB_MERCATOR);
        const geojson = createGeoJSON(feature.getGeometry());

        this.drawLayer.getSource().addFeature(feature);

        let description = '';
        description = description + (result.country ? result.country : '');
        description = description + (result.province ? ', ' + result.province : '');
        description = description + (result.region ? ', ' + result.region : '');

        this.props.updateAoiInfo(geojson, result.geometry.type, result.name, description, 'search');
        zoomToGeometry(feature.getGeometry(), this.map);
        if(feature.getGeometry().getType()=='Polygon' || feature.getGeometry().getType()=='MultiPolygon') {
            this.props.setNextEnabled();
        }
        return true;
    }

    handleGeoJSONUpload(geom) {
        clearDraw(this.drawLayer);
        this.drawLayer.getSource().addFeature(
            new ol.Feature({
                geometry: geom
            })
        );
        const geojson = createGeoJSON(geom);
        zoomToGeometry(geom, this.map);
        this.props.updateAoiInfo(geojson, geom.getType(), 'Custom Area', 'Import', 'import');
        this.props.setNextEnabled();
    }

    setMapView() {
        clearDraw(this.drawLayer);
        const extent = this.map.getView().calculateExtent(this.map.getSize());
        const geom = new ol.geom.Polygon.fromExtent(extent);
        const coords = geom.getCoordinates();
        const unwrappedCoords = unwrapCoordinates(coords, this.map.getView().getProjection());
        geom.setCoordinates(unwrappedCoords);
        const geojson = createGeoJSON(geom);
        const bboxFeature = new ol.Feature({
            geometry: geom
        });
        const bbox = serialize(extent)
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
        //make sure the user didnt create a polygon with no area
        if(bbox[0] != bbox[2] && bbox[1] != bbox[3]) {
            if (this.state.mode == MODE_DRAW_FREE) {
                let drawFeature = new ol.Feature({
                    geometry: geometry
                });
                this.drawLayer.getSource().addFeature(drawFeature);

                if(isGeoJSONValid(geojson)) {
                    this.props.updateAoiInfo(geojson, 'Polygon', 'Custom Polygon', 'Draw', 'free');
                    this.props.setNextEnabled();
                }
                else {
                    this.showInvalidDrawWarning(true);
                }
            }
            else if (this.state.mode == MODE_DRAW_BBOX) {
                const bbox = serialize(geometry.getExtent());
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

        ol.control.ZoomExtent = zoomToExtent;
        ol.inherits(ol.control.ZoomExtent, ol.control.Control);

        this.drawLayer = generateDrawLayer();
        this.drawBoxInteraction = generateDrawBoxInteraction(this.drawLayer);
        this.drawBoxInteraction.on('drawstart', this.handleDrawStart);
        this.drawBoxInteraction.on('drawend', this.handleDrawEnd);

        this.drawFreeInteraction = generateDrawFreeInteraction(this.drawLayer);
        this.drawFreeInteraction.on('drawstart', this.handleDrawStart);
        this.drawFreeInteraction.on('drawend', this.handleDrawEnd);

        this.map = new ol.Map({
            controls: [
                new ol.control.ScaleLine({
                    className: css.olScaleLine,
                }),
                new ol.control.Attribution({
                    collapsible: false,
                    collapsed: false,
                }),
                new ol.control.Zoom({
                    className: css.olZoom
                }),
                new ol.control.ZoomExtent({
                    className: css.olZoomToExtent,
                    extent: [-14251567.50789682, -10584983.780136958, 14251787.50789682, 10584983.780136958]
                }),
            ],
            interactions: ol.interaction.defaults({
                keyboard: false,
                altShiftDragRotate: false,
                pinchRotate: false
            }),
            layers: [
                // Order matters here
                new ol.layer.Tile({
                    source: new ol.source.XYZ({
                        url: this.context.config.BASEMAP_URL,
                        wrapX: true
                    })
                }),
            ],
            target: 'map',
            view: new ol.View({
                projection: "EPSG:3857",
                center: [110, 0],
                zoom: 2.5,
                minZoom: 2.5,
                maxZoom: 22,
            })
        });

        this.map.addInteraction(this.drawBoxInteraction);
        this.map.addInteraction(this.drawFreeInteraction);
        this.map.addLayer(this.drawLayer);
    }

    handleZoomToSelection() {
        const ol3GeoJSON = new ol.format.GeoJSON();
        const geom = ol3GeoJSON.readGeometry(this.props.aoiInfo.geojson.features[0].geometry, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });
        zoomToGeometry(geom, this.map);
    }

    render() {
        const mapStyle = {
                right: '0px',
        }

        if(this.props.drawerOpen && window.innerWidth >= 1200) {
            mapStyle.left = '200px';
        }
        else {
            mapStyle.left = '0px';
        }

        let buttonClass = `${css.draw} ol-unselectable ol-control`

        return (
            <div>
                <div id="map" className={css.map}  style={mapStyle} ref="olmap">
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
                        setSearchAOIButtonSelected={() => {this.setButtonSelected('search')}} 
                    />
                    <DrawAOIToolbar
                        toolbarIcons={this.state.toolbarIcons}
                        updateMode={this.updateMode}
                        handleCancel={this.handleCancel}
                        setMapView={this.setMapView}
                        setAllButtonsDefault={this.setAllButtonsDefault}
                        setBoxButtonSelected={() => {this.setButtonSelected('box')}}
                        setFreeButtonSelected={() => {this.setButtonSelected('free')}}
                        setMapViewButtonSelected={() => {this.setButtonSelected('mapView')}}
                        setImportButtonSelected={() => {this.setButtonSelected('import')}} 
                        setImportModalState={this.toggleImportModal}
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
    drawerOpen: PropTypes.bool,
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
        drawerOpen: state.drawerOpen,
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
