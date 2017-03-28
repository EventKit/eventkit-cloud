import 'openlayers/dist/ol.css';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import ol from 'openlayers';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import '../components/tap_events'
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';
import Paper from 'material-ui/Paper'
import styles from '../styles/StatusDownload.css'

class StatusDownload extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            expanded: false,
        }
    }

    getChildContext() {
        return {muiTheme: getMuiTheme(baseTheme)};
    }
    expandedChange(expanded) {
        this.setState({expanded: expanded});
    }
    componentDidMount() {

        //TODO: Make a call to get the job and the details.  Put the details in the details box...
        //TODO: Poll using jobuid until the status of the run comes back as completed
    }
    componentDidUpdate(prevProps, prevState) {
        if(prevState.expanded != this.state.expanded) {
            if(this.state.expanded) {
                this._initializeOpenLayers();
            }
        }
    }

    _initializeOpenLayers() {
        console.log(this.props.geojson.features[0])

        const scaleStyle = {
            background: 'white',
        };
        var osm = new ol.layer.Tile({
            source: new ol.source.OSM()
        });

        this._map = new ol.Map({
            interactions: ol.interaction.defaults({
                keyboard: false,
                altShiftDragRotate: false,
                pinchRotate: false
            }),
            layers: [osm],
            target: 'summaryMap',
            view: new ol.View({
                projection: "EPSG:3857",
                center: [110, 0],
                zoom: 2,
                minZoom: 2,
                maxZoom: 22,
            })
        });
        const source = new ol.source.Vector();
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

        return (
            <div className={styles.wholeDiv}>
                <div className={styles.root}>
                    <Paper className={styles.paper} zDepth={2} rounded>
                        <div id='mainHeading' className={styles.heading}>Status & Download</div>
                        <div>
                            <table><tbody>
                            <tr>
                                <td className={styles.tdHeading}>Name</td>
                                <td className={styles.tdData}>{this.props.exportName}</td>
                            </tr>
                            <tr>
                                <td className={styles.tdHeading}>Status</td>
                                <td className={styles.tdData}>Export status here</td>
                            </tr>
                            </tbody>
                            </table>
                            <div className={styles.exportHeading}>
                                Download Options
                            </div>
                            <table><tbody>

                            <tr>
                                <td className={styles.tdHeading}>Area</td>
                                <td className={styles.tdData}>{this.props.area_str}</td>
                            </tr>
                            </tbody>
                            </table>
                        </div>
                        <div className={styles.mapCard}>
                            <Card expandable={true}
                                  onExpandChange={this.expandedChange.bind(this)}>
                                <CardHeader
                                    title="Selected Area of Interest"
                                    actAsExpander={true}
                                    showExpandableButton={true}
                                />
                                <CardText expandable={true}> <div id="summaryMap" className={styles.map} >

                                </div>


                                </CardText>
                            </Card>

                        </div>
                    </Paper>
                </div>
            </div>


        )
    }
}

function mapStateToProps(state) {
    return {
        jobuid: state.submitJob.jobuid,
    }
}

function mapDispatchToProps(dispatch) {
    return {

    }
}



StatusDownload.propTypes = {

}
StatusDownload.childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(StatusDownload);

