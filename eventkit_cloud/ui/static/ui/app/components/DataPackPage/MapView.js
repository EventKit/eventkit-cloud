import React, {PropTypes, Component} from 'react'
import {GridList} from 'material-ui/GridList'
import DataPackListItem from './DataPackListItem';
import LoadButtons from './LoadButtons';
import MapPopup from './MapPopup';
import CustomScrollbar from '../CustomScrollbar';
import ol from 'openlayers';
import isEqual from 'lodash/isEqual';
import {zoomToExtent} from '../../utils/mapUtils';
import css from '../../styles/ol3map.css';
import {Card, CardHeader, CardTitle, CardActions} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';

export const RED_STYLE = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: '#ce4427',
        width: 6,
        zIndex: 100,
    })
});

export const BLUE_STYLE = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: '#4498c0',
        width: 6,
        zIndex: 1,
    })
});

export class MapView extends Component {
    constructor(props) {
        super(props);
        this.initMap = this.initMap.bind(this);
        this.initOverlay = this.initOverlay.bind(this);
        this.addRunFeatures = this.addRunFeatures.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handlePopupClose = this.handlePopupClose.bind(this);
        this.zoomToSelected = this.zoomToSelected.bind(this);
        this.animate = this.animate.bind(this);
        this.onMapClick = this.onMapClick.bind(this);
        this.state = {
            selectedFeature: null,
            groupedFeatures: [],
            showPopup: false,
        }
    }

    componentDidMount() {
        this.map = this.initMap();
        this.initOverlay();
        this.source = new ol.source.Vector({wrapX: false});
        this.layer = new ol.layer.Vector({
            source: this.source,
            style: BLUE_STYLE
        });
        this.map.addLayer(this.layer);
        this.addRunFeatures(this.props.runs, this.source);
        this.map.getView().fit(this.source.getExtent(), this.map.getSize());
        this.map.on('singleclick', this.onMapClick);
    }

    componentWillReceiveProps(nextProps) {
        // if the runs have changed, clear out old features and re-add with new features
        if(!isEqual(nextProps.runs, this.props.runs)) {
            this.source.clear();
            this.addRunFeatures(nextProps.runs, this.source);
            this.map.getView().fit(this.source.getExtent(), this.map.getSize());
        }
    }

    // update map size so it doesnt look like crap after page resize
    componentDidUpdate() {
        this.map.updateSize();
    }

