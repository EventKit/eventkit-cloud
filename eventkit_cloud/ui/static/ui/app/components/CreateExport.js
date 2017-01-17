import React, {Component} from 'react'
import {connect} from 'react-redux'
import styles from './CreateExport.css'
import AppBar from 'material-ui/AppBar'
import IconButton from 'material-ui/IconButton'
import IconMenu from 'material-ui/IconMenu'
import MenuItem from 'material-ui/MenuItem'
import BreadcrumbStepper from './BreadcrumbStepper'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'
import primaryStyles from '../styles/constants.css'


import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import {
    Step,
    Stepper,
    StepLabel,
} from 'material-ui/Stepper';
import ArrowForwardIcon from 'material-ui/svg-icons/navigation/arrow-forward';


class CreateExport extends React.Component {

    constructor() {
        super()
        
    }


    render() {
        let location = this.props.location
        const pageTitle = "Create DataPack"
        const styles = {
            appBar: {
                backgroundColor: '#161e2e',
                height: '35px',
                color: 'white',
                fontSize: '14px',
                marginTop: '25px'
            },
        }


        //const jobs = this.props.jobs;
        let jobs = []
        jobs[0]  = {uid: '33434', name: 'alksdfjlkasjdf'}
        jobs[1]  = {uid: '33435', name: 'alksdfjlkasjdf'}
        jobs[2]  = {uid: '33436', name: 'alksdfjlkasjdf'}
        jobs[3]  = {uid: '33437', name: 'alksdfjlkasjdf'}
        jobs[4]  = {uid: '33438', name: 'alksdfjlkasjdf'}
        jobs[5]  = {uid: '33439', name: 'alksdfjlkasjdf'}
        jobs[6]  = {uid: '33430', name: 'alksdfjlkasjdf'}

        return (
            <div>
                <AppBar className={primaryStyles.sectionTitle} style={styles.appBar} title={pageTitle}
                        iconElementLeft={<p></p>}
                        iconElementRight={<IconMenu iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}
                                              anchorOrigin={{horizontal: 'right', vertical: 'top'}}
                                              targetOrigin={{horizontal: 'right', vertical: 'top'}}>
                                              <MenuItem primaryText="Save & Exit" />
                                              <MenuItem primaryText="Save & Share" />
                                              <MenuItem primaryText="Discard" />

                                            </IconMenu>}
                />
                <BreadcrumbStepper/>
                
                <div >
                    {this.props.children}
                </div>

        </div>


        );
    }

    
}


CreateExport.propTypes = {
    location:        React.PropTypes.object.isRequired,
    bbox:            React.PropTypes.arrayOf(React.PropTypes.number),
};

function mapStateToProps(state) {
    return {
        location: state.location,
        bbox: state.bbox,
    };
}


export default connect(
    mapStateToProps,
)(CreateExport);
