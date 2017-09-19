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
        const style ={
            root : {
                width:'100%',
                backgroundImage: 'url('+require('../../../images/topoBackground.jpg')+')',
                backgroundRepeat: 'repeat repeat',
                justifyContent: 'space-around',
                display: 'flex',
                flexWrap: 'wrap',
                height: window.innerHeight - 191
            },
            form : {
                margin: '0 auto',
                width:  window.innerWidth < 800 ? '90%' : '60%',
            },
            paper : {
                margin: '0 auto',
                padding: '20px',
                marginTop: '30px',
                marginBottom: '30px',
                width: '100%',
                maxWidth: '700px',
                overflow: 'hidden'
            },
            heading: {
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'black',
                alignContent: 'flex-start',
                paddingBottom: '5px'
            },
            subHeading: {
                fontSize: '16px',
                alignContent: 'flex-start',
                color: '#8b9396',
                paddingBottom: '10px',
            },
            exportHeading: {
                fontSize: '16px',
                alignContent: 'flex-start',
                color: 'black',
                fontWeight: 'bold',
                paddingTop: '25px',
                paddingBottom: '10px',
            },
            tdHeading: {
                verticalAlign: 'top',
                padding: '10px',
                height:'35px',
                fontSize: '16px',
                width: '33%',
                backgroundColor: '#f8f8f8',
                fontWeight: 'bold',
                color: 'black'
            },
            tdData: {
                padding: '10px',
                height: '35px',
                fontSize: '16px',
                width: '66%',
                backgroundColor: '#f8f8f8',
                fontWeight: 'normal',
                color: '#8b9396'
            },
            table: {
                width: '100%',
                height: '100%',
                border: '0px solid black',
                borderSpacing: '5px',
                borderCollapse: 'separate'
            },
            mapCard : {
                paddingBottom: '20px',
                paddingTop: '15px'
            },
            map : {
                width: '100%',
            }

        }

        const providers = this.props.providers.filter((provider) => {
            return provider.display != false;
        });
        return (
            <div style={style.root}>
                <CustomScrollbar>
                <form style={style.form}  className={'qa-ExportSummary-form'}>
                    <Paper className={'qa-ExportSummary-Paper'} style={style.paper} zDepth={2} rounded>
                        <div id='mainHeading' className={'qa-ExportSummary-mainHeading'} style={style.heading}>Preview and Run Export</div>
                        <div style={style.subHeading} className={'qa-ExportSummary-subHeading'}>
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
                            <div className={'qa-ExportSummary-exportHeading'} style={style.exportHeading}>
                                Export Information
                            </div>
                            <table><tbody>
                            <tr className={'qa-ExportSummary-tr-name'}>
                                <td style={style.tdHeading}>Name</td>
                                <td style={style.tdData}>{this.props.exportName}</td>
                            </tr>
                            <tr className={'qa-ExportSummary-tr-description'}>
                                <td style={style.tdHeading}>Description</td>
                                <td style={style.tdData}>{this.props.datapackDescription}</td>
                            </tr>
                            <tr  className={'qa-ExportSummary-tr-category'}>
                                <td style={style.tdHeading}>Project&nbsp;/ Category</td>
                                <td style={style.tdData}>{this.props.projectName}</td>
                            </tr>
                            <tr className={'qa-ExportSummary-tr-published'}>
                                <td style={style.tdHeading}>Published</td>
                                <td style={style.tdData}>{this.props.makePublic.toString()}</td>
                            </tr>
                            <tr className={'qa-ExportSummary-tr-layers'}>
                                <td style={style.tdHeading}>Layer Data</td>
                                <td style={style.tdData}>{this.props.layers}</td>
                            </tr>
                            <tr  className={'qa-ExportSummary-tr-formats'}>
                                <td style={style.tdHeading} rowSpan={providers.length}>File Formats</td>

                                <td style={style.tdData}>{providers.map((provider) => <p key={provider.uid}>{provider.name}</p>)}</td>

                            </tr>
                            </tbody>
                            </table>
                            <div  className={'qa-ExportSummary-aoiHeading'} style={style.exportHeading}>
                                Area of Interest (AOI)
                            </div>
                            <table style={style.table}><tbody>
                            {/*<tr>
                                <td className={styles.tdHeading}>Region</td>
                                <td className={styles.tdData}>Table Cell Data</td>
                            </tr>
                            */}
                            <tr className={'qa-ExportSummary-tr-area'}>
                                <td style={style.tdHeading}>Area</td>
                                <td style={style.tdData}>{this.props.area_str}</td>
                            </tr>
                            </tbody>
                            </table>
                        </div>
                        <div  className={'qa-ExportSummary-map'} style={style.mapCard}>
                            <Card className={'qa-ExportSummary-Card'}expandable={true}
                                    onExpandChange={this.expandedChange.bind(this)}>
                                <CardHeader
                                    className={'qa-ExportSummary-CardHeader'}
                                    title="Selected Area of Interest"
                                    actAsExpander={true}
                                    showExpandableButton={true}
                                    style={{padding: '12px 10px 10px', backgroundColor: 'rgba(179, 205, 224, .2)'}}
                                    textStyle={{paddingRight: '6px', fontWeight: 'bold', fontSize: '18px'}}
                                />
                                <CardText
                                    className={'qa-ExportSummary-CardText'}
                                    expandable={true}
                                    style={{padding: '5px', backgroundColor: 'rgba(179, 205, 224, .2)'}}>
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

