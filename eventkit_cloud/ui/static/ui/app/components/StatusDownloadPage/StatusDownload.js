import React, {Component, PropTypes } from 'react';
import {connect} from 'react-redux';
import {browserHistory} from 'react-router';
import '../tap_events'
import AppBar from 'material-ui/AppBar'
import Paper from 'material-ui/Paper'
import CircularProgress from 'material-ui/CircularProgress';
import DataCartDetails from './DataCartDetails'
import { getDatacartDetails, deleteRun, rerunExport, clearReRunInfo, cancelProviderTask, updateExpiration,updatePermission, getProviderDesc, clearProviderDesc} from '../../actions/statusDownloadActions'
import { updateAoiInfo, updateExportInfo, getProviders} from '../../actions/exportsActions'
import TimerMixin from 'react-timer-mixin'
import reactMixin from 'react-mixin'
import CustomScrollbar from '../../components/CustomScrollbar';
import Joyride from 'react-joyride';
import Help from 'material-ui/svg-icons/action/help';

export class StatusDownload extends React.Component {
    constructor(props) {
        super(props)
        this.callback = this.callback.bind(this);
        this.state = {
            datacartDetails: [],
            isLoading: true,
            maxDays: null,
            zipFileProp: null,
            steps: [],
            isRunning: false,
        }

    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.runDeletion.deleted != this.props.runDeletion.deleted) {
            if (nextProps.runDeletion.deleted) {
                browserHistory.push('/exports');
            }
        }
        if (nextProps.exportReRun.fetched != this.props.exportReRun.fetched) {
            if (nextProps.exportReRun.fetched == true) {
                let datacartDetails = [];
                datacartDetails[0] = nextProps.exportReRun.data;
                this.setState({datacartDetails: datacartDetails});
                this.startTimer();
            }
        }
        if (nextProps.updateExpiration.updated != this.props.updateExpiration.updated) {
            if (nextProps.updateExpiration.updated == true) {
                this.props.getDatacartDetails(this.props.params.jobuid);
            }
        }
        if (nextProps.updatePermission.updated != this.props.updatePermission.updated) {
            if (nextProps.updatePermission.updated == true) {
                this.props.getDatacartDetails(this.props.params.jobuid);
            }
        }
        if (nextProps.datacartDetails.fetched != this.props.datacartDetails.fetched) {
            if (nextProps.datacartDetails.fetched == true) {
                let datacartDetails = nextProps.datacartDetails.data;
                this.setState({
                    datacartDetails: datacartDetails,
                    zipFileProp: nextProps.datacartDetails.data[0].zipfile_url
                });

                let clearTimer = 0;
                if (nextProps.datacartDetails.data[0].zipfile_url == null) {
                    clearTimer++;
                }


                //If the status of the job is completed, check the provider tasks to ensure they are all completed as well
                //If a Provider Task does not have a successful outcome, add to a counter.  If the counter is greater than 1, that
                // means that at least one task is not completed, so do not stop the timer
                if (datacartDetails[0].status == "COMPLETED" || datacartDetails[0].status == "INCOMPLETE") {
                    let providerTasks = datacartDetails[0].provider_tasks;

                    providerTasks.forEach((tasks) => {
                        tasks.tasks.forEach((task) => {
                            if ((task.status != 'SUCCESS') && (task.status != 'CANCELED') && (task.status != 'FAILED')) {
                                clearTimer++;
                            }
                        });
                    });

                    if (clearTimer == 0) {
                        TimerMixin.clearInterval(this.timer);
                        setTimeout(() => {
                            this.props.getDatacartDetails(this.props.params.jobuid);
                        }, 270000);
                    }
                }

                if (this.state.isLoading) {
                    this.setState({isLoading: false});
                }

            }
        }
    }
    handleWalkthroughClick() {
        this.setState({isRunning: true})
    }

    startTimer() {
        this.timer = TimerMixin.setInterval(() => {
            this.props.getDatacartDetails(this.props.params.jobuid);
        }, 3000);
    }

    componentDidMount() {
        const tooltipStyle = {
            backgroundColor: 'white',
            borderRadius: '0',
            color: 'black',
            mainColor: '#ff4456',
            textAlign: 'left',
            header: {
                textAlign: 'left',
                fontSize: '20px',
                borderColor: '#4598bf'
            },
            main: {
                paddingTop: '20px',
                paddingBottom: '20px',
            },
            button: {
                color: 'white',
                backgroundColor: '#4598bf'
            },
            skip: {
                color: '#8b9396'
            },
            back: {
                color: '#8b9396'
            },
            hole: {
                backgroundColor: 'rgba(226,226,226, 0.2)',
            }
        }

        const steps = [
            {
                title: 'DataPack Info',
                text: 'This is the name of the datapack.',
                selector: '.qa-DataCartDetails-table-name',
                position: 'bottom',
                style: tooltipStyle,
                isFixed:true,
            },
            {
                title: 'DataPack Status',
                text: 'This is the status of the datapack.  Here you can change the expiration date and permission of the datapack.',
                selector: '.qa-DataCartDetails-table-export',
                position: 'bottom',
                style: tooltipStyle,
                isFixed:true,
            },
            {
                title: 'DataPack Download Options',
                text: 'Here you will find download options for the datapack. <br> Each data source has its own table where you can view status of the current downloadable files.',
                selector: '.qa-DatapackDetails-div-downloadOptions',
                position: 'bottom',
                style: tooltipStyle,
                isFixed:true,
            },
            {
                title: 'Other Options',
                text: 'There are options availble to run datapack export again, clone the dataoack or delete the datapack',
                selector: '.qa-DataCartDetails-div-otherOptions',
                position: 'bottom',
                style: tooltipStyle,
                isFixed:true,
            },
            {
                title: 'General Information',
                text: 'Here you will find general information related to the datapack.  ',
                selector: '.qa-DataCartDetails-table-generalInfo',
                position: 'bottom',
                style: tooltipStyle,
                isFixed:true,
            },
            {
                title: 'AIO',
                text: 'This is the selected area of interest for the datapack.',
                selector: '.qa-DataCartDetails-div-aoi',
                position: 'bottom',
                style: tooltipStyle,
                isFixed:true,
            },
            {
                title: 'Export Information',
                text: 'This contains information specific to the export.',
                selector: '.qa-DataCartDetails-table-exportInfo',
                position: 'bottom',
                style: tooltipStyle,
                isFixed:true,
            },
        ];

        this.joyrideAddSteps(steps);

        this.props.getDatacartDetails(this.props.params.jobuid);
        this.props.getProviders();
        this.startTimer();
        const maxDays = this.context.config.MAX_EXPORTRUN_EXPIRATION_DAYS;
        this.setState({maxDays});
    }

    componentWillUnmount() {
        TimerMixin.clearInterval(this.timer);
    }

    handleClone(cartDetails, providerArray) {
        this.props.cloneExport(cartDetails, providerArray)
    }

    getMarginPadding() {
        if(window.innerWidth <= 767) {
            return '0px';
        }
        else {
            return '30px';
        }
    }

    joyrideAddSteps(steps) {
        let newSteps = steps;

        if (!Array.isArray(newSteps)) {
            newSteps = [newSteps];
        }

        if (!newSteps.length) return;

        this.setState(currentState => {
            currentState.steps = currentState.steps.concat(newSteps);
            return currentState;
        });
    }

    callback(data) {
        if(data.action === 'close' || data.action === 'skip' || data.type === 'finished'){
            this.setState({ isRunning: false });
            this.refs.joyride.reset(true);
        }
        if(data.index === 0 && data.type === 'tooltip:before') {

        }

        if(data.index === 5 && data.type === 'tooltip:before') {
            this.scrollbars.scrollToBottom();
        }
    }

    handleJoyride() {
        if(this.state.isRunning === true){
            this.refs.joyride.reset(true);
        }
        else {
            this.setState({isRunning: true})
        }
    }

    render() {
        const {steps, isRunning} = this.state;
        const pageTitle = <div style={{display: 'inline-block', paddingRight: '10px'}}>Status & Download </div>
        const iconElementRight = <div onTouchTap={this.handleWalkthroughClick.bind(this)} style={{color: '#4598bf', cursor:'pointer', display: 'inline-block', marginLeft:'10px', fontSize:'16px'}}><Help onTouchTap={this.handleWalkthroughClick.bind(this)} style={{color: '#4598bf', cursor:'pointer', height:'18px', width:'18px', verticalAlign:'middle', marginRight:'5px', marginBottom:'5px'}}/>Page Tour</div>

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
                height: '35px'
            },
            root: {
                height: window.innerHeight - 95,
                width: '100%',
                margin: 'auto',
                overflowY: 'hidden',
                backgroundImage: 'url('+require('../../../images/ek_topo_pattern.png')+')',
                backgroundRepeat: 'repeat repeat'
            },
            content: {
                paddingTop: marginPadding,
                paddingBottom: marginPadding,
                paddingLeft: marginPadding,
                paddingRight: marginPadding,
                margin: 'auto',
                maxWidth: '1100px'
            },
            heading: {
                fontSize: '18px',
                fontWeight: 'bold',
                color: 'black',
                alignContent: 'flex-start',
                paddingBottom: '5px',
            }
        }

        return (

            <div className={'qa-StatusDownload-div-root'} style={styles.root}>
                <AppBar
                    style={styles.appBar}
                    title={pageTitle}
                    titleStyle={styles.pageTitle}
                    iconStyleRight={{marginTop: '2px'}}
                    iconElementRight={iconElementRight}
                    iconElementLeft={<p style={{display: 'none'}}/>}
                />

                {this.props.runDeletion.deleting ? 
                    <div style={{zIndex: 10, position: 'absolute', width: '100%', height: '100%', display: 'inline-flex', backgroundColor: 'rgba(0,0,0,0.3)'}}>
                        <CircularProgress 
                            style={{margin: 'auto', display: 'block'}} 
                            color={'#4598bf'}
                            size={50}
                        />
                    </div>
                : 
                    null 
                }
                <CustomScrollbar ref={s => { this.scrollbars = s; }} style={{height: window.innerHeight - 95, width: '100%'}}>
                    <div  className={'qa-StatusDownload-div-content'} style={styles.content}>
                        <Joyride
                            callback={this.callback}
                            ref={'joyride'}
                            debug={false}
                            steps={steps}
                            scrollToSteps={true}
                            autoStart={true}
                            type={'continuous'}
                            disableOverlay
                            showSkipButton={true}
                            showStepsProgress={true}
                            locale={{
                                back: (<span>Back</span>),
                                close: (<span>Close</span>),
                                last: (<span>Done</span>),
                                next: (<span>Next</span>),
                                skip: (<span>Skip</span>),
                            }}
                            run={isRunning}/>
                        <form>
                            <Paper className={'qa-Paper'} style={{padding: '20px'}} zDepth={2} >
                                <div className={'qa-StatusDownload-heading'} style={styles.heading}>DataPack Info</div>
                                {this.state.isLoading ? 
                                    <div style={{width: '100%', height: '100%', display: 'inline-flex'}}>
                                    <CircularProgress color={'#4598bf'} size={50} style={{margin: '30px auto', display: 'block'}}/>
                                    </div>
                                :
                                null
                                }
                                {this.state.datacartDetails.map((cartDetails) => (
                                    <DataCartDetails key={cartDetails.uid}
                                                     cartDetails={cartDetails}
                                                     onRunDelete={this.props.deleteRun}
                                                     onUpdateExpiration={this.props.updateExpirationDate}
                                                     onUpdatePermission={this.props.updatePermission}
                                                     onRunRerun={this.props.rerunExport}
                                                     onClone={this.props.cloneExport}
                                                     onProviderCancel={this.props.cancelProviderTask}
                                                     providers={this.props.providers}
                                                     maxResetExpirationDays={this.state.maxDays}
                                                     zipFileProp={this.state.zipFileProp}/>
                                ))}
                            </Paper>
                        </form>
                    </div>
                </CustomScrollbar>
            </div>
        )
    }
}



