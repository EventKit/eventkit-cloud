import React, {Component, PropTypes } from 'react';
import {connect} from 'react-redux';
import {browserHistory} from 'react-router';
import '../tap_events'
import Paper from 'material-ui/Paper'
import CircularProgress from 'material-ui/CircularProgress';
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

                if (datacartDetails[0].status == "COMPLETED") {
                    TimerMixin.clearInterval(this.timer);
                    
                    setTimeout(() => {
                        this.props.getDatacartDetails(this.props.params.jobuid);
                    }, 270000);
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

