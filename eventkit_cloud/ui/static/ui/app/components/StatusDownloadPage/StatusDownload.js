import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import Paper from 'material-ui/Paper';
import CircularProgress from 'material-ui/CircularProgress';
import Divider from 'material-ui/Divider';
import Warning from 'material-ui/svg-icons/alert/warning';
import ErrorOutline from 'material-ui/svg-icons/alert/error-outline';
import DataCartDetails from './DataCartDetails';
import {
    getDatacartDetails, clearDataCartDetails, deleteRun, rerunExport,
    clearReRunInfo, cancelProviderTask, updateExpiration, updateDataCartPermissions,
} from '../../actions/statusDownloadActions';
import { updateAoiInfo, updateExportInfo, getProviders } from '../../actions/exportsActions';
import { viewedJob } from '../../actions/userActivityActions';
import { getUsers } from '../../actions/userActions';
import { getGroups } from '../../actions/userGroupsActions';
import CustomScrollbar from '../../components/CustomScrollbar';
import BaseDialog from '../../components/Dialog/BaseDialog';

const topoPattern = require('../../../images/ek_topo_pattern.png');

export class StatusDownload extends React.Component {
    constructor(props) {
        super(props);
        this.clearError = this.clearError.bind(this);
        this.getErrorMessage = this.getErrorMessage.bind(this);
        this.state = {
            isLoading: true,
            error: null,
        };
    }

