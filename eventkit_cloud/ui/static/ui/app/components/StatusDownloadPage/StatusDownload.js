import React, {Component, PropTypes } from 'react';
import {connect} from 'react-redux';
import ol from 'openlayers';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import '../tap_events'
import Paper from 'material-ui/Paper'
import DataCartDetails from './DataCartDetails'
import DataPackDetails from './DataPackDetails'
import styles from '../../styles/StatusDownload.css'
import { getDatacartDetails} from '../../actions/statusDownloadActions'
import TimerMixin from 'react-timer-mixin'
import reactMixin from 'react-mixin'

class StatusDownload extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            datacartDetails: [],
        }

    }

    getChildContext() {
        return {muiTheme: getMuiTheme(baseTheme)};
    }
    expandedChange(expanded) {
        this.setState({expanded: expanded});
    }
    componentWillReceiveProps(nextProps) {
        if (this.props.datacartDetails.fetched != null) {
            if (nextProps.datacartDetails.fetched != this.props.datacartDetails.fetched) {
                if (nextProps.datacartDetails.fetched == true) {
                    console.log(nextProps.datacartDetails.data)
                    let datacartDetails = nextProps.datacartDetails.data;
                    this.setState({datacartDetails: datacartDetails});

                    if(datacartDetails[0].status == "COMPLETED"){
                        TimerMixin.clearInterval(this.timer);
                    }
                }
            }
        }
    }
    componentDidMount(){
        this.timer = TimerMixin.setInterval(() => {
            console.log('I do not leak!');
            this.props.getDatacartDetails(this.props.params.jobuid);
        }, 3000);

    }
    componentWillUnmount() {
        TimerMixin.clearInterval(this.timer);
        console.log("undone")
    }

    componentDidUpdate(prevProps, prevState) {

    }
    render() {

        return (
            <div className={styles.root} style={{height: window.innerHeight - 110}}>
                <Paper className={styles.paper} zDepth={2} rounded style={{height: '1350px'}}>
                    <div className={styles.wholeDiv}>
                        <div id='mainHeading' className={styles.heading}>Status & Download</div>
                    {this.state.datacartDetails.map((cartDetails) => (
                        <DataCartDetails key={cartDetails.uid} cartDetails={cartDetails}/>
                        ))}
                    </div>

                </Paper>
            </div>

        )
    }
}

function mapStateToProps(state) {
    return {
        jobuid: state.submitJob.jobuid,
        datacartDetails: state.datacartDetails,
    }
}

function mapDispatchToProps(dispatch) {
    return {
        getDatacartDetails: (jobuid) => {
            dispatch(getDatacartDetails(jobuid))
        },
    }
}



StatusDownload.propTypes = {
    datacartDetails: PropTypes.object.isRequired,
    getDatacartDetails: PropTypes.func.isRequired,
}
StatusDownload.childContextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
};
reactMixin(StatusDownload.prototype, TimerMixin);
export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(StatusDownload);

