import 'openlayers/dist/ol.css'
import React, {Component} from 'react'
import ol from 'openlayers'
import styles from './CreateExport.css'
import DrawControl from './openlayers.DrawControl.js'
import {Toolbar, ToolbarGroup, ToolbarSeparator,ToolbarTitle} from 'material-ui/Toolbar'
import SetAOIToolbar from './SetAOIToolbar.js'

export const MODE_DRAW_BBOX = 'MODE_DRAW_BBOX'
export const MODE_NORMAL = 'MODE_NORMAL'
const WGS84 = 'EPSG:4326'
const WEB_MERCATOR = 'EPSG:3857'

export default class ExportAOI extends Component {

    constructor(props) {
        super(props)
        this._handleDrawStart = this._handleDrawStart.bind(this)
        this._handleDrawEnd = this._handleDrawEnd.bind(this)
        this.drawClicked = this.drawClicked.bind(this);
        this.state = {mode: MODE_NORMAL}
    }

    componentDidMount() {
        this._initializeOpenLayers()
        this._updateInteractions()

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
        const geometry = event.feature.getGeometry()
        const bbox = serialize(geometry.getExtent())
        console.log('marco')
        this.props.onBoundingBoxChange(bbox)
    }

    _handleDrawStart() {
        this._clearDraw()
        this.props.onBoundingBoxChange(null)
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
//        const scaleLine = new ol.control.ScaleLine({
//            className: styles.olScale
//        });
//        this._map.addControl(scaleLine);
//
//        const attribution = new ol.control.Attribution();
//        this._map.addControl(attribution);

//        const zoomSlider = new ol.control.ZoomSlider();
//        this._map.addControl(zoomSlider);

//        const mousePosition = new ol.control.MousePosition({
//            coordinateFormat: ol.coordinate.toStringHDMS,
//            projection: 'EPSG:4326'
//        });
//        this._map.addControl(mousePosition);

//        const fullScreen = new ol.control.FullScreen();
//        this._map.addControl(fullScreen);

        this._map.addInteraction(this._drawInteraction);
        this._map.addLayer(this._drawLayer);
    }


    render() {

        let buttonClass = `${styles.draw || ''} ol-unselectable ol-control`


        return (
            <div>
                <div id="map" className={styles.map} ref="olmap">
                    <SetAOIToolbar />
                </div>

                <div className={buttonClass}><button onClick={this.drawClicked} style={{width:'80px'}}><i className="fa fa-plus fa-1x">  BOX</i></button></div>

            </div>
        );
    }


    drawClicked() {
        this.setState({mode: 'MODE_DRAW_BBOX'},
            function(){
                this._updateInteractions();
            })
    }

    _updateInteractions() {
        switch (this.state.mode) {
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

ExportAOI.propTypes = {
    bbox:                React.PropTypes.arrayOf(React.PropTypes.number),
    mode:                React.PropTypes.string.isRequired,
    onBoundingBoxChange: React.PropTypes.func.isRequired,
}

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
