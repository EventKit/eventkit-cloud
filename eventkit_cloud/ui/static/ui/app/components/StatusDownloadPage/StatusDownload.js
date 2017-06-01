import React, {Component, PropTypes } from 'react';
import {connect} from 'react-redux';
import {browserHistory} from 'react-router';
import '../tap_events'
import Paper from 'material-ui/Paper'
import DataCartDetails from './DataCartDetails'
import cssStyles from '../../styles/StatusDownload.css'
import { getDatacartDetails, deleteRun, rerunExport, clearReRunInfo} from '../../actions/statusDownloadActions'
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
                if (datacartDetails[0].status == "COMPLETED") {
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

    render() {

        const styles = {
            root: {
                height: window.innerHeight - 95,
                width: '100%',
                margin: 'auto',
                overflowY: 'hidden',
                backgroundImage: 'url("../../images/ek_topo_pattern.png")',
                backgroundRepeat: 'repeat repeat'
            },
            content: {
                padding: '30px',
                margin: 'auto',
                maxWidth: '1100px'
            }
        }

        return (

            <div style={styles.root}>
                <CustomScrollbar style={{height: window.innerHeight - 95, width: '100%'}}>
                    <div style={styles.content}>
                        <form>
                            <Paper style={{padding: '20px'}} zDepth={2} >
                                <div id='mainHeading' className={cssStyles.heading}>Status & Download</div>
                                {this.state.datacartDetails.map((cartDetails) => (
                                    <DataCartDetails key={cartDetails.uid}
                                                     cartDetails={cartDetails}
                                                     onRunDelete={this.props.deleteRun}
                                                     onRunRerun={this.props.rerunExport}
                                                     onClone={this.props.cloneExport}/>
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
        }
    }
}

StatusDownload.propTypes = {
    datacartDetails: PropTypes.object.isRequired,
    getDatacartDetails: PropTypes.func.isRequired,
    runDeletion: PropTypes.object.isRequired,
    rerunExport: PropTypes.func.isRequired,
    cloneExport: PropTypes.func.isRequired,
};

reactMixin(StatusDownload.prototype, TimerMixin);

export default  connect(
    mapStateToProps,
    mapDispatchToProps
)(StatusDownload);

