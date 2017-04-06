import React, {PropTypes, Component} from 'react'
import {connect} from 'react-redux';
import ol from 'openlayers';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import '../tap_events'
import DataPackDetails from './DataPackDetails'
import styles from '../../styles/StatusDownload.css'

class DataCartDetails extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            cartDetails: {},
            statusBackgroundColor: '',
            statusFontColor: '',
        };

    }

    getChildContext() {
        return {muiTheme: getMuiTheme(baseTheme)};
    }
    expandedChange(expanded) {

    }
    componentWillReceiveProps(nextProps) {
        if(nextProps.datacartDetails.fetched != this.props.datacartDetails.fetched) {
            if (nextProps.datacartDetails.fetched == true) {
                let cartDetails = nextProps.datacartDetails.data;
                this.setState({cartDetails: cartDetails});

            }
        }
    }

    componentDidMount(){
        this._initializeOpenLayers();
        this._setTableColors();

    }
    componentDidUpdate(prevProps, prevState) {

    }

    _setTableColors() {
        switch(this.props.cartDetails.status) {
            case 'COMPLETED':
                return this.setState({statusBackgroundColor: '#bcdfbb',statusFontColor: '#55ba63',});
            case 'SUBMITTED':
                return this.setState({statusBackgroundColor: '#fae9ad',statusFontColor: '#f4d225',});
            case 'INCOMPLETE':
                return this.setState({statusBackgroundColor: '#e8ac90',statusFontColor: '#ce4427',});
            default:
                return this.setState({statusBackgroundColor: '#f8f8f8',statusFontColor: '#8b9396',});
        }
    }
    _initializeOpenLayers() {

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
        const feature = geojson.readFeatures(this.props.cartDetails.job.extent, {
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
    let localStyles = {
    tdData: {
            padding: '10px',
            height: '35px',
            fontSize: '16px',
            backgroundColor: this.state.statusBackgroundColor,

            color: this.state.statusFontColor,
        },

}
        return (
        <div>
            <div>
                <table><tbody>
                <tr>
                    <td className={styles.tdHeading} style={{width:'15%'}}>Name</td>
                    <td className={styles.tdData} style={{width:'85%'}}>{this.props.cartDetails.job.name}</td>
                </tr>
                <tr>
                    <td className={styles.tdHeadingStatus} style={{width:'15%', backgroundColor: this.state.statusBackgroundColor}}>Status</td>
                    <td className={localStyles.tdData} style={{fontWeight: 'bold', padding: '10px', width:'85%', backgroundColor: this.state.statusBackgroundColor, color: this.state.statusFontColor,}}>{this.props.cartDetails.status}</td>
                </tr>
                </tbody>
                </table>
            </div>

            <div style={{paddingBottom:'10px'}}>
            <DataPackDetails providerTasks={this.props.cartDetails.provider_tasks} />
            </div>

            <div style={{width:'100%'}}>
                <div style={{float:'left', width:'50%'}}>
                    <div className={styles.subHeading}>
                        General Information
                    </div>
                    <table><tbody>
                    <tr>
                        <td className={styles.tdHeading}>Description</td>
                        <td className={styles.tdData}>{this.props.cartDetails.job.description}</td>
                    </tr>
                    <tr>
                        <td className={styles.tdHeading}>Project/Catagory</td>
                        <td className={styles.tdData}>{this.props.cartDetails.job.event}</td>
                    </tr>
                    <tr>
                        <td className={styles.tdHeading}>Published</td>
                        <td className={styles.tdData}>{this.props.cartDetails.job.published}</td>
                    </tr>
                    <tr>
                        <td className={styles.tdHeading}>Layer Data</td>
                        <td className={styles.tdData}>{this.props.cartDetails.provider_tasks.map((provider) => <p key={provider.name}>{provider.name}</p>)}</td>
                     </tr>
                    <tr>
                        <td className={styles.tdHeading}>File Formats</td>
                        <td className={styles.tdData}>.gpkg</td>
                    </tr>
                    </tbody>
                    </table>
                </div>
                <div style={{float:'right', width:'50%'}}>
                    <div className={styles.subHeading}>
                        Export Information
                    </div>
                    <table><tbody>
                    <tr>
                        <td className={styles.tdHeading}>Run By</td>
                        <td className={styles.tdData}>{this.props.cartDetails.user}</td>
                    </tr>
                    <tr>
                        <td className={styles.tdHeading}>Run Id</td>
                        <td className={styles.tdData}>{this.props.cartDetails.uid}</td>
                    </tr>
                    <tr>
                        <td className={styles.tdHeading}>Started</td>
                        <td className={styles.tdData}>{this.props.cartDetails.started_at}</td>
                    </tr>
                    <tr>
                        <td className={styles.tdHeading}>Finished</td>
                        <td className={styles.tdData}>{this.props.cartDetails.finished_at}</td>
                    </tr>
                    </tbody>
                    </table>
                </div>
            </div>

            <div style={{width:'100%', float:'left', paddingTop:'10px'}}>
                <div className={styles.subHeading}>
                        Selected Area of Interest (AOI)
                </div>
                <div id="summaryMap" className={styles.map} ></div>
            </div>
            <div style={{width:'100%', float:'left', paddingTop:'10px'}}>
                <div className={styles.subHeading}>
                    BUTTON BUTTON BUTTON
                </div>

            </div>
        </div>

        )
    }
}

DataCartDetails.propTypes = {
    cartDetails: PropTypes.object,
}
DataCartDetails.childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
};

export default connect(

)(DataCartDetails);

