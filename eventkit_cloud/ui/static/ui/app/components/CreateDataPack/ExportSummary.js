import 'openlayers/dist/ol.css';
import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import ol from 'openlayers';
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';
import CustomScrollbar from '../CustomScrollbar';
import Paper from 'material-ui/Paper';
import styles from '../../styles/ExportSummary.css';

export class ExportSummary extends Component {
    constructor(props) {
        super(props)
        this.state = {
            expanded: false,
        }
    }

    expandedChange(expanded) {
        this.setState({expanded: expanded});
    }

    componentDidUpdate(prevProps, prevState) {
        if(prevState.expanded != this.state.expanded) {
            if(this.state.expanded) {
                this._initializeOpenLayers();
            }
        }
    }

    _initializeOpenLayers() {
        const base = new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: this.context.config.BASEMAP_URL,
                wrapX: true,
                attributions: this.context.config.BASEMAP_COPYRIGHT
            })
        });

        this._map = new ol.Map({
            interactions: ol.interaction.defaults({
                keyboard: false,
                altShiftDragRotate: false,
                pinchRotate: false,
                mouseWheelZoom: false
            }),
            layers: [base],
            target: 'summaryMap',
            view: new ol.View({
                projection: "EPSG:3857",
                center: [110, 0],
                zoom: 2,
                minZoom: 2,
                maxZoom: 22,
            })
        });
        const source = new ol.source.Vector({wrapX: true});
        const geojson = new ol.format.GeoJSON();
        const feature = geojson.readFeatures(this.props.geojson, {
            'featureProjection': 'EPSG:3857',
            'dataProjection': 'EPSG:4326'
        });
        source.addFeatures(feature);
        const layer = new ol.layer.Vector({
            source: source,
        });

        this._map.addLayer(layer);
        this._map.getView().fit(source.getExtent(), this._map.getSize());
    }

    render() {
        const providers = this.props.providers.filter((provider) => {
            return provider.display != false;
        });
        return (
            <div className={styles.root} style={{height: window.innerHeight - 191}}>
                <CustomScrollbar>
                    <form className={styles.form} >
                        <Paper className={styles.paper} zDepth={2} rounded>
                            <div id='mainheading' className={styles.heading}>Preview and Run Export</div>
                            <div id='subheading' className={styles.subHeading}>
                                Please make sure all the information below is correct.
                            </div>
                            <div>
                                <div id='export-information-heading' className={styles.exportHeading}>
                                    Export Information
                                </div>
                                <table id='export-information'>
                                    <tbody>
                                        <tr id='name'>
                                            <td className={styles.tdHeading}>Name</td>
                                            <td className={styles.tdData}>{this.props.exportName}</td>
                                        </tr>
                                        <tr id='description'>
                                            <td className={styles.tdHeading}>Description</td>
                                            <td className={styles.tdData}>{this.props.datapackDescription}</td>
                                        </tr>
                                        <tr id='project'>
                                            <td className={styles.tdHeading}>Project/Category</td>
                                            <td className={styles.tdData}>{this.props.projectName}</td>
                                        </tr>
                                        <tr id='published'>
                                            <td className={styles.tdHeading}>Published</td>
                                            <td className={styles.tdData}>{this.props.makePublic.toString()}</td>
                                        </tr>
                                        <tr id='formats'>
                                            <td className={styles.tdHeading}>File Formats</td>
                                            <td className={styles.tdData}>{this.props.layers}</td>
                                        </tr>
                                        <tr id='layers'>
                                            <td className={styles.tdHeading} rowSpan={providers.length}>Layer Data</td>
                                            <td className={styles.tdData}>{providers.map((provider) => <p key={provider.uid}>{provider.name}</p>)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div id='aoi-heading' className={styles.exportHeading}>
                                    Area of Interest (AOI)
                                </div>
                                <table id='aoi-area'>
                                    <tbody>
                                        <tr>
                                            <td className={styles.tdHeading}>Area</td>
                                            <td className={styles.tdData}>{this.props.area_str}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div id='aoi-map' className={styles.mapCard}>
                                <Card 
                                    expandable={true}
                                    onExpandChange={this.expandedChange.bind(this)}
                                >
                                    <CardHeader
                                        title="Selected Area of Interest"
                                        actAsExpander={true}
                                        showExpandableButton={true}
                                        style={{padding: '12px 10px 10px'}}
                                    />
                                    <CardText 
                                        expandable={true}
                                        style={{padding: '5px'}}
                                    > 
                                        <div id="summaryMap" className={styles.map}/>
                                    </CardText>
                                </Card>
                            </div>
                        </Paper>
                    </form>
                </CustomScrollbar>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        geojson: state.aoiInfo.geojson,
        exportName: state.exportInfo.exportName,
        datapackDescription: state.exportInfo.datapackDescription,
        projectName: state.exportInfo.projectName,
        makePublic: state.exportInfo.makePublic,
        providers: state.exportInfo.providers,
        area_str: state.exportInfo.area_str,
        layers: state.exportInfo.layers,
    }
}

ExportSummary.contextTypes = {
    config: PropTypes.object
}

ExportSummary.propTypes = {
    geojson: PropTypes.object,
    exportName: PropTypes.string,
    datapackDescription: PropTypes.string,
    projectName: PropTypes.string,
    makePublic: PropTypes.bool,
    providers: PropTypes.array,
    area_str: PropTypes.string,
    layers: PropTypes.string,
}

export default connect(
    mapStateToProps,
    null
)(ExportSummary);