    componentDidMount() {
        this.props.getDatacartDetails(this.props.params.jobuid);
        this.props.viewedJob(this.props.params.jobuid);
        this.props.getProviders();
        this.props.getUsers();
        this.props.getGroups();
        this.startTimer();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.runDeletion.deleted && !this.props.runDeletion.deleted) {
            browserHistory.push('/exports');
        }
        if (nextProps.exportReRun.error && !this.props.exportReRun.error) {
            this.setState({ error: nextProps.exportReRun.error });
        }
        if (nextProps.exportReRun.fetched && !this.props.exportReRun.fetched) {
            this.props.getDatacartDetails(this.props.params.jobuid);
            this.startTimer();
        }
        if (nextProps.expirationState.updated && !this.props.expirationState.updated) {
            this.props.getDatacartDetails(this.props.params.jobuid);
        }
        if (nextProps.permissionState.updated && !this.props.permissionState.updated) {
            this.props.getDatacartDetails(this.props.params.jobuid);
        }
        if (nextProps.datacartDetails.fetched && !this.props.datacartDetails.fetched) {
            if (this.state.isLoading) {
                this.setState({ isLoading: false });
            }

            // If no data returned from API we stop here
            if (!nextProps.datacartDetails.data.length) {
                return;
            }

            const datacart = nextProps.datacartDetails.data;
            let clearTimer = true;
            if (nextProps.datacartDetails.data[0].zipfile_url == null) {
                clearTimer = false;
            }

            // If the status of the job is completed,
            // check the provider tasks to ensure they are all completed as well
            // If a Provider Task does not have a successful outcome, add to a counter.
            // If the counter is greater than 1, that
            // means that at least one task is not completed, so do not stop the timer
            if (clearTimer && (datacart[0].status === 'COMPLETED' || datacart[0].status === 'INCOMPLETE')) {
                const providerTasks = datacart[0].provider_tasks;
                providerTasks.forEach((tasks) => {
                    clearTimer = tasks.tasks.every((task) => {
                        if ((task.status !== 'SUCCESS') && (task.status !== 'CANCELED') && (task.status !== 'FAILED')) {
                            return false;
                        }
                        return true;
                    });
                });

                if (clearTimer) {
                    window.clearInterval(this.timer);
                    this.timer = null;
                    window.clearTimeout(this.timeout);
                    this.timeout = window.setTimeout(() => {
                        this.props.getDatacartDetails(this.props.params.jobuid);
                    }, 270000);
                }
            }
        }
    }

    componentWillUnmount() {
        this.props.clearDataCartDetails();
        window.clearInterval(this.timer);
        this.timer = null;
        window.clearTimeout(this.timeout);
        this.timeout = null;
    }

    getMarginPadding() {
        if (window.innerWidth <= 767) {
            return '0px';
        }
        return '30px';
    }

    getErrorMessage() {
        if (!this.state.error) {
            return null;
        }

        const messages = this.state.error.map((error, ix) => (
            <div className="StatusDownload-error-container" key={error.detail}>
                { ix > 0 ? <Divider style={{ marginBottom: '10px' }} /> : null }
                <p className="StatusDownload-error-title">
                    <Warning style={{ fill: '#ce4427', verticalAlign: 'bottom', marginRight: '10px' }} />
                    <strong>
                        ERROR
                    </strong>
                </p>
                <p className="StatusDownload-error-detail">
                    {error.detail}
                </p>
            </div>
        ));
        return messages;
    }

    handleClone(cartDetails, providerArray) {
        this.props.cloneExport(cartDetails, providerArray);
    }

    startTimer() {
        window.clearInterval(this.timer);
        this.timer = window.setInterval(() => {
            this.props.getDatacartDetails(this.props.params.jobuid);
        }, 5000);
    }

    clearError() {
        this.setState({ error: null });
    }

    render() {
        const marginPadding = this.getMarginPadding();
        const styles = {
            root: {
                height: window.innerHeight - 95,
                width: '100%',
                margin: 'auto',
                overflowY: 'hidden',
                backgroundImage: `url(${topoPattern})`,
                backgroundRepeat: 'repeat repeat',
            },
            content: {
                paddingTop: marginPadding,
                paddingBottom: marginPadding,
                paddingLeft: marginPadding,
                paddingRight: marginPadding,
                margin: 'auto',
                maxWidth: '1100px',
            },
            heading: {
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'black',
                alignContent: 'flex-start',
                paddingBottom: '5px',
            },
            deleting: {
                zIndex: 10,
                position: 'absolute',
                width: '100%',
                height: '100%',
                display: 'inline-flex',
                backgroundColor: 'rgba(0,0,0,0.3)',
            },
            notFoundIcon: {
                color: '#ce4427',
                height: '22px',
                width: '22px',
                verticalAlign: 'bottom',
            },
            notFoundText: {
                fontSize: '16px',
                color: '#ce4427',
                fontWeight: 800,
                marginLeft: '5px',
            },
        };

        const errorMessage = this.getErrorMessage();

        const details = this.props.datacartDetails.data.map(cartDetails => (
            <DataCartDetails
                key={cartDetails.uid}
                cartDetails={cartDetails}
                onRunDelete={this.props.deleteRun}
                onUpdateExpiration={this.props.updateExpirationDate}
                onUpdateDataCartPermissions={this.props.updateDataCartPermissions}
                updatingExpiration={this.props.expirationState.updating}
                updatingPermission={this.props.permissionState.updating}
                permissionState={this.props.permissionState}
                onRunRerun={this.props.rerunExport}
                onClone={this.props.cloneExport}
                onProviderCancel={this.props.cancelProviderTask}
                providers={this.props.providers}
                maxResetExpirationDays={this.context.config.MAX_DATAPACK_EXPIRATION_DAYS}
                user={this.props.user}
                members={this.props.users.users}
                groups={this.props.groups}
            />
        ));

        if (!details.length && !this.state.isLoading) {
            details.push((
                <div
                    key="no-datapack"
                    style={{ textAlign: 'center', padding: '30px' }}
                    className="qa-StatusDownload-NoDatapack"
                >
                    <ErrorOutline style={styles.notFoundIcon} />
                    <span style={styles.notFoundText}>No DataPack Found</span>
                </div>
            ));
        }

        return (
            <div className="qa-StatusDownload-div-root" style={styles.root}>
                {this.props.runDeletion.deleting ?
                    <div style={styles.deleting}>
                        <CircularProgress
                            style={{ margin: 'auto', display: 'block' }}
                            color="#4598bf"
                            size={50}
                        />
                    </div>
                    :
                    null
                }
                <CustomScrollbar style={{ height: window.innerHeight - 95, width: '100%' }}>
                    <div className="qa-StatusDownload-div-content" style={styles.content}>
                        <form>
                            <Paper className="qa-Paper" style={{ padding: '20px' }} zDepth={2} >
                                <div className="qa-StatusDownload-heading" style={styles.heading}>
                                    Status & Download
                                </div>
                                {this.state.isLoading ?
                                    <div style={{ width: '100%', height: '100%', display: 'inline-flex' }}>
                                        <CircularProgress color="#4598bf" size={50} style={{ margin: '30px auto', display: 'block' }} />
                                    </div>
                                    :
                                    null
                                }
                                {details}
                                <BaseDialog
                                    className="qa-StatusDownload-BaseDialog-error"
                                    show={!!this.state.error}
                                    title="ERROR"
                                    onClose={this.clearError}
                                >
                                    {errorMessage}
                                </BaseDialog>
                            </Paper>
                        </form>
                    </div>
                </CustomScrollbar>
            </div>
        );
    }
}

