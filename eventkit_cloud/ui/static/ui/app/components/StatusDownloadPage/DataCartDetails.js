import React, { PropTypes, Component } from 'react';
import moment from 'moment';
import Map from 'ol/map';
import View from 'ol/view';
import interaction from 'ol/interaction';
import VectorSource from 'ol/source/vector';
import XYZ from 'ol/source/xyz';
import GeoJSON from 'ol/format/geojson';
import VectorLayer from 'ol/layer/vector';
import Tile from 'ol/layer/tile';
import Attribution from 'ol/control/attribution';
import ScaleLine from 'ol/control/scaleline';
import Zoom from 'ol/control/zoom';
import DataPackDetails from './DataPackDetails';
import DataPackTableRow from './DataPackTableRow';
import DataPackStatusTable from './DataPackStatusTable';
import DataPackOptions from './DataPackOptions';
import ol3mapCss from '../../styles/ol3map.css';
import DataPackGeneralTable from './DataPackGeneralTable';
import { DataCartInfoTable } from './DataCartInfoTable';

export class DataCartDetails extends Component {
    constructor(props) {
        super(props);
        this.handleExpirationChange = this.handleExpirationChange.bind(this);
        this.handlePublishedChange = this.handlePublishedChange.bind(this);
        this.state = {
            minDate: null,
            maxDate: null,
            permission: null,
            status: '',
        };
    }

    componentDidMount() {
        this.initializeOpenLayers();
        this.setMaxDate();
        this.setPermission();
    }

    setPermission() { // TODO
        // this.setState({ permission: this.props.cartDetails.job.published });
        this.setState({ permission: 'group' });
    }

    setMaxDate() {
        const minDate = new Date();
        const maxDays = this.props.maxResetExpirationDays;
        const d = new Date();
        const m = moment(d);
        m.add(maxDays, 'days');
        const maxDate = m.toDate();
        this.setState({ minDate, maxDate });
    }

    initializeOpenLayers() {
        const base = new Tile({
            source: new XYZ({
                url: this.context.config.BASEMAP_URL,
                wrapX: true,
                attributions: this.context.config.BASEMAP_COPYRIGHT,
            }),
        });

        this.map = new Map({
            interactions: interaction.defaults({
                keyboard: false,
                altShiftDragRotate: false,
                pinchRotate: false,
                mouseWheelZoom: false,
            }),
            layers: [base],
            target: 'summaryMap',
            view: new View({
                projection: 'EPSG:3857',
                center: [110, 0],
                zoom: 2,
                minZoom: 2,
                maxZoom: 22,
            }),
            controls: [
                new ScaleLine({
                    className: ol3mapCss.olScaleLine,
                }),
                new Attribution({
                    className: ['ol-attribution', ol3mapCss['ol-attribution']].join(' '),
                    collapsible: false,
                    collapsed: false,
                }),
                new Zoom({
                    className: [ol3mapCss.olZoom, ol3mapCss.olControlTopLeft].join(' '),
                }),
            ],
        });
        const source = new VectorSource({ wrapX: true });
        const geojson = new GeoJSON();
        const feature = geojson.readFeatures(this.props.cartDetails.job.extent, {
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326',
        });
        source.addFeatures(feature);
        const layer = new VectorLayer({
            source,
        });

        this.map.addLayer(layer);
        this.map.getView().fit(source.getExtent(), this.map.getSize());
    }

    handlePublishedChange(event, index, value) { // TODO
        // hit the API and change published to the new value
        console.log(value);
        this.setState({ permission: value });
        // this.props.onUpdatePermission(this.props.cartDetails.job.uid, value);
    }

    handleExpirationChange(e, date) {
        this.props.onUpdateExpiration(this.props.cartDetails.uid, date);
    }

