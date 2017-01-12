import 'openlayers/dist/ol.css'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import ol from 'openlayers'
import styles from './CreateExport.css'
import DrawControl from './openlayers.DrawControl.js'
import {Toolbar, ToolbarGroup, ToolbarSeparator,ToolbarTitle} from 'material-ui/Toolbar'
import SetAOIToolbar from './SetAOIToolbar.js'
import SearchAOIToolbar from './SearchAOIToolbar.js'
import DrawAOIToolbar from './DrawAOIToolbar.js'
import {updateMode, updateBbox} from '../actions/exportsActions.js'
import {toggleDrawCancel, toggleDrawRedraw, toggleDrawSet} from '../actions/drawToolBarActions.js'

export const MODE_DRAW_BBOX = 'MODE_DRAW_BBOX'
export const MODE_NORMAL = 'MODE_NORMAL'
const WGS84 = 'EPSG:4326'
const WEB_MERCATOR = 'EPSG:3857'

export class ExportAOI extends Component {

    constructor(props) {
        super(props)
        this._handleDrawStart = this._handleDrawStart.bind(this);
        this._handleDrawEnd = this._handleDrawEnd.bind(this);
        this.handleDrawRedraw = this.handleDrawRedraw.bind(this);
        this.handleDrawCancel = this.handleDrawCancel.bind(this);
        this.handleZoomToSelection = this.handleZoomToSelection.bind(this);
        this.handleResetMap = this.handleResetMap.bind(this);
    }

    componentDidMount() {
        this._initializeOpenLayers();
        this._updateInteractions();

    }

    componentWillReceiveProps(nextProps) {
        // Check if the map mode has changed (DRAW or NORMAL)
        if(this.props.mode != nextProps.mode) {
            console.log(this.props.mode, nextProps.mode);
            this._updateInteractions(nextProps.mode);
        }
        // Check if the draw box button has been clicked
        if(this.props.drawBoxButton.click != nextProps.drawBoxButton.click) {
//            this.handleDrawBoxClick();
        }
        // Check if cancel button has been clicked
        if(this.props.drawCancel.click != nextProps.drawCancel.click) {
            this.handleDrawCancel();
        }
        // Check if redraw button has been clicked
        if(this.props.drawRedraw.click != nextProps.drawRedraw.click) {
            this.handleDrawRedraw();
        }
        // Check if zoom to selection button has been clicked
        if(this.props.zoomToSelection.click != nextProps.zoomToSelection.click) {
            this.handleZoomToSelection(nextProps.bbox);
        }
        // Check if the reset map button has been clicked
        if(this.props.resetMap.click != nextProps.resetMap.click) {
            this.handleResetMap();
        }
    }

    handleDrawRedraw() {
        this._clearDraw();
        this.props.updateBbox([]);
    }

    handleDrawCancel() {
        this._clearDraw();
        this._deactivateDrawInteraction();
        this.props.updateBbox([]);
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



    _activateDrawInteraction() {
        this._drawInteraction.setActive(true)
    }

    _clearDraw() {
        this._drawLayer.getSource().clear()
    }

    _deactivateDrawInteraction() {
        this._drawInteraction.setActive(false)
    }

    _handleDrawEnd(event) {
        // exit drawing mode
        this.props.updateMode('MODE_NORMAL')
        // make the redraw and set buttons available
        this.props.toggleDrawRedraw(this.props.drawRedraw.disabled)
        this.props.toggleDrawSet(this.props.drawSet.disabled)
        // get the drawn bounding box
        const geometry = event.feature.getGeometry()
        const bbox = serialize(geometry.getExtent())
        this.props.updateBbox(bbox);
    }

    _handleDrawStart() {
        this._clearDraw()
    }

    _initializeOpenLayers() {

        const scaleStyle = {
            background: 'white',
        }

        this._drawLayer = generateDrawLayer()
        this._drawInteraction = generateDrawInteraction(this._drawLayer)
        this._drawInteraction.on('drawstart', this._handleDrawStart)
        this._drawInteraction.on('drawend', this._handleDrawEnd)

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
        })

        this._map.addInteraction(this._drawInteraction);
        this._map.addLayer(this._drawLayer);
    }


    render() {

        let buttonClass = `${styles.draw || ''} ol-unselectable ol-control`


        return (
            <div>
                <div id="map" className={styles.map} ref="olmap">
                    <SetAOIToolbar />
                    <SearchAOIToolbar />
                    <DrawAOIToolbar />
                </div>
            </div>
        );
    }

    _updateInteractions(mode) {
        switch (mode) {
            case MODE_DRAW_BBOX:
                this._activateDrawInteraction()
                break
            case MODE_NORMAL:
                this._clearDraw()
                this._deactivateDrawInteraction()
                break
        }
    }
}

//ExportAOI.propTypes = {
//    bbox:                React.PropTypes.arrayOf(React.PropTypes.number),
//    mode:                React.PropTypes.string.isRequired,
//    onBoundingBoxChange: React.PropTypes.func.isRequired,
//}

function mapStateToProps(state) {
    return {
        bbox: state.bbox,
        mode: state.mode,
        drawCancel: state.drawCancel,
        drawRedraw: state.drawRedraw,
        drawSet: state.drawSet,
        drawBoxButton: state.drawBoxButton,
        zoomToSelection: state.zoomToSelection,
        resetMap: state.resetMap,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        toggleDrawCancel: (currentVisibility) => {
            dispatch (toggleDrawCancel(currentVisibility));
        },
        toggleDrawRedraw: (currentVisibility) => {
            dispatch(toggleDrawRedraw(currentVisibility));
        },
        toggleDrawSet: (currentToggleState) => {
            dispatch(toggleDrawSet(currentToggleState));
        },
        updateMode: (newMode) => {
            dispatch(updateMode(newMode));
        },
        updateBbox: (newBbox) => {
            dispatch(updateBbox(newBbox));
        }
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

function generateDrawInteraction(drawLayer) {
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
