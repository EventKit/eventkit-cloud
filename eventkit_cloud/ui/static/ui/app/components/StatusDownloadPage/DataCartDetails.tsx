import * as PropTypes from 'prop-types';
import * as React from 'react';
import {withTheme, Theme} from '@material-ui/core/styles';
import moment from 'moment';
import DataPackDetails from './DataPackDetails';
import CustomTableRow from '../common/CustomTableRow';
import DataPackStatusTable from './DataPackStatusTable';
import DataPackOptions from './DataPackOptions';
import DataPackGeneralTable from './DataPackGeneralTable';
import {DataCartInfoTable} from './DataCartInfoTable';
import {MapView} from "../common/MapView";
import {getSqKmString} from "../../utils/generic"
import {MapLayer} from "../CreateDataPack/CreateExport";
import {RunProvider} from "./RunFileContext";

export interface Props {
    cartDetails: Eventkit.FullRun;
    onRunDelete: (uid: string) => void;
    onRunRerun: (uid: string) => void;
    onUpdateExpiration: (uid: string, date: Date) => void;
    onUpdateDataCartPermissions: (uid: string, perms: Eventkit.Permissions) => void;
    updatingExpiration: boolean;
    updatingPermission: boolean;
    onClone: (data: Eventkit.FullRun, providers: Eventkit.Provider[]) => void;
    onProviderCancel: (uid: string) => void;
    maxResetExpirationDays: string;
    providers: Eventkit.Provider[];
    job: Eventkit.Job;
    user: Eventkit.Store.User;
    theme: Eventkit.Theme & Theme;
}

export interface State {
    minDate: null | Date;
    maxDate: null | Date;
}

export class DataCartDetails extends React.Component<Props, State> {
    static contextTypes = {
        config: PropTypes.object,
    };

    static defaultProps = {
        updatingExpiration: false,
        updatingPermission: false,
    };

    constructor(props: Props) {
        super(props);
        this.setDates = this.setDates.bind(this);
        this.handleExpirationChange = this.handleExpirationChange.bind(this);
        this.handlePermissionsChange = this.handlePermissionsChange.bind(this);
        this.state = {
            minDate: null,
            maxDate: null,
        };
    }

    componentDidMount() {
        this.setDates();
    }

    private setDates() {
        const minDate = new Date();
        const maxDays = this.props.maxResetExpirationDays;
        const d = new Date();
        const m = moment(d);
        m.add(maxDays, 'days');
        const maxDate = m.toDate();
        this.setState({minDate, maxDate});
    }

    private handlePermissionsChange(permissions: Eventkit.Permissions) {
        this.props.onUpdateDataCartPermissions(this.props.cartDetails.job.uid, permissions);
    }

    private handleExpirationChange(date: Date) {
        this.props.onUpdateExpiration(this.props.cartDetails.uid, date);
    }

