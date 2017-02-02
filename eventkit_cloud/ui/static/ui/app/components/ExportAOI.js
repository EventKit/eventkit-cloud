import 'openlayers/dist/ol.css';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import ol from 'openlayers';
import styles from './CreateExport.css';
import DrawControl from './openlayers.DrawControl.js';
import {Toolbar, ToolbarGroup, ToolbarSeparator,ToolbarTitle} from 'material-ui/Toolbar';
import SetAOIToolbar from './SetAOIToolbar.js';
import SearchAOIToolbar from './SearchAOIToolbar.js';
import DrawAOIToolbar from './DrawAOIToolbar.js';
import InvalidDrawWarning from './InvalidDrawWarning.js';
import DropZone from './DropZone.js';
import {updateMode, updateBbox, updateGeojson, unsetAOI} from '../actions/exportsActions.js';
import {toggleDrawSet, hideInvalidDrawWarning, showInvalidDrawWarning, clickDrawSet} from '../actions/drawToolBarActions.js';
import {clearSearchBbox} from '../actions/searchToolbarActions';

export const MODE_DRAW_BBOX = 'MODE_DRAW_BBOX';
export const MODE_NORMAL = 'MODE_NORMAL';
export const MODE_DRAW_FREE = 'MODE_DRAW_FREE';
const WGS84 = 'EPSG:4326';
const WEB_MERCATOR = 'EPSG:3857';
const jsts = require('jsts');
const isEqual = require('lodash/isEqual');

export class ExportAOI extends Component {

    constructor(props) {
        super(props)
        this._handleDrawStart = this._handleDrawStart.bind(this);
        this._handleDrawEnd = this._handleDrawEnd.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handelFreeCancel = this.handleFreeCancel.bind(this);
        this.handleZoomToSelection = this.handleZoomToSelection.bind(this);
        this.handleResetMap = this.handleResetMap.bind(this);
        this.handleSearchBbox = this.handleSearchBbox.bind(this);
        this.setMapView = this.setMapView.bind(this);
        this.handleGeoJSONUpload = this.handleGeoJSONUpload.bind(this);
    }

    componentDidMount() {
        this._initializeOpenLayers();
        this._updateInteractions();
    }

    componentWillReceiveProps(nextProps) {
        // Check if the map mode has changed (DRAW or NORMAL)
        if(this.props.mode != nextProps.mode) {
            this._updateInteractions(nextProps.mode);
        }
        if(this.props.zoomToSelection.click != nextProps.zoomToSelection.click) {
            this.handleZoomToSelection(nextProps.bbox);
        }
        // Check if the reset map button has been clicked
        if(this.props.resetMap.click != nextProps.resetMap.click) {
            this.handleResetMap();
        }
        if(nextProps.searchBbox.length > 0 && nextProps.searchBbox != this.props.searchBbox) {
            this.handleSearchBbox(nextProps.searchBbox);
        }
        if(nextProps.importGeom.processed && !this.props.importGeom.processed) {
            this.handleGeoJSONUpload(nextProps.importGeom.geom);
        }
    }

    handleCancel(sender) {
        this.props.hideInvalidDrawWarning();
        this.props.unsetAOI();
        if(this.props.mode != MODE_NORMAL) {
            this.props.updateMode(MODE_NORMAL);
        }
        this._clearDraw();
        this.props.updateBbox([]);
        this.props.updateGeojson({});
    }

    handleFreeCancel() {
        this._clearDraw();
        this.props.hideInvalidDrawWarning();
        this._deactivateDrawInteraction();
        this.props.unsetAOI();
    }

    handleZoomToSelection(bbox) {
        this._map.getView().fit(
            ol.proj.transformExtent(bbox, WGS84, WEB_MERCATOR),
            this._map.getSize()
        );
    }

    handleResetMap() {
        let worldExtent = ol.proj.transformExtent([-180,-90,180,90], WGS84, WEB_MERCATOR)
        this._map.getView().fit(worldExtent, this._map.getSize());
    }

