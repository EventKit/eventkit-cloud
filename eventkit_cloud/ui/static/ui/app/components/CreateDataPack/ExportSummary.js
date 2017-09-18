import 'openlayers/dist/ol.css';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import ol from 'openlayers';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import '../../components/tap_events'
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';
import CustomScrollbar from '../CustomScrollbar'
import Paper from 'material-ui/Paper'
import styles from '../../styles/ExportSummary.css'

class ExportSummary extends React.Component {
    constructor(props) {
        super(props)
        this.screenSizeUpdate = this.screenSizeUpdate.bind(this);
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

    componentWillMount() {
        window.addEventListener('resize', this.screenSizeUpdate);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.screenSizeUpdate);
    }

    screenSizeUpdate() {
        this.forceUpdate();
    }

    componentDidUpdate(prevProps, prevState) {
        if(prevState.expanded != this.state.expanded) {
            if(this.state.expanded) {
                this._initializeOpenLayers();
            }
        }
    }

    _initializeOpenLayers() {

        var base = new ol.layer.Tile({
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
                        <div id='mainHeading' className={styles.heading}>Preview and Run Export</div>
                        <div className={styles.subHeading}>
                        Please make sure all the information below is correct.
                        </div>

                        <div>
                            {/*<table className={styles.table}><tbody>
                            <tr>
                                    <td className={styles.tdHeading}>User</td>
                                    <td className={styles.tdData}>Table Cell Data</td>
                                </tr>
                                <tr>
                                    <td className={styles.tdHeading}>Job Id</td>
                                    <td className={styles.tdData}>Table Cell Data</td>
                                </tr>
                            </tbody>
                            </table>*/}
                            <div className={styles.exportHeading}>
                                Export Information
                            </div>
                            <table><tbody>
                            <tr>
                                <td className={styles.tdHeading}>Name</td>
                                <td className={styles.tdData}>{this.props.exportName}</td>
                            </tr>
                            <tr>
                                <td className={styles.tdHeading}>Description</td>
                                <td className={styles.tdData}>{this.props.datapackDescription}</td>
                            </tr>
                            <tr>
                                <td className={styles.tdHeading}>Project&nbsp;/ Category</td>
                                <td className={styles.tdData}>{this.props.projectName}</td>
                            </tr>
                            <tr>
                                <td className={styles.tdHeading}>Published</td>
                                <td className={styles.tdData}>{this.props.makePublic.toString()}</td>
                            </tr>
                            <tr>
                                <td className={styles.tdHeading}>Layer Data</td>
                                <td className={styles.tdData}>{this.props.layers}</td>
                            </tr>
                            <tr >
                                <td className={styles.tdHeading} rowSpan={providers.length}>File Formats</td>

                                <td className={styles.tdData}>{providers.map((provider) => <p key={provider.uid}>{provider.name}</p>)}</td>

                            </tr>
                            </tbody>
                            </table>
                            <div className={styles.exportHeading}>
                                Area of Interest (AOI)
                            </div>
                            <table><tbody>
                            {/*<tr>
                                <td className={styles.tdHeading}>Region</td>
                                <td className={styles.tdData}>Table Cell Data</td>
                            </tr>
                            */}
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
                                    style={{padding: '12px 10px 10px'}}
                                />
                                <CardText
                                    expandable={true}
                                    style={{padding: '5px'}}>
                                    <div id="summaryMap" className={styles.map}></div>
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
    config: React.PropTypes.object
}

ExportSummary.propTypes = {
    geojson:         React.PropTypes.object,
}
ExportSummary.childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
};

export default connect(
    mapStateToProps,
)(ExportSummary);

