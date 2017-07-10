import React, {PropTypes, Component} from 'react'
import {GridList} from 'material-ui/GridList'
import DataPackListItem from './DataPackListItem';
import LoadButtons from './LoadButtons';
import CustomScrollbar from '../CustomScrollbar';
import ol from 'openlayers';

export class MapView extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.initMap();
    }

    componentDidUpdate() {
        this.map.updateSize();
    }

    initMap() {
        this.map = new ol.Map({
            controls: [
                new ol.control.ScaleLine({
                }),
                new ol.control.Attribution({
                    collapsible: false,
                    collapsed: false,
                }),
                new ol.control.Zoom({
                }),
                new ol.control.ZoomExtent({
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
                                onRunDelete={this.props.onRunDelete}/>
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