    // read the extents from the runs and add each feature to the source
    addRunFeatures(runs, source) {
        const reader = new ol.format.GeoJSON();
        const features = runs.map((run) => { 
            let feature = reader.readFeature(run.job.extent, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });
            feature.setId(run.uid);
            feature.setProperties(run);
            return feature;
        });
        source.addFeatures(features);
    }

    // add map with controls and basemap to the page
    initMap() {
        ol.control.ZoomExtent = zoomToExtent;
        ol.inherits(ol.control.ZoomExtent, ol.control.Control);
        return new ol.Map({
            controls: [
                new ol.control.Attribution({
                    collapsible: false,
                    collapsed: false,
                }),
                new ol.control.Zoom({
                    className: css.olZoom
                }),
                new ol.control.ZoomExtent({
                    className: css.olZoomToExtent,
                    extent: [-14251567.50789682, -10584983.780136958, 14251787.50789682, 10584983.780136958],
                }),
                new ol.control.OverviewMap({
                    className: 'ol-overviewmap ' + css['ol-custom-overviewmap'],
                    collapsible: true,
                    collapsed: window.innerWidth < 768 ? true: false,
                }),
            ],
            interactions: ol.interaction.defaults({
                keyboard: false,
                altShiftDragRotate: false,
                pinchRotate: false
            }),
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM({wrapX: false})
                }),
            ],
            target: 'map',
            view: new ol.View({
                projection: "EPSG:3857",
                center: [110, 0],
                zoom: 2,
                minZoom: 2,
                maxZoom: 22,
                extent: [-14251567.50789682, -10584983.780136958, 14251787.50789682, 10584983.780136958]
            })
        });
    }

    initOverlay() {
        this.container = document.getElementById('popup');
        this.content = document.getElementById('popup-content');
        this.closer = document.getElementById('popup-closer');
        this.overlay = new ol.Overlay({
            element: this.container,
            autoPan: true,
            autoPanAnimation: {
                duration: 250
            },
            stopEvent: false
        });
        this.closer.onclick = () => {
            this.overlay.setPosition(undefined);
            this.closer.blur();
            return false;
        }
        this.map.addOverlay(this.overlay);
    }

    // Called when a user clicks on a list item
    handleClick(runId) {
        if (runId) {
            const feature = this.source.getFeatureById(runId) || null;
            if (feature) {
                this.setState({showPopup: false});
                // if there is another feature already selected it needs to be deselected
                if (this.state.selectedFeature && this.state.selectedFeature != feature.getId()) {
                    const oldFeature = this.source.getFeatureById(this.state.selectedFeature);
                    this.setFeatureNotSelected(oldFeature);
                }
                const style = feature.getStyle();
                // if clicked on feature is already selected it should be deselected
                if(style && style == RED_STYLE) {
                    this.setFeatureNotSelected(feature);
                    this.setState({selectedFeature: null});
                }
                // if not already selected the feature should then be selected
                else {
                    this.setFeatureSelected(feature);
                    this.setState({selectedFeature: feature.getId(), showPopup: true});

                    // if the feature in not in current view, center the view on selected feature
                    const mapExtent = this.map.getView().calculateExtent();
                    if(!ol.extent.containsExtent(mapExtent, feature.getGeometry().getExtent())) {
                        this.map.getView().setCenter(ol.extent.getCenter(feature.getGeometry().getExtent()));
                    }
                    // if it is in view trigger an animation
                    else {
                        const start = new Date().getTime();
                        const geom = feature.getGeometry();
                        if (this.listener) {
                            ol.Observable.unByKey(this.listener);
                            this.listener = null;   
                        }
                        this.listener = this.map.on('postcompose', (event) => this.animate(event, geom, start));
                        this.map.render();
                    }
                }
            }
        }
    }

    // animates a circle expanding out from the geometry in question
    animate(event, geom, start) {
        const vectorContext = event.vectorContext;
        const frameState = event.frameState;
        const point = new ol.geom.Point(ol.extent.getCenter(geom.getExtent()));

        const ext = geom.getExtent();
        const tl = this.map.getPixelFromCoordinate(ol.extent.getTopLeft(ext));
        const tr = this.map.getPixelFromCoordinate(ol.extent.getTopRight(ext));
        const bl = this.map.getPixelFromCoordinate(ol.extent.getBottomLeft(ext));
        const width = tr[0] - tl[0];
        const height = bl[1] - tl[1];
        const featureRad = Math.max(width, height);

        const elapsed = frameState.time - start;
        const elapsedRatio = elapsed / 3000;

        const radius = ol.easing.easeOut(elapsedRatio) * 25 + 5 + featureRad;
        const opacity = ol.easing.easeOut(1 - elapsedRatio);

        const style = new ol.style.Style({
            image: new ol.style.Circle({
                radius: radius,
                snapToPixel: false,
                stroke: new ol.style.Stroke({
                    color: 'rgba(255, 0, 0, ' + opacity + ')',
                    width: 0.25 + opacity
                })
            })
        });
        vectorContext.setStyle(style);
        vectorContext.drawGeometry(point);
        if(elapsed > 3000) {
            ol.Observable.unByKey(this.listener);
            return;
        }
        this.map.render();
    }

    onMapClick(evt) {
        let features = [];
        this.map.forEachFeatureAtPixel(evt.pixel, (feature) => {
            features.push(feature);
        }, {hitTolerance: 3});
        if (features.length) {
            if(features.length == 1) {
                this.handleClick(features[0].getId());
            }
            else {
                this.setState({groupedFeatures: features})
                const coord = evt.coordinate;
                this.overlay.setPosition(coord);
            }
        }
    }

    // checks the state for a selectedFeature ID and zooms to that feature
    zoomToSelected() {
        if (this.state.selectedFeature) {
            const feature = this.source.getFeatureById(this.state.selectedFeature);
            this.map.getView().fit(feature.getGeometry().getExtent(), this.map.getSize());
        }
    }

    // call handleClick with currently selected feature if user closes popup
    handlePopupClose() {
        this.handleClick(this.state.selectedFeature)
    }

    // helper function that changes feature style to unselected
    setFeatureNotSelected(feature) {
        feature.setStyle(BLUE_STYLE);
        feature.getStyle().setZIndex(1);
    }

    // helper function that changes feature style to selected
    setFeatureSelected(feature) {
        feature.setStyle(RED_STYLE);
        feature.getStyle().setZIndex(100);
    }

    render() {
        const styles = {
            root: {
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginLeft: '10px',
                marginRight: '10px',
                paddingBottom: '10px'
            },
            map: window.innerWidth < 768 ? 
            {width: '100%', height: '100%', display: 'block', overflow: 'hidden', padding: '0px 10px 10px', position: 'relative'} 
            :
            {width: '70%', height: window.innerHeight - 236, display: 'inline-block', overflow: 'hidden', padding: '0px 10px 10px 3px', position: 'relative'},
            list: window.innerWidth < 768 ?
            {display: 'none'}
            :
            {height: window.innerHeight - 236, width: '30%', display: 'inline-block'},
            popupContainer: {position: 'absolute', width: `calc(100% - ${window.innerWidth < 768 ? 20 : 13}px)`, bottom: '50px', textAlign: 'center', display: 'relative'}
        };

        const load = <LoadButtons
                range={this.props.range}
                handleLoadLess={this.props.handleLoadLess}
                handleLoadMore={this.props.handleLoadMore}
                loadLessDisabled={this.props.loadLessDisabled}
                loadMoreDisabled={this.props.loadMoreDisabled}
            />
        
        const feature = this.state.selectedFeature ? this.source.getFeatureById(this.state.selectedFeature): null;
        return (
            <div style={{height: window.innerHeight - 236}}>
                <CustomScrollbar style={styles.list}>
                    <div style={styles.root}>
                        <GridList
                            cellHeight={'auto'}
                            cols={1}
                            padding={0}
                            style={{width: '100%'}}
                        >   
                        {this.props.runs.map((run) => (
                            <DataPackListItem 
                                run={run} 
                                user={this.props.user} 
                                key={run.uid}
                                onRunDelete={this.props.onRunDelete}
                                onClick={this.handleClick}
                                backgroundColor={this.state.selectedFeature == run.uid ? '#dedfdf': null}
                            />
                        ))}
                        </GridList>
                    </div>
                    {load}
                </CustomScrollbar>
                <div style={styles.map}>
                    <div style={{width: '100%', height: '100%', position: 'relative'}} id='map'/>
                    <div id="popup" className={css.olPopup}>
                        <a href="#" id="popup-closer" className={css.olPopupCloser}></a>
                        <div id="popup-content">
                            {this.state.groupedFeatures.map((feature, ix) => {
                                return <a 
                                    key={ix}
                                    onClick={() => {this.handleClick(feature.getId()); this.closer.onclick();}}
                                    style={{display: 'block', cursor: 'pointer'}}
                                >
                                    {ix + 1 + ': ' + feature.getProperties().name}
                                </a>
                            })}
                        </div>
                    </div>
                    {this.state.showPopup && feature ?
                        <div style={styles.popupContainer}>
                            <div style={{margin: '0px auto', maxWidth: window.innerWidth < 768 ? '90%' : 'calc(100% - 240px)', minWidth: '250px', display: 'inline-block', textAlign: 'left'}}>
                                <MapPopup 
                                    name={feature.getProperties().name}
                                    event={feature.getProperties().job.event}
                                    detailUrl={`/status/${feature.getProperties().job.uid}`}
                                    handleZoom={this.zoomToSelected}
                                    handlePopupClose={this.handlePopupClose}
                                />
                            </div>
                        </div>
                    :
                        null
                    }
                </div>
            </div>
        )      
    }
}

MapView.propTypes = {
    runs: PropTypes.array.isRequired,
    user: PropTypes.object.isRequired,
    onRunDelete: PropTypes.func.isRequired,
    range: PropTypes.string.isRequired,
    handleLoadLess: PropTypes.func.isRequired,
    handleLoadMore: PropTypes.func.isRequired,
    loadLessDisabled: PropTypes.bool.isRequired,
    loadMoreDisabled: PropTypes.bool.isRequired,
};

export default MapView;
