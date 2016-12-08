import React, {Component} from 'react'
import {connect} from 'react-redux'
import styles from './CreateExport.css'
import primaryStyles from '../styles/constants.css'
import ExportAOI from './ExportAOI'


class CreateExport extends React.Component {
    render() {
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
                <p className={primaryStyles.heading}>MENU > MENU > MENU > MENU</p>
            </div>
                <div>
                    <ExportAOI />
                </div>
                <div >
                    {this.props.children}
                </div>

        </div>


        );
    }
}


CreateExport.propTypes = {
    //jobs: PropTypes.array.isRequired
};

function mapStateToProps(state, ownProps) {
    return {
        //jobs: state.jobs
    };
}

export default connect(mapStateToProps)(CreateExport);