    render() {
        const {colors} = this.props.theme.eventkit;
        const selectedBasemap = {mapUrl: this.context.config.BASEMAP_URL} as MapLayer;

        const styles = {
            container: {
                width: '100%',
                marginTop: '30px',
            },
            subHeading: {
                fontSize: '16px',
                alignContent: 'flex-start',
                color: colors.black,
                fontWeight: 'bold' as 'bold',
                marginBottom: '5px',
            },
        };

        let statusBackgroundColor = colors.secondary;
        let statusFontColor = colors.text_primary;

        if (this.props.cartDetails.status === 'COMPLETED') {
            statusBackgroundColor = `${colors.success}33`;
            statusFontColor = colors.success;
        } else if (this.props.cartDetails.status === 'SUBMITTED') {
            statusBackgroundColor = `${colors.running}33`;
            statusFontColor = colors.running;
        } else if (this.props.cartDetails.status === 'INCOMPLETE') {
            statusBackgroundColor = `${colors.warning}33`;
            statusFontColor = colors.warning;
        }

        return (
            <RunProvider value={{run: this.props.cartDetails}}>
                <div>
                    <div className="qa-DataCartDetails-div-name" id="Name">
                        <CustomTableRow
                            className="qa-DataCartDetails-name"
                            title="Name"
                            dataStyle={{wordBreak: 'break-all'}}
                        >
                            {this.props.cartDetails.job.name}
                        </CustomTableRow>
                    </div>
                    <div style={styles.container} className="qa-DataCartDetails-div-StatusContainer" id="Status">
                        <div className="qa-DataCartDetails-div-status" style={styles.subHeading}>
                            Status
                        </div>
                        <DataPackStatusTable
                            className="qa-DataCartDetails-DataPackStatusTable"
                            user={this.props.user.data}
                            status={this.props.cartDetails.status}
                            expiration={this.props.cartDetails.expiration}
                            permissions={this.props.cartDetails.job.permissions}
                            minDate={this.state.minDate}
                            maxDate={this.state.maxDate}
                            handleExpirationChange={this.handleExpirationChange}
                            handlePermissionsChange={this.handlePermissionsChange}
                            statusColor={statusBackgroundColor}
                            statusFontColor={statusFontColor}
                            adminPermissions={this.props.cartDetails.job.relationship === 'ADMIN'}
                            job={this.props.job}
                        />
                    </div>
                    <div style={styles.container} className="qa-DataCartDetails-div-downloadOptionsContainer"
                         id="DownloadOptions">
                        <DataPackDetails
                            providerTasks={this.props.cartDetails.provider_tasks}
                            onProviderCancel={this.props.onProviderCancel}
                            providers={this.props.providers}
                            job={this.props.job}
                        />
                    </div>
                    <div style={styles.container} className="qa-DataCartDetails-div-otherOptionsContainer"
                         id="OtherOptions">
                        <div className="qa-DataCartDetails-div-otherOptions" style={styles.subHeading}>
                            Other Options
                        </div>
                        <DataPackOptions
                            onRerun={this.props.onRunRerun}
                            onClone={this.props.onClone}
                            onDelete={this.props.onRunDelete}
                            dataPack={this.props.cartDetails}
                            job={this.props.job}
                            providers={this.props.providers}
                            adminPermissions={this.props.cartDetails.job.relationship === 'ADMIN'}
                        />
                    </div>
                    <div style={styles.container} className="qa-DataCartDetails-div-generalInfoContainer"
                         id="GeneralInfo">
                        <div className="qa-DataCartDetails-div-generalInfo" style={styles.subHeading}>
                            General Information
                        </div>
                        <DataPackGeneralTable
                            dataPack={this.props.cartDetails}
                            providers={this.props.providers}
                        />
                    </div>
                    <div style={styles.container} id="Map">
                        <div className="qa-DataCartDetails-div-aoi" style={styles.subHeading}>
                            Selected Area of Interest (AOI)
                        </div>
                        <div>
                            <CustomTableRow
                                className="qa-DataPackAoiInfo-area"
                                title="Area"
                                dataStyle={{wordBreak: 'break-all'}}
                            >
                                {getSqKmString(this.props.cartDetails.job.extent)}
                            </CustomTableRow>
                            <div className="qa-DataPackAoiInfo-div-map" style={{marginTop: '10px'}}>
                                <MapView
                                    id={"summaryMap"}
                                    selectedBaseMap={selectedBasemap}
                                    copyright={this.context.config.BASEMAP_COPYRIGHT}
                                    geojson={this.props.cartDetails.job.extent}
                                    minZoom={2}
                                    maxZoom={20}
                                />
                            </div>
                        </div>
                    </div>
                    <div style={styles.container} className="qa-DataCartDetails-div-exportInfoContainer"
                         id="ExportInfo">
                        <div className="qa-DataCartDetails-div-exportInfo" style={styles.subHeading}>
                            Export Information
                        </div>
                        <DataCartInfoTable
                            dataPack={this.props.cartDetails}
                        />
                    </div>
                </div>
            </RunProvider>
        );
    }
}

export default withTheme(DataCartDetails);