function mapStateToProps(state) {
    return {
        jobuid: state.submitJob.jobuid,
        datacartDetails: state.datacartDetails,
        runDeletion: state.runDeletion,
        updateExpiration: state.updateExpiration,
        updatePermission: state.updatePermission,
        exportReRun: state.exportReRun,
        cancelProviderTask: state.cancelProviderTask,
        providers: state.providers,
    }
}

function mapDispatchToProps(dispatch) {
    return {
        getDatacartDetails: (jobuid) => {
            dispatch(getDatacartDetails(jobuid))
        },
        deleteRun: (jobuid) => {
            dispatch(deleteRun(jobuid))
        },
        rerunExport: (jobuid) => {
            dispatch(rerunExport(jobuid))
        },
        updateExpirationDate: (uid, expiration) => {
            dispatch(updateExpiration(uid, expiration))
        },
        updatePermission: (uid, value) => {
            dispatch(updatePermission(uid, value))
        },
        clearReRunInfo: () => {
            dispatch(clearReRunInfo())
        },
        cloneExport: (cartDetails, providerArray) => {
            dispatch(updateAoiInfo({type: "FeatureCollection", features: [cartDetails.job.extent]}, 'Polygon', 'Custom Polygon', 'Box', 'box'));
            dispatch(updateExportInfo({
                exportName: cartDetails.job.name, 
                datapackDescription: cartDetails.job.description, 
                projectName: cartDetails.job.event, 
                makePublic: cartDetails.job.published, 
                providers: providerArray, 
                layers: 'Geopackage'
            }))
            browserHistory.push('/create/')
        },
        cancelProviderTask:(providerUid) => {
            dispatch(cancelProviderTask(providerUid))
        },
        getProviders: () => {
            dispatch(getProviders())
        },
    }
}
StatusDownload.contextTypes = {
    config: React.PropTypes.object
}

StatusDownload.propTypes = {
    datacartDetails: PropTypes.object.isRequired,
    getDatacartDetails: PropTypes.func.isRequired,
    runDeletion: PropTypes.object.isRequired,
    rerunExport: PropTypes.func.isRequired,
    updateExpirationDate: PropTypes.func.isRequired,
    updatePermission: PropTypes.func.isRequired,
    cloneExport: PropTypes.func.isRequired,
    cancelProviderTask: PropTypes.func.isRequired,
    getProviders: PropTypes.func.isRequired,

};

reactMixin(StatusDownload.prototype, TimerMixin);

export default  connect(
    mapStateToProps,
    mapDispatchToProps
)(StatusDownload);

