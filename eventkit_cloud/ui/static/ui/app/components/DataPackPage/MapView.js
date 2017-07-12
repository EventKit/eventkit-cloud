import React, {PropTypes, Component} from 'react'
import {GridList} from 'material-ui/GridList'
import DataPackListItem from './DataPackListItem';
import LoadButtons from './LoadButtons';
import CustomScrollbar from '../CustomScrollbar';
import ol from 'openlayers';
import isEqual from 'lodash/isEqual';
import ZoomOut from 'material-ui/svg-icons/maps/zoom-out-map';
import {zoomToExtent} from '../../utils/mapUtils';
import styles from '../../styles/CreateExport.css';

const RED_STYLE = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: '#ce4427',
        width: 6,
        zIndex: 1,
    })
});

const BLUE_STYLE = new ol.style.Style({
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
        this.addRunFeatures = this.addRunFeatures.bind(this);
        this.handleMouseOver = this.handleMouseOver.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.onFeatureSelect = this.onFeatureSelect.bind(this);
        this.state = {
            selected: [],
        }
    }

    componentDidMount() {
        this.map = this.initMap();
        this.selected = [];// selected in the state for rendering, selected here to avoid async issues
        this.selector = new ol.interaction.Select({
            condition: ol.events.condition.pointerMove,
            style: RED_STYLE,
        });
        this.selector.on('select', this.onFeatureSelect);

        this.map.addInteraction(this.selector);
        this.source = new ol.source.Vector({wrapX: false});
        this.layer = new ol.layer.Vector({
            source: this.source,
            style: BLUE_STYLE
        });
        this.map.addLayer(this.layer);
        this.addRunFeatures(this.props.runs, this.source);
        this.map.getView().fit(this.source.getExtent(), this.map.getSize());
    }

    componentWillReceiveProps(nextProps) {
        if(!isEqual(nextProps.runs, this.props.runs)) {
            this.source.clear();
            this.addRunFeatures(nextProps.runs, this.source);
            this.map.getView().fit(this.source.getExtent(), this.map.getSize());
            
        }
    }

    componentDidUpdate() {
        this.map.updateSize();
    }

    addRunFeatures(runs, source) {
        const reader = new ol.format.GeoJSON();
        const features = runs.map((run) => { 
            let feature = reader.readFeature(run.job.extent, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });
            feature.setId(run.uid);
            return feature;
        });
        source.addFeatures(features);
    }

    initMap() {
        ol.control.ZoomExtent = zoomToExtent;
        ol.inherits(ol.control.ZoomExtent, ol.control.Control);
        return new ol.Map({
            controls: [
                // new ol.control.ScaleLine(),
                new ol.control.Attribution({
                    collapsible: false,
                    collapsed: false,
                }),
                // new ol.control.Zoom(),
                new ol.control.ZoomExtent({
                    className: styles.olZoomToExtent,
                    extent: [-14251567.50789682, -10584983.780136958, 14251787.50789682, 10584983.780136958],
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
            })
        });
    }

    handleMouseOver(runId) {
        if(runId) {
            const feature = this.source.getFeatureById(runId) || null;
            if (feature) {
                // feature.setStyle(RED_STYLE);
                // feature.getStyle().setZIndex(100);
                // this.selector.dispatchEvent({
                //     type: 'select',
                //     selected: [feature],
                //     deselected: []
                // });
                this.selector.getFeatures().push(feature);
                this.selector.dispatchEvent({
                    type: 'select',
                    selected: [feature],
                    deselected: []
                });
            }
        }
    }

    handleMouseOut(runId) {
        if (runId) {
            const feature = this.source.getFeatureById(runId) || null;
            if (feature) {
                // feature.setStyle(BLUE_STYLE);
                // feature.getStyle().setZIndex(1);
                this.selector.getFeatures().pop();
                this.selector.dispatchEvent({
                    type: 'select',
                    selected: [],
                    deselected: [feature]
                });
            }
        }
    }

    handleClick(runId) {
        if (runId) {
            const feature = this.source.getFeatureById(runId) || null;
            if (feature) {
                this.map.getView().fit(feature.getGeometry().getExtent(), this.map.getSize());
            }
        }
    }

    onFeatureSelect(evt) {
        const selected = evt.selected;
        const deselected = evt.deselected;
        let uids = [...this.selected];
        if (deselected.length) {
            deselected.forEach((feature) => {
                const ix = uids.indexOf(feature.getId());
                if (ix > -1) {
                    uids.splice(ix, 1);
                }
            });
        }
        if (selected.length) {
            selected.forEach((feature) => {
                if (uids.indexOf(feature.getId()) < 0) {
                    uids.push(feature.getId());
                }
            });
        }
        this.selected = uids; // set it here so since async setState is too slow
        this.setState({selected: [...uids]}); // set it here so the rendering gets updated
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
        };

        const load = <LoadButtons
                range={this.props.range}
                handleLoadLess={this.props.handleLoadLess}
                handleLoadMore={this.props.handleLoadMore}
                loadLessDisabled={this.props.loadLessDisabled}
                loadMoreDisabled={this.props.loadMoreDisabled}
            />
        
        return (
            <div>
                <CustomScrollbar style={{height: window.innerHeight - 236, width: '50%', display: 'inline-block'}}>
                    <div style={styles.root}>
                        <GridList
                            cellHeight={'auto'}
                            cols={1}
                            padding={0}
                            style={{width: window.innerWidth - 10, minWidth: '360px'}}
                        >   
                        {this.props.runs.map((run) => (
                            <DataPackListItem 
                                run={run} 
                                user={this.props.user} 
                                key={run.uid}
                                onRunDelete={this.props.onRunDelete}
                                onHoverStart={this.handleMouseOver}
                                onHoverEnd={this.handleMouseOut}
                                onClick={this.handleClick}
                                backgroundColor={this.state.selected.indexOf(run.uid) > -1 ? '#e9ecec': null}
                            />
                        ))}
                        </GridList>
                    </div>
                    {load}
                </CustomScrollbar>
                <div style={{width: '50%', height: window.innerHeight - 236, display: 'inline-block', overflow: 'hidden', padding: '0px 10px 10px 3px'}}>
                    <div style={{width: '100%', height: '100%'}} id='map'/>
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
    open: PropTypes.bool.isRequired,
};

export default MapView;