    handleSearchBbox(bbox) {
        this._clearDraw();
        this.props.hideInvalidDrawWarning();
        bbox = bbox.map(truncate);
        const mercBbox = ol.proj.transformExtent(bbox, WGS84, WEB_MERCATOR);
        const geom = new ol.geom.Polygon.fromExtent(mercBbox);
        const geojson = createGeoJSON(geom);
        const bboxFeature = new ol.Feature({
            geometry: geom
        });
        this._drawLayer.getSource().addFeature(bboxFeature);
        this.props.updateBbox(bbox);
        this.props.updateGeojson(geojson);
        this.handleZoomToSelection(bbox);
        this.props.clickDrawSet();
    }

    handleGeoJSONUpload(geom) {
        this._drawLayer.getSource().addFeature(
            new ol.Feature({
                geometry: geom
            })
        )
        const bbox = serialize(geom.getExtent());
        const geojson = createGeoJSON(geom);
        this.props.updateBbox(bbox);
        this.props.updateGeojson(geojson);


    }

    setMapView() {
        const extent = this._map.getView().calculateExtent(this._map.getSize());
        const geom = new ol.geom.Polygon.fromExtent(extent);
        const geojson = createGeoJSON(geom);
        const bboxFeature = new ol.Feature({
            geometry: geom
        });
        const bbox = serialize(extent)
        this._drawLayer.getSource().addFeature(bboxFeature);
        this.props.updateBbox(bbox);
        this.props.updateGeojson(geojson);
    }


