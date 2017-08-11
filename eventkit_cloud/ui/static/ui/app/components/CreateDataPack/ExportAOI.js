import 'openlayers/dist/ol.css';
import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import ol from 'openlayers';
import css from '../../styles/ol3map.css';
import {Toolbar, ToolbarGroup, ToolbarSeparator,ToolbarTitle} from 'material-ui/Toolbar';
import AoiInfobar from './AoiInfobar.js';
import SearchAOIToolbar from '../MapTools/SearchAOIToolbar.js';
import DrawAOIToolbar from '../MapTools/DrawAOIToolbar.js';
import InvalidDrawWarning from '../MapTools/InvalidDrawWarning.js';
import DropZone from '../MapTools/DropZone.js';
import {updateMode, updateAoiInfo, clearAoiInfo, stepperNextDisabled, stepperNextEnabled} from '../../actions/exportsActions.js';
import {getGeocode} from '../../actions/searchToolbarActions';
import {processGeoJSONFile, resetGeoJSONFile} from '../../actions/mapToolActions';
import GeoJSONReader from 'jsts/org/locationtech/jts/io/GeoJSONReader';
import isValidOp from 'jsts/org/locationtech/jts/operation/valid/IsValidOp';
import {zoomToExtent} from '../../utils/mapUtils';


export const MODE_DRAW_BBOX = 'MODE_DRAW_BBOX';
export const MODE_NORMAL = 'MODE_NORMAL';
export const MODE_DRAW_FREE = 'MODE_DRAW_FREE';
const WGS84 = 'EPSG:4326';
const WEB_MERCATOR = 'EPSG:3857';

export class ExportAOI extends Component {

