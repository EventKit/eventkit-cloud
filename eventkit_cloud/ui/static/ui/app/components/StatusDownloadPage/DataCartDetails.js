import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import moment from 'moment';
import DataPackDetails from './DataPackDetails';
import CustomTableRow from '../common/CustomTableRow';
import DataPackStatusTable from './DataPackStatusTable';
import DataPackOptions from './DataPackOptions';
import DataPackGeneralTable from './DataPackGeneralTable';
import { DataCartInfoTable } from './DataCartInfoTable';
import DataPackAoiInfo from './DataPackAoiInfo';

export class DataCartDetails extends Component {
    constructor(props) {
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

    setDates() {
        const minDate = new Date();
        const maxDays = this.props.maxResetExpirationDays;
        const d = new Date();
        const m = moment(d);
        m.add(maxDays, 'days');
        const maxDate = m.toDate();
        this.setState({ minDate, maxDate });
    }

    handlePermissionsChange(permissions) {
        this.props.onUpdateDataCartPermissions(this.props.cartDetails.job.uid, permissions);
    }

    handleExpirationChange(date) {
        this.props.onUpdateExpiration(this.props.cartDetails.uid, date);
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            container: {
                width: '100%',
                marginTop: '30px',
            },
            subHeading: {
                fontSize: '16px',
                alignContent: 'flex-start',
                color: colors.black,
                fontWeight: 'bold',
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
            <div>
                <div className="qa-DataCartDetails-div-name" id="Name">
                    <CustomTableRow
                        className="qa-DataCartDetails-name"
                        title="Name"
                        data={this.props.cartDetails.job.name}
                        dataStyle={{ wordBreak: 'break-all' }}
                    />
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
                        updatingExpiration={this.props.updatingExpiration}
                        updatingPermission={this.props.updatingPermission}
                        statusColor={statusBackgroundColor}
                        statusFontColor={statusFontColor}
                        adminPermissions={this.props.cartDetails.job.relationship === 'ADMIN'}
                    />
                </div>
                <div style={styles.container} className="qa-DataCartDetails-div-downloadOptionsContainer" id="DownloadOptions">
                    <DataPackDetails
                        providerTasks={this.props.cartDetails.provider_tasks}
                        onProviderCancel={this.props.onProviderCancel}
                        providers={this.props.providers}
                        zipFileProp={this.props.cartDetails.zipfile_url}
                    />
                </div>
                <div style={styles.container} className="qa-DataCartDetails-div-otherOptionsContainer" id="OtherOptions">
                    <div className="qa-DataCartDetails-div-otherOptions" style={styles.subHeading}>
                        Other Options
                    </div>
                    <DataPackOptions
                        onRerun={this.props.onRunRerun}
                        onClone={this.props.onClone}
                        onDelete={this.props.onRunDelete}
                        dataPack={this.props.cartDetails}
                        adminPermissions={this.props.cartDetails.job.relationship === 'ADMIN'}
                    />
                </div>
                <div style={styles.container} className="qa-DataCartDetails-div-generalInfoContainer" id="GeneralInfo">
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
                    <DataPackAoiInfo extent={this.props.cartDetails.job.extent} />
                </div>
                <div style={styles.container} className="qa-DataCartDetails-div-exportInfoContainer" id="ExportInfo">
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

DataCartDetails.defaultProps = {
    updatingExpiration: false,
    updatingPermission: false,
};

DataCartDetails.propTypes = {
    cartDetails: PropTypes.shape({
        uid: PropTypes.string,
        status: PropTypes.string,
        user: PropTypes.string,
        job: PropTypes.shape({
            uid: PropTypes.string,
            name: PropTypes.string,
            permissions: PropTypes.shape({
                value: PropTypes.oneOf([
                    'PUBLIC',
                    'PRIVATE',
                    'SHARED',
                ]),
                groups: PropTypes.objectOf(PropTypes.string),
                members: PropTypes.objectOf(PropTypes.string),
            }),
            relationship: PropTypes.string,
            extent: PropTypes.object,
        }),
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
    onUpdateDataCartPermissions: PropTypes.func.isRequired,
    updatingExpiration: PropTypes.bool,
    updatingPermission: PropTypes.bool,
    onClone: PropTypes.func.isRequired,
    onProviderCancel: PropTypes.func.isRequired,
    maxResetExpirationDays: PropTypes.string.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
    user: PropTypes.object.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withTheme()(DataCartDetails);
