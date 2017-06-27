import React, {Component, PropTypes } from 'react';
import {connect} from 'react-redux';
import {browserHistory} from 'react-router';
import '../tap_events'
import Paper from 'material-ui/Paper'
import CircularProgress from 'material-ui/CircularProgress';
import DataCartDetails from './DataCartDetails'
import cssStyles from '../../styles/StatusDownload.css'
import { getDatacartDetails, deleteRun, rerunExport, clearReRunInfo, cancelProviderTask} from '../../actions/statusDownloadActions'
import { updateAoiInfo, updateExportInfo } from '../../actions/exportsActions'
import TimerMixin from 'react-timer-mixin'
import reactMixin from 'react-mixin'
import CustomScrollbar from '../../components/CustomScrollbar';

export class StatusDownload extends React.Component {
    constructor(props) {
        super(props)
        this.handleResize = this.handleResize.bind(this);
        this.state = {
            datacartDetails: [],
            isLoading: true,
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
        if (nextProps.datacartDetails.fetched != this.props.datacartDetails.fetched) {
            if (nextProps.datacartDetails.fetched == true) {
                let datacartDetails = nextProps.datacartDetails.data;
                this.setState({datacartDetails: datacartDetails});

                //If the status of the job is completed, check the provider tasks to ensure they are all completed as well
                //If a Provider Task does not have a successful outcome, add to a counter.  If the counter is greater than 1, that
                // means that at least one task is not completed, so do not stop the timer
                if (datacartDetails[0].status == "COMPLETED" || datacartDetails[0].status == "INCOMPLETE") {
                    let providerTasks = datacartDetails[0].provider_tasks;
                    let clearTimer = 0;
                     providerTasks.forEach((tasks) => {
                        tasks.tasks.forEach((task) => {
                            if((task.status != 'SUCCESS') && (task.status != 'CANCELED') && (task.status != 'FAILED')){
                                clearTimer++
                            }
                        });
                    });

                    if (clearTimer == 0 ){
                        TimerMixin.clearInterval(this.timer);
                        setTimeout(() => {
                            this.props.getDatacartDetails(this.props.params.jobuid);
                        }, 270000);
                    }
                }

                if(this.state.isLoading) {
                    this.setState({isLoading: false});
                }
            }
        }
    }

    startTimer() {
        this.timer = TimerMixin.setInterval(() => {
            this.props.getDatacartDetails(this.props.params.jobuid);
        }, 3000);
    }

    componentDidMount() {
        this.props.getDatacartDetails(this.props.params.jobuid);
        this.startTimer();
        window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount() {
        TimerMixin.clearInterval(this.timer);
        window.removeEventListener('resize', this.handleResize);
    }

    handleClone(cartDetails, providerArray) {
        this.props.cloneExport(cartDetails, providerArray)
    }

    handleResize() {
        this.forceUpdate();
    }

    getMarginPadding() {
        if(window.innerWidth <= 767) {
            return '0px';
        }
        else {
            return '30px';
        }
    }

    render() {
        const marginPadding = this.getMarginPadding();

        const styles = {
            root: {
                height: window.innerHeight - 95,
                width: '100%',
                margin: 'auto',
                overflowY: 'hidden',
                backgroundImage: 'url('+require('../../../images/ek_topo_pattern.png')+')',
                backgroundRepeat: 'repeat repeat'
            },
            content: {
                paddingTop:'30px',
                paddingBottom: '30px',
                paddingLeft: marginPadding,
                paddingRight: marginPadding,
                margin: 'auto',
                maxWidth: '1100px'
            }
        }

        return (

            <div style={styles.root}>
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
                <CustomScrollbar style={{height: window.innerHeight - 95, width: '100%'}}>
                    <div style={styles.content}>
                        <form>
                            <Paper style={{padding: '20px'}} zDepth={2} >
                                <div id='mainHeading' className={cssStyles.heading}>Status & Download</div>
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
                                                     onRunRerun={this.props.rerunExport}
                                                     onClone={this.props.cloneExport}
                                                     onProviderCancel={this.props.cancelProviderTask}/>
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
        exportReRun: state.exportReRun,
        cancelProviderTask: state.cancelProviderTask,
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
        clearReRunInfo: () => {
            dispatch(clearReRunInfo())
        },
        cloneExport: (cartDetails, providerArray) => {
            dispatch(updateAoiInfo({type: "FeatureCollection", features: [cartDetails.job.extent]}, 'Polygon', 'Custom Polygon', 'Box'));
            dispatch(updateExportInfo(cartDetails.job.name, cartDetails.job.description, cartDetails.job.event, cartDetails.job.published, providerArray, 'Geopackage'))
            browserHistory.push('/create/')
        },
        cancelProviderTask:(providerUid) => {
            dispatch(cancelProviderTask(providerUid))
        }
    }
}

StatusDownload.propTypes = {
    datacartDetails: PropTypes.object.isRequired,
    getDatacartDetails: PropTypes.func.isRequired,
    runDeletion: PropTypes.object.isRequired,
    rerunExport: PropTypes.func.isRequired,
    cloneExport: PropTypes.func.isRequired,
    cancelProviderTask: PropTypes.func.isRequired,
};

reactMixin(StatusDownload.prototype, TimerMixin);

export default  connect(
    mapStateToProps,
    mapDispatchToProps
)(StatusDownload);

