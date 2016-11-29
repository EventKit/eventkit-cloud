import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import * as exportActions from '../actions/exportsActions';
import JobList from './JobList';

class Exports extends React.Component {
    render() {
        return (
            <div className="col-md-12">
                <h1>Jobs</h1>
                <div className="col-md-4">
                    <JobList jobs={this.props.jobs} />
                </div>
            </div>
        );
    }
}


Exports.propTypes = {
    jobs: PropTypes.array.isRequired
};

function mapStateToProps(state, ownProps) {
    return {
        jobs: state.jobs
    };
}

export default connect(mapStateToProps)(Exports);