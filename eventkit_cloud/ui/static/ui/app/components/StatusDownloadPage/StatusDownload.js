import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import Paper from 'material-ui/Paper';
import AppBar from 'material-ui/AppBar';
import CircularProgress from 'material-ui/CircularProgress';
import Divider from 'material-ui/Divider';
import Warning from 'material-ui/svg-icons/alert/warning';
import DataCartDetails from './DataCartDetails';
import {
    getDatacartDetails, clearDataCartDetails, deleteRun, rerunExport,
    clearReRunInfo, cancelProviderTask, updateExpiration, updatePermission,
} from '../../actions/statusDownloadActions';
import { updateAoiInfo, updateExportInfo, getProviders } from '../../actions/exportsActions';
import CustomScrollbar from '../../components/CustomScrollbar';
import Joyride from 'react-joyride';
import Help from 'material-ui/svg-icons/action/help';
import BaseDialog from '../../components/Dialog/BaseDialog';

const topoPattern = require('../../../images/ek_topo_pattern.png');

export class StatusDownload extends React.Component {
    constructor(props) {
        super(props);
        this.callback = this.callback.bind(this);
        this.clearError = this.clearError.bind(this);
        this.getErrorMessage = this.getErrorMessage.bind(this);
        this.handleWalkthroughClick = this.handleWalkthroughClick.bind(this);
        this.state = {
            isLoading: true,
            error: null,
            steps: [],
            isRunning: false,
        };
    }

    componentDidMount() {
        this.props.getDatacartDetails(this.props.params.jobuid);
        this.props.getProviders();
        this.startTimer();

        const tooltipStyle = {
            backgroundColor: 'white',
            borderRadius: '0',
            color: 'black',
            mainColor: '#ff4456',
            textAlign: 'left',
            header: {
                textAlign: 'left',
                fontSize: '20px',
                borderColor: '#4598bf',
            },
            main: {
                paddingTop: '20px',
                paddingBottom: '20px',
            },
            button: {
                color: 'white',
                backgroundColor: '#4598bf',
            },
            skip: {
                color: '#8b9396',
            },
            back: {
                color: '#8b9396',
            },
            hole: {
                backgroundColor: 'rgba(226,226,226, 0.2)',
            },
        };

        const welcomeTooltipStyle = {
            backgroundColor: 'white',
            borderRadius: '0',
            color: 'black',
            mainColor: '#ff4456',
            textAlign: 'left',
            header: {
                textAlign: 'left',
                fontSize: '20px',
                borderColor: '#4598bf',
            },
            arrow: {
                display: 'none',
            },
            main: {
                paddingTop: '20px',
                paddingBottom: '20px',
            },

            button: {
                color: 'white',
                backgroundColor: '#4598bf',
            },
            skip: {
                display: 'none',
            },
            back: {
                color: '#8b9396',
            },
            hole: {
                display: 'none',
            },
        };

        const steps = [
            {
                title: 'Welcome to the Status & Download Page',
                text: 'You can review relevant information about the DataPack here such as its creation date, Area of Interest, and which data is included.  Most importantly, you can download the data.',
                selector: '.qa-StatusDownload-AppBar',
                position: 'top',
                style: welcomeTooltipStyle,
                isFixed: true,
            },
            {
                title: 'DataPack Info',
                text: 'This is the name of the DataPack.',
                selector: '.qa-DataCartDetails-div-name',
                position: 'bottom',
                style: tooltipStyle,
                isFixed: true,
            },
            {
                title: 'DataPack Status',
                text: 'This is the status of the DataPack.  Here you can change the expiration date and permission of the DataPack.',
                selector: '.qa-DataCartDetails-div-StatusContainer',
                position: 'bottom',
                style: tooltipStyle,
                isFixed: true,
            },
            {
                title: 'DataPack Download Options',
                text: 'Here you will find download options for the DataPack. <br> Each data source has its own table where you can view status of the current downloadable files.',
                selector: '.qa-DataCartDetails-div-downloadOptionsContainer',
                position: 'bottom',
                style: tooltipStyle,
                isFixed: true,
            },
            {
                title: 'Other Options',
                text: 'Here you can run the DataPack again which will refresh the data.  You can clone, which will create a new DataPack using the existing specifications.  From there you can make tweaks to the AOI, the selected data sources, and the metadata (e.g., the name of the DataPack, the permissions).  And you can delete the DataPack.',
                selector: '.qa-DataCartDetails-div-otherOptionsContainer',
                position: 'bottom',
                style: tooltipStyle,
                isFixed: true,
            },
            {
                title: 'General Information',
                text: 'Here you will find general information related to the DataPack.  ',
                selector: '.qa-DataCartDetails-div-generalInfoContainer',
                position: 'bottom',
                style: tooltipStyle,
                isFixed: true,
            },
            {
                title: 'AOI',
                text: 'This is the selected area of interest for the DataPack.',
                selector: '.qa-DataCartDetails-div-map',
                position: 'bottom',
                style: tooltipStyle,
                isFixed: true,
            },
            {
                title: 'Export Information',
                text: 'This contains information specific to the export.',
                selector: '.qa-DataCartDetails-div-exportInfoContainer',
                position: 'top',
                style: tooltipStyle,
                isFixed: true,
            },
        ];

        this.joyrideAddSteps(steps);
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
            const datacartDetails = nextProps.datacartDetails.data;
            let clearTimer = 0;
            if (nextProps.datacartDetails.data[0].zipfile_url == null) {
                clearTimer += 1;
            }

            // If the status of the job is completed, check the provider tasks to ensure they are all completed as well
            // If a Provider Task does not have a successful outcome, add to a counter.  If the counter is greater than 1, that
            // means that at least one task is not completed, so do not stop the timer
            if (datacartDetails[0].status === 'COMPLETED' || datacartDetails[0].status === 'INCOMPLETE') {
                const providerTasks = datacartDetails[0].provider_tasks;
                providerTasks.forEach((tasks) => {
                    tasks.tasks.forEach((task) => {
                        if ((task.status !== 'SUCCESS') && (task.status !== 'CANCELED') && (task.status !== 'FAILED')) {
                            clearTimer += 1;
                        }
                    });
                });

                if (clearTimer === 0) {
                    window.clearInterval(this.timer);
                    this.timer = null;
                    window.clearTimeout(this.timeout);
                    this.timeout = window.setTimeout(() => {
                        this.props.getDatacartDetails(this.props.params.jobuid);
                    }, 270000);
                }
            }

            if (this.state.isLoading) {
                this.setState({ isLoading: false });
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

    handleWalkthroughClick() {
        this.setState({ isRunning: true });
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

    joyrideAddSteps(steps) {
        let newSteps = steps;

        if (!Array.isArray(newSteps)) {
            newSteps = [newSteps];
        }

        if (!newSteps.length) return;

        this.setState((currentState) => {
            currentState.steps = currentState.steps.concat(newSteps);
            return currentState;
        });
    }

    callback(data) {
        const { scrollBar } = this.refs;
        if (data.action === 'close' || data.action === 'skip' || data.type === 'finished') {
            this.setState({ isRunning: false });
            this.refs.joyride.reset(true);
        }

        if (data.index === 5 && data.type === 'tooltip:before') {
            scrollBar.scrollToBottom();
        }
        if (data.type === 'finished') {
            scrollBar.scrollToTop();
        }
    }

    handleJoyride() {
        if (this.state.isRunning === true) {
            this.refs.joyride.reset(true);
        } else {
            this.setState({ isRunning: true });
        }
    }

    render() {
        const { steps, isRunning } = this.state;
        const pageTitle = <div style={{ display: 'inline-block', paddingRight: '10px' }}>Status & Download </div>;
        const iconElementRight = (<div
            onTouchTap={this.handleWalkthroughClick}
            style={{ color: '#4598bf', cursor: 'pointer', display: 'inline-block', marginLeft: '10px', fontSize: '16px'}} >
            <Help onTouchTap={this.handleWalkthroughClick} style={{ color: '#4598bf', cursor: 'pointer', height: '18px', width: '18px', verticalAlign: 'middle', marginRight: '5px', marginBottom: '5px' }} />
            Page Tour
        </div>)

        const marginPadding = this.getMarginPadding();

        const styles = {
            appBar: {
                backgroundColor: '#161e2e',
                height: '35px',
                color: 'white',
                fontSize: '14px',
            },
            pageTitle: {
                fontSize: '18px',
                lineHeight: '35px',
                paddingLeft: '10px',
                height: '35px',
            },
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
        };

        const errorMessage = this.getErrorMessage();

        return (
            <div className="qa-StatusDownload-div-root" style={styles.root}>
                <AppBar
                    className="qa-StatusDownload-AppBar"
                    style={styles.appBar}
                    title={pageTitle}
                    titleStyle={styles.pageTitle}
                    iconStyleRight={{ marginTop: '2px' }}
                    iconElementRight={iconElementRight}
                    iconElementLeft={<p style={{ display: 'none' }} />}
                />
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
                <CustomScrollbar ref="scrollBar" style={{ height: window.innerHeight - 95, width: '100%' }}>
                    <div className="qa-StatusDownload-div-content" style={styles.content}>
                        <Joyride
                            callback={this.callback}
                            ref="joyride"
                            debug={false}
                            steps={steps}
                            scrollToSteps
                            autoStart
                            type="continuous"
                            disableOverlay
                            showSkipButton
                            showStepsProgress
                            locale={{
                                back: (<span>Back</span>),
                                close: (<span>Close</span>),
                                last: (<span>Done</span>),
                                next: (<span>Next</span>),
                                skip: (<span>Skip</span>),
                            }}
                            run={isRunning}
                        />
                        <form>
                            <Paper className="qa-Paper" style={{ padding: '20px' }} zDepth={2} >
                                <div className="qa-StatusDownload-heading" style={styles.heading}>
                                    DataPack Details
                                </div>
                                {this.state.isLoading ?
                                    <div style={{ width: '100%', height: '100%', display: 'inline-flex' }}>
                                        <CircularProgress color="#4598bf" size={50} style={{ margin: '30px auto', display: 'block' }} />
                                    </div>
                                    :
                                    null
                                }
                                {this.props.datacartDetails.data.map(cartDetails => (
                                    <DataCartDetails
                                        key={cartDetails.uid}
                                        cartDetails={cartDetails}
                                        onRunDelete={this.props.deleteRun}
                                        onUpdateExpiration={this.props.updateExpirationDate}
                                        onUpdatePermission={this.props.updatePermission}
                                        permissionState={this.props.permissionState}
                                        onRunRerun={this.props.rerunExport}
                                        onClone={this.props.cloneExport}
                                        onProviderCancel={this.props.cancelProviderTask}
                                        providers={this.props.providers}
                                        maxResetExpirationDays={this.context.config.MAX_DATAPACK_EXPIRATION_DAYS}
                                        user={this.props.user}
                                    />
                                ))}
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
    updatePermission: PropTypes.func.isRequired,
    permissionState: PropTypes.shape({
        updating: PropTypes.bool,
        updated: PropTypes.bool,
        error: PropTypes.string,
    }).isRequired,
    expirationState: PropTypes.shape({
        updating: PropTypes.bool,
        updated: PropTypes.bool,
        error: PropTypes.string,
    }).isRequired,
    cloneExport: PropTypes.func.isRequired,
    cancelProviderTask: PropTypes.func.isRequired,
    getProviders: PropTypes.func.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
    user: PropTypes.object.isRequired,
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
        updatePermission: (uid, value) => {
            dispatch(updatePermission(uid, value));
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
                makePublic: cartDetails.job.published,
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
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(StatusDownload);
