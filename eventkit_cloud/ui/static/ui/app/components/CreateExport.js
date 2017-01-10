import React, {Component} from 'react'
import {connect} from 'react-redux'
import styles from './CreateExport.css'
import primaryStyles from '../styles/constants.css'
import ExportAOI, {MODE_DRAW_BBOX, MODE_NORMAL} from './ExportAOI'
import {updateBbox} from '../actions'
import {toggleDrawCancel, toggleDrawRedraw} from '../actions/drawToolBarActions.js'

class CreateExport extends React.Component {

    constructor() {
        super()
        this._handleBoundingBoxChange = this._handleBoundingBoxChange.bind(this)

    }

    render() {
        let location = this.props.location

        //const jobs = this.props.jobs;
        let jobs = []
        jobs[0]  = {uid: '33434', name: 'alksdfjlkasjdf'}
        jobs[1]  = {uid: '33435', name: 'alksdfjlkasjdf'}
        jobs[2]  = {uid: '33436', name: 'alksdfjlkasjdf'}
        jobs[3]  = {uid: '33437', name: 'alksdfjlkasjdf'}
        jobs[4]  = {uid: '33438', name: 'alksdfjlkasjdf'}
        jobs[5]  = {uid: '33439', name: 'alksdfjlkasjdf'}
        jobs[6]  = {uid: '33430', name: 'alksdfjlkasjdf'}
        console.log(jobs);
        return (
        <div className={primaryStyles.primaryDiv}>
            <div className={primaryStyles.sectionBar}>
                <p className={primaryStyles.heading}>Create DataPack</p>
            </div>
            <div className={primaryStyles.sectionMenu}>
                <p className={primaryStyles.heading}>SET AOI > ADD INFO > PREVIEW & EXPORT > EXPORT STATUS</p>
            </div>
                <div>
                    <ExportAOI mode={this._mapMode} 
                               onBoundingBoxChange={() => this._handleBoundingBoxChange()}/>
                </div>
                <div >
                    {this.props.children}
                </div>

        </div>


        );
    }

    //
    // Internal API
    //

    get _mapMode() {
        if (this.props.location === 'exportAOI') {
            return MODE_DRAW_BBOX
        }
        return MODE_NORMAL
    }

    _handleBoundingBoxChange(bbox) {
        console.log('Running Handle bounding box change in CreateExport.js')
        console.log(this.props.bbox)
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
