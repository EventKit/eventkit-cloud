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

class StatusDownload extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            datacartDetails: [],
        }
        //if(this.props.datacartDetails.length == 0){
            //this.props.getDatacartDetails(this.props.params.jobuid);
        //}
    }

    getChildContext() {
        return {muiTheme: getMuiTheme(baseTheme)};
    }
    expandedChange(expanded) {
        this.setState({expanded: expanded});
    }
    componentWillReceiveProps(nextProps) {
        if(nextProps.datacartDetails.fetched != this.props.datacartDetails.fetched) {
            if (nextProps.datacartDetails.fetched == true) {
                console.log(nextProps.datacartDetails.data)
                let datacartDetails = nextProps.datacartDetails.data;
                this.setState({datacartDetails: datacartDetails});
            }
        }
    }

    componentDidMount(){
        this.props.getDatacartDetails(this.props.params.jobuid);

        //TODO: Since we are getting job info (from datacartDetails) after submitting a job, here we will want to check
        // to see if we already have that or if we are do not (then we got here from the library page, therefore
        // will not have the info in the datacartDetails props)

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
                        <DataCartDetails cartDetails={cartDetails}/>
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

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(StatusDownload);