StatusDownload.contextTypes = {
    config: PropTypes.object,
};

StatusDownload.propTypes = {
    params: PropTypes.shape({ jobuid: PropTypes.string }).isRequired,
    datacartDetails: PropTypes.object.isRequired,
    getDatacartDetails: PropTypes.func.isRequired,
    clearDataCartDetails: PropTypes.func.isRequired,
    deleteRun: PropTypes.func.isRequired,
    runDeletion: PropTypes.object.isRequired,
    rerunExport: PropTypes.func.isRequired,
    exportReRun: PropTypes.object.isRequired,
    updateExpirationDate: PropTypes.func.isRequired,
    updateDataCartPermissions: PropTypes.func.isRequired,
    permissionState: PropTypes.shape({
        updating: PropTypes.bool,
        updated: PropTypes.bool,
        error: PropTypes.array,
    }).isRequired,
    expirationState: PropTypes.shape({
        updating: PropTypes.bool,
        updated: PropTypes.bool,
        error: PropTypes.array,
    }).isRequired,
    cloneExport: PropTypes.func.isRequired,
    cancelProviderTask: PropTypes.func.isRequired,
    getProviders: PropTypes.func.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
    user: PropTypes.object.isRequired,
    users: PropTypes.shape({
        error: PropTypes.string,
        fetched: PropTypes.bool,
        fetching: PropTypes.bool,
        users: PropTypes.arrayOf(PropTypes.object),
    }).isRequired,
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    getUsers: PropTypes.func.isRequired,
    getGroups: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
    return {
        jobuid: state.submitJob.jobuid,
        datacartDetails: state.datacartDetails,
        runDeletion: state.runDeletion,
        expirationState: state.updateExpiration,
        permissionState: state.updatePermission,
        exportReRun: state.exportReRun,
        cancelProviderTask: state.cancelProviderTask,
        providers: state.providers,
        user: state.user,
        users: state.users,
        groups: state.groups.groups,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getDatacartDetails: (jobuid) => {
            dispatch(getDatacartDetails(jobuid));
        },
        clearDataCartDetails: () => {
            dispatch(clearDataCartDetails());
        },
        deleteRun: (jobuid) => {
            dispatch(deleteRun(jobuid));
        },
        rerunExport: (jobuid) => {
            dispatch(rerunExport(jobuid));
        },
        updateExpirationDate: (uid, expiration) => {
            dispatch(updateExpiration(uid, expiration));
        },
        updateDataCartPermissions: (uid, permissions) => {
            dispatch(updateDataCartPermissions(uid, permissions));
        },
        clearReRunInfo: () => {
            dispatch(clearReRunInfo());
        },
        cloneExport: (cartDetails, providerArray) => {
            const featureCollection = {
                type: 'FeatureCollection',
                features: [cartDetails.job.extent],
            };
            dispatch(updateAoiInfo({
                geojson: featureCollection,
                originalGeojson: featureCollection,
                geomType: 'Polygon',
                title: 'Custom Polygon',
                description: 'Box',
                selectionType: 'box',
                buffer: 0,
            }));
            dispatch(updateExportInfo({
                exportName: cartDetails.job.name,
                datapackDescription: cartDetails.job.description,
                projectName: cartDetails.job.event,
                providers: providerArray,
                layers: 'Geopackage',
            }));
            browserHistory.push('/create');
        },
        cancelProviderTask: (providerUid) => {
            dispatch(cancelProviderTask(providerUid));
        },
        getProviders: () => {
            dispatch(getProviders());
        },
        viewedJob: (jobUid) => {
            dispatch(viewedJob(jobUid));
        },
        getUsers: () => {
            dispatch(getUsers());
        },
        getGroups: () => {
            dispatch(getGroups());
        },
    };
}


export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(StatusDownload);