    constructor(props) {
        super(props)
        this.setButtonSelected = this.setButtonSelected.bind(this);
        this.setAllButtonsDefault = this.setAllButtonsDefault.bind(this);
        this.toggleImportModal = this.toggleImportModal.bind(this);
        this.showInvalidDrawWarning = this.showInvalidDrawWarning.bind(this);
        this._handleDrawStart = this._handleDrawStart.bind(this);
        this._handleDrawEnd = this._handleDrawEnd.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleZoomToSelection = this.handleZoomToSelection.bind(this);
        this.handleResetMap = this.handleResetMap.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.setMapView = this.setMapView.bind(this);
        this.handleGeoJSONUpload = this.handleGeoJSONUpload.bind(this);
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
        }
    }

    componentDidMount() {
        this._initializeOpenLayers();
        this._updateInteractions();
        if(Object.keys(this.props.aoiInfo.geojson).length != 0) {
            const bbox = this.props.aoiInfo.geojson.features[0].bbox;
            const reader = new ol.format.GeoJSON();
            const feature = reader.readFeatures(this.props.aoiInfo.geojson, {
                dataProjection: WGS84,
                featureProjection: WEB_MERCATOR
            });
            this._drawLayer.getSource().addFeature(feature[0]);
            //this.handleZoomToSelection(bbox);
            this._map.getView().fit(this._drawLayer.getSource().getExtent())
            this.props.setNextEnabled();
        }
    }

    componentDidUpdate() {
        this._map.updateSize();
    }

    componentWillReceiveProps(nextProps) {
        // Check if the map mode has changed (DRAW or NORMAL)
        if(this.props.mode != nextProps.mode) {
            this._updateInteractions(nextProps.mode);
        }
        if(this.props.zoomToSelection.click != nextProps.zoomToSelection.click) {
            const ol3GeoJSON = new ol.format.GeoJSON();
            const geom = ol3GeoJSON.readGeometry(nextProps.aoiInfo.geojson.features[0].geometry, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });

            this.handleZoomToSelection(geom);
        }
        // Check if the reset map button has been clicked
        if(this.props.resetMap.click != nextProps.resetMap.click) {
            this.handleResetMap();
        }
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

    handleCancel(sender) {
        this.showInvalidDrawWarning(false);
        if(this.props.mode != MODE_NORMAL) {
            this.props.updateMode(MODE_NORMAL);
        }
        this._clearDraw();
        this.props.clearAoiInfo();
        this.props.setNextDisabled();
    }

    handleZoomToSelection(geom) {
        if(geom.getType() != 'Point') {
            this._map.getView().fit(
                geom
            );
        } else {
            this._map.getView().setCenter(geom.getCoordinates())
        }
    }

    handleResetMap() {
        let worldExtent = ol.proj.transformExtent([-180,-90,180,90], WGS84, WEB_MERCATOR)
        this._map.getView().fit(worldExtent, this._map.getSize());
    }

    handleSearch(result) {
        this._clearDraw();
        this.showInvalidDrawWarning(false);

        const feature = (new ol.format.GeoJSON()).readFeature(result);
        feature.getGeometry().transform(WGS84, WEB_MERCATOR);
        const geojson = createGeoJSON(feature.getGeometry());

        this._drawLayer.getSource().addFeature(feature);
        
        let description = '';
        description = description + (result.country ? result.country : '');
        description = description + (result.province ? ', ' + result.province : '');
        description = description + (result.region ? ', ' + result.region : '');

        this.props.updateAoiInfo(geojson, result.geometry.type, result.name, description);
        this.handleZoomToSelection(feature.getGeometry());
        if(feature.getGeometry().getType()=='Polygon' || feature.getGeometry().getType()=='MultiPolygon') {
            this.props.setNextEnabled();
            return true;
        }
    }

    handleGeoJSONUpload(geom) {
        this._clearDraw();
        this._drawLayer.getSource().addFeature(
            new ol.Feature({
                geometry: geom
            })
        )
        const geojson = createGeoJSON(geom);
        this.handleZoomToSelection(geom);
        this.props.updateAoiInfo(geojson, geom.getType(), 'Custom Area', 'Import');
        this.props.setNextEnabled();

    }

    setMapView() {
        this._clearDraw();
        const extent = this._map.getView().calculateExtent(this._map.getSize());
        const geom = new ol.geom.Polygon.fromExtent(extent);
        const geojson = createGeoJSON(geom);
        const bboxFeature = new ol.Feature({
            geometry: geom
        });
        const bbox = serialize(extent)
        this._drawLayer.getSource().addFeature(bboxFeature);
        this.props.updateAoiInfo(geojson, 'Polygon', 'Custom Polygon', 'Map View');
        this.props.setNextEnabled();
    }


    _activateDrawInteraction(mode) {
        if(mode == MODE_DRAW_BBOX) {
            this._drawFreeInteraction.setActive(false);
            this._drawBoxInteraction.setActive(true);
        }
        else if(mode == MODE_DRAW_FREE) {
            this._drawBoxInteraction.setActive(false);
            this._drawFreeInteraction.setActive(true);
        }
    }

    _clearDraw() {
        this._drawLayer.getSource().clear();
    }

    _deactivateDrawInteraction() {
        this._drawBoxInteraction.setActive(false);
        this._drawFreeInteraction.setActive(false);
    }

    _handleDrawEnd(event) {
        // get the drawn bounding box
        const geometry = event.feature.getGeometry();
        const geojson = createGeoJSON(geometry);
        const bbox = geojson.features[0].bbox;
        //make sure the user didnt create a polygon with no area
        if(bbox[0] != bbox[2] && bbox[1] != bbox[3]) {
            if (this.props.mode == MODE_DRAW_FREE) {
                let drawFeature = new ol.Feature({
                    geometry: geometry
                });
                this._drawLayer.getSource().addFeature(drawFeature);

                if(isGeoJSONValid(geojson)) {
                    this.props.updateAoiInfo(geojson, 'Polygon', 'Custom Polygon', 'Draw');
                    this.props.setNextEnabled();
                }
                else {
                    this.showInvalidDrawWarning(true);
                }
            }
            else if (this.props.mode == MODE_DRAW_BBOX) {
                const bbox = serialize(geometry.getExtent());
                this.props.updateAoiInfo(geojson, 'Polygon', 'Custom Polygon', 'Box');
                this.props.setNextEnabled();
            }
            // exit drawing mode
            this.props.updateMode('MODE_NORMAL');
        }
    }

    _handleDrawStart() {
        this._clearDraw();
    }


    _initializeOpenLayers() {

        const scaleStyle = {
            background: 'white',
        };

        ol.control.ZoomExtent = zoomToExtent;
        ol.inherits(ol.control.ZoomExtent, ol.control.Control);

        this._drawLayer = generateDrawLayer();
        this._drawBoxInteraction = _generateDrawBoxInteraction(this._drawLayer);
        this._drawBoxInteraction.on('drawstart', this._handleDrawStart);
        this._drawBoxInteraction.on('drawend', this._handleDrawEnd);

        this._drawFreeInteraction = _generateDrawFreeInteraction(this._drawLayer);
        this._drawFreeInteraction.on('drawstart', this._handleDrawStart);
        this._drawFreeInteraction.on('drawend', this._handleDrawEnd);

        this._map = new ol.Map({
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
                    source: new ol.source.OSM()
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

        this._map.addInteraction(this._drawBoxInteraction);
        this._map.addInteraction(this._drawFreeInteraction);
        this._map.addLayer(this._drawLayer);
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

        let buttonClass = `${css.draw || ''} ol-unselectable ol-control`

        return (
            <div>
                <div id="map" className={css.map}  style={mapStyle} ref="olmap">
                    <AoiInfobar />
                    <SearchAOIToolbar
                        handleSearch={(result) => this.handleSearch(result)}
                        handleCancel={(sender) => this.handleCancel(sender)}
                        geocode={this.props.geocode}
                        toolbarIcons={this.state.toolbarIcons}
                        getGeocode={this.props.getGeocode}
                        setAllButtonsDefault={this.setAllButtonsDefault}
                        setSearchAOIButtonSelected={() => {this.setButtonSelected('search')}} 
                    />
                    <DrawAOIToolbar
                        toolbarIcons={this.state.toolbarIcons}
                        updateMode={this.props.updateMode}
                        handleCancel={(sender) => this.handleCancel(sender)}
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

    _updateInteractions(mode) {
        switch (mode) {
            case MODE_DRAW_BBOX:
                this._activateDrawInteraction(MODE_DRAW_BBOX);
                break
            case MODE_DRAW_FREE:
                this._activateDrawInteraction(MODE_DRAW_FREE);
                break
            case MODE_NORMAL:
                this._deactivateDrawInteraction();
                break
        }
    }
}

ExportAOI.propTypes = {
    aoiInfo: PropTypes.object,
    mode: PropTypes.string,
    zoomToSelection: PropTypes.object,
    resetMap: PropTypes.object,
    importGeom: PropTypes.object,
    drawerOpen: PropTypes.bool,
    geocode: PropTypes.object,
    updateMode: PropTypes.func,
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
        mode: state.mode,
        zoomToSelection: state.zoomToSelection,
        resetMap: state.resetMap,
        importGeom: state.importGeom,
        drawerOpen: state.drawerOpen,
        geocode: state.geocode,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        updateMode: (newMode) => {
            dispatch(updateMode(newMode));
        },
        updateAoiInfo: (geojson, geomType, title, description) => {
            dispatch(updateAoiInfo(geojson, geomType, title, description));
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



function generateDrawLayer() {
    return new ol.layer.Vector({
        source: new ol.source.Vector({
            wrapX: false
        }),
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#ce4427',
                width: 3,
            }),
            image: new ol.style.Icon({
                src: require("../../../images/ic_room_black_24px.svg"),
            })

        })
    })
}

function _generateDrawBoxInteraction(drawLayer) {

    const draw = new ol.interaction.Draw({
        source: drawLayer.getSource(),
        type: 'Circle',
        geometryFunction: ol.interaction.Draw.createBox(),
        style: new ol.style.Style({
            image: new ol.style.RegularShape({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                points: 4,
                radius: 15,
                radius2: 0,
                angle: 0
            }),
            stroke: new ol.style.Stroke({
                color: '#ce4427',
                width: 2,
                lineDash: [5, 5]
            })
        })
    })
    draw.setActive(false)
    return draw
}

function _generateDrawFreeInteraction(drawLayer) {
    const draw = new ol.interaction.Draw({
        source: drawLayer.getSource(),
        type: 'Polygon',
        freehand: true,
        style: new ol.style.Style({
            image: new ol.style.RegularShape({
                stroke: new ol.style.Stroke({
                    color: 'black',
                    width: 1
                }),
                points: 4,
                radius: 15,
                radius2: 0,
                angle: 0
            }),
            stroke: new ol.style.Stroke({
                color: '#ce4427',
                width: 2,
                lineDash: [5, 5]
            })
        })
    })
    draw.setActive(false)
    return draw
}



function truncate(number) {
    return Math.round(number * 100000) / 100000
}

function unwrapPoint([x, y]) {
    return [
        x > 0 ? Math.min(180, x) : Math.max(-180, x),
        y
    ]
}

function featureToBbox(feature) {
    const reader = new ol.format.GeoJSON()
    const geometry = reader.readGeometry(feature.geometry, {featureProjection: WEB_MERCATOR})
    return geometry.getExtent()
}

function deserialize(serialized) {
    if (serialized && serialized.length === 4) {
        return ol.proj.transformExtent(serialized, WGS84, WEB_MERCATOR)
    }
    return null
}

function serialize(extent) {
    const bbox = ol.proj.transformExtent(extent, WEB_MERCATOR, WGS84)
    const p1 = unwrapPoint(bbox.slice(0, 2))
    const p2 = unwrapPoint(bbox.slice(2, 4))
    return p1.concat(p2).map(truncate)
}

function isGeoJSONValid(geojson) {
    // creates a jsts GeoJSONReader
    const parser = new GeoJSONReader();
    // reads in geojson geometry and returns a jsts geometry
    const geom = parser.read(geojson.features[0].geometry);
    // return whether the geom is valid
    return isValidOp.isValid(geom);
}

function createGeoJSON(ol3Geometry) {
    const bbox = serialize(ol3Geometry.getExtent());
    const geom = ol3Geometry.clone();
    geom.transform(WEB_MERCATOR, WGS84);
    const wgs84Coords = geom.getCoordinates();
    const geojson = {"type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "bbox": bbox,
                            "geometry": {"type": geom.getType(), "coordinates": wgs84Coords}
                        }
                    ]}
    return geojson;
}