    _activateDrawInteraction(mode) {
        // this._clearDraw()
        if(mode == MODE_DRAW_BBOX) {
            // this.props.unsetAOI();
            // this.props.updateGeojson({});
            // this.props.toggleDrawSet(true);
            // this.props.hideInvalidDrawWarning();
            this._drawFreeInteraction.setActive(false);
            this._drawBoxInteraction.setActive(true);
        }
        else if(mode == MODE_DRAW_FREE) {
            // this.props.unsetAOI();
            // this.props.updateGeojson({});
            // this.props.toggleDrawSet(true);
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
        if (this.props.mode == MODE_DRAW_FREE) {
            let drawFeature = new ol.Feature({
                geometry: geometry
            });
            this._drawLayer.getSource().addFeature(drawFeature);

            if(isGeoJSONValid(geojson)) {
                this.props.updateBbox(serialize(geometry.getExtent()));
                this.props.updateGeojson(geojson);
            }
            else {
                this.props.showInvalidDrawWarning();
            }
        }
        else if (this.props.mode == MODE_DRAW_BBOX) {
            const bbox = serialize(geometry.getExtent());
            this.props.updateBbox(bbox);
            this.props.updateGeojson(geojson);
        }
        // exit drawing mode
        this.props.updateMode('MODE_NORMAL');
    }

    _handleDrawStart() {
        this._clearDraw();
    }

    _initializeOpenLayers() {

        const scaleStyle = {
            background: 'white',
        };

        this._drawLayer = generateDrawLayer();
        this._drawBoxInteraction = _generateDrawBoxInteraction(this._drawLayer);
        this._drawBoxInteraction.on('drawstart', this._handleDrawStart);
        this._drawBoxInteraction.on('drawend', this._handleDrawEnd);

        this._drawFreeInteraction = _generateDrawFreeInteraction(this._drawLayer);
        this._drawFreeInteraction.on('drawstart', this._handleDrawStart);
        this._drawFreeInteraction.on('drawend', this._handleDrawEnd);

        this._map = new ol.Map({
            controls: [
                new ol.control.ScaleLine(),
                new ol.control.Attribution({
                    collapsible: false,
                    collapsed: false,
                }),
                new ol.control.Zoom({
                    className: styles.olZoom
                })
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

        let buttonClass = `${styles.draw || ''} ol-unselectable ol-control`

        return (
            <div>
                <div id="map" className={styles.map} ref="olmap">
                    <SetAOIToolbar />
                    <SearchAOIToolbar />
                    <DrawAOIToolbar handleCancel={(sender) => this.handleCancel(sender)}
                                    setMapView={this.setMapView}/>
                    <InvalidDrawWarning />
                    <DropZone handleGeoJSONUpload={(file) => {this.handleGeoJSONUpload(file)}}/>
                </div>
            </div>
        );
    }

    _updateInteractions(mode) {
        switch (mode) {
            case MODE_DRAW_BBOX:
                // if (this.props.searchBbox.length > 0) {
                //     this.props.clearSearchBbox();
                // }
                this._activateDrawInteraction(MODE_DRAW_BBOX);
                break
            case MODE_DRAW_FREE:
                // if (this.props.searchBbox.length > 0) {
                //     this.props.clearSearchBbox();
                // }
                this._activateDrawInteraction(MODE_DRAW_FREE);
                break
            case MODE_NORMAL:
                // this._clearDraw();
                this._deactivateDrawInteraction();
                break
        }
    }
}


function mapStateToProps(state) {
    return {
        bbox: state.bbox,
        searchBbox: state.searchBbox,
        mode: state.mode,
        drawSet: state.drawSet,
        zoomToSelection: state.zoomToSelection,
        resetMap: state.resetMap,
        importGeom: state.importGeom,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        toggleDrawSet: (isDisabled) => {
            dispatch(toggleDrawSet(isDisabled));
        },
        updateMode: (newMode) => {
            dispatch(updateMode(newMode));
        },
        updateBbox: (newBbox) => {
            dispatch(updateBbox(newBbox));
        },
        clearSearchBbox: () => {
            dispatch(clearSearchBbox());
        },
        hideInvalidDrawWarning: () => {
            dispatch(hideInvalidDrawWarning());
        },
        showInvalidDrawWarning: () => {
            dispatch(showInvalidDrawWarning());
        },
        updateGeojson: (geojson) => {
            dispatch(updateGeojson(geojson));
        },
        unsetAOI: () => {
            dispatch(unsetAOI());
        },
        clickDrawSet: () => {
            dispatch(clickDrawSet());
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
            fill: new ol.style.Fill({
                color: 'hsla(202, 70%, 50%, .35)'
            }),
            stroke: new ol.style.Stroke({
                color: 'hsla(202, 70%, 50%, .7)',
                width: 1,
                lineDash: [5, 5]
            })
        })
    })
}

function _generateDrawBoxInteraction(drawLayer) {
    const draw = new ol.interaction.Draw({
        source: drawLayer.getSource(),
        maxPoints: 2,
        type: 'LineString',
        geometryFunction(coordinates, geometry) {
            geometry = geometry || new ol.geom.Polygon(null)
            const [[x1, y1], [x2, y2]] = coordinates
            geometry.setCoordinates([[[x1, y1], [x1, y2], [x2, y2], [x2, y1], [x1, y1]]])
            return geometry
        },
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
            fill: new ol.style.Fill({
                color: 'hsla(202, 70%, 50%, .6)'
            }),
            stroke: new ol.style.Stroke({
                color: 'hsl(202, 70%, 50%)',
                width: 1,
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
            fill: new ol.style.Fill({
                color: 'hsla(202, 70%, 50%, .6)'
            }),
            stroke: new ol.style.Stroke({
                color: 'hsl(202, 70%, 50%)',
                width: 1,
                lineDash: [5, 5]
            })
        })
    })
    draw.setActive(false)
    return draw
}



function truncate(number) {
    return Math.round(number * 100) / 100
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
    const parser = new jsts.io.GeoJSONReader();
    const jstsGeom = parser.read(geojson);
    const valid = jstsGeom.features[0].geometry.isValid();
    return valid;
}

function createGeoJSON(ol3Geometry) {
    const coords = ol3Geometry.getCoordinates();
    // need to apply transform to a cloned geom but simple geometry does not support .clone() operation.
    const polygonGeom = new ol.geom.Polygon(coords)
    polygonGeom.transform(WEB_MERCATOR, WGS84);
    const wgs84Coords = polygonGeom.getCoordinates();
    const geojson = {"type": "FeatureCollection",
                    "features": [
                        {"type": "Feature",
                        "geometry": {"type": "Polygon", "coordinates": wgs84Coords}}
                    ]}
    return geojson;
}

function processGeoJSONFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
        const dataURL = reader.result;
        const geojsonReader = new ol.format.GeoJSON();
        const geom = geojsonReader.readFeatures(JSON.parse(dataURL));
        console.log(geom);
        return geom;
    }
    return reader.readAsText(file);
}