    render() {
        const styles = {
            container: {
                width: '100%',
                marginTop: '30px',
            },
            subHeading: {
                fontSize: '16px',
                alignContent: 'flex-start',
                color: 'black',
                fontWeight: 'bold',
                marginBottom: '10px',
            },
        };

        let statusBackgroundColor = '#f8f8f8';
        let statusFontColor = '#8b9396';

        if (this.props.cartDetails.status === 'COMPLETED') {
            statusBackgroundColor = 'rgba(188,223,187, 0.4)';
            statusFontColor = '#55ba63';
        } else if (this.props.cartDetails.status === 'SUBMITTED') {
            statusBackgroundColor = 'rgba(250,233,173, 0.4)';
            statusFontColor = '#f4d225';
        } else if (this.props.cartDetails.status === 'INCOMPLETE') {
            statusBackgroundColor = 'rgba(232,172,144, 0.4)';
            statusFontColor = '#ce4427';
        }

        const rerunDisabled = this.state.status === 'SUBMITTED' || this.props.user.data.user.username !== this.props.cartDetails.user;

        return (
            <div>
                <div style={{ marginLeft: '-5px', marginTop: '-5px' }}>
                    <DataPackTableRow
                        title="Name"
                        data={this.props.cartDetails.job.name}
                        dataStyle={{ wordBreak: 'break-all' }}
                    />
                </div>
                <div style={styles.container}>
                    <div className="qa-DataCartDetails-div-status" style={styles.subHeading}>
                        Status
                    </div>
                    <DataPackStatusTable
                        status={this.props.cartDetails.status}
                        expiration={this.props.cartDetails.expiration}
                        permission={this.state.permission}
                        minDate={this.state.minDate}
                        maxDate={this.state.maxDate}
                        handleExpirationChange={this.handleExpirationChange}
                        handlePermissionsChange={this.handlePublishedChange}
                        statusColor={statusBackgroundColor}
                        statusFontColor={statusFontColor}
                    />
                </div>
                <div style={styles.container}>
                    <DataPackDetails
                        providerTasks={this.props.cartDetails.provider_tasks}
                        onProviderCancel={this.props.onProviderCancel}
                        providers={this.props.providers}
                        zipFileProp={this.props.cartDetails.zipfile_url}
                    />
                </div>
                <div style={styles.container}>
                    <div className="qa-DataCartDetails-div-otherOptions" style={styles.subHeading}>
                        Other Options
                    </div>
                    <DataPackOptions
                        onRerun={this.props.onRunRerun}
                        onClone={this.props.onClone}
                        onDelete={this.props.onRunDelete}
                        dataPack={this.props.cartDetails}
                        rerunDisabled={rerunDisabled}
                    />
                </div>
                <div style={styles.container}>
                    <div className="qa-DataCartDetails-div-generalInfo" style={styles.subHeading}>
                        General Information
                    </div>
                    <DataPackGeneralTable
                        dataPack={this.props.cartDetails}
                        providers={this.props.providers}
                    />
                </div>
                <div style={styles.container}>
                    <div className="qa-DataCartDetails-div-aoi" style={styles.subHeading}>
                        Selected Area of Interest (AOI)
                    </div>
                    <div className="qa-DataCartDetails-div-map" id="summaryMap" style={{ maxHeight: '400px' }} />
                </div>
                <div style={styles.container}>
                    <div className="qa-DataCartDetails-div-exportInfo" style={styles.subHeading}>
                        Export Information
                    </div>
                    <DataCartInfoTable
                        dataPack={this.props.cartDetails}
                    />
                </div>
            </div>
        );
    }
}

DataCartDetails.contextTypes = {
    config: PropTypes.object,
};

DataCartDetails.propTypes = {
    cartDetails: PropTypes.shape({
        uid: PropTypes.string,
        status: PropTypes.string,
        user: PropTypes.string,
        job: PropTypes.object,
        provider_tasks: PropTypes.arrayOf(PropTypes.object),
        created_at: PropTypes.string,
        finished_at: PropTypes.string,
        updated_at: PropTypes.string,
        duration: PropTypes.string,
        expiration: PropTypes.string,
        url: PropTypes.string,
        zipfile_url: PropTypes.string,
        deleted: PropTypes.bool,
    }).isRequired,
    onRunDelete: PropTypes.func.isRequired,
    onRunRerun: PropTypes.func.isRequired,
    onUpdateExpiration: PropTypes.func.isRequired,
    onUpdatePermission: PropTypes.func.isRequired,
    onClone: PropTypes.func.isRequired,
    onProviderCancel: PropTypes.func.isRequired,
    maxResetExpirationDays: PropTypes.string.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
    user: PropTypes.object.isRequired,
};

export default DataCartDetails;
