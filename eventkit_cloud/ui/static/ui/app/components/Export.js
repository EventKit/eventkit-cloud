import React, {PropTypes} from 'react';
import {connect} from 'react-redux';

class Export extends React.Component {
    render() {
        return (
            <div className="col-md-8 col-md-offset-2">
                <h1>{this.props.export.name}</h1>
            </div>
        );
    }
};

Export.propTypes = {
    export: PropTypes.object.isRequired,
};


function mapStateToProps(state, ownProps) {
    let exportDetail = {uid: '', name: ''};
    const exportId = ownProps.params.uid;
    if (state.exports.length > 0) {
        exportDetail = Object.assign({}, state.exports.find(exportDetail => exportDetail.uid == uid))
    }
    return {exportDetail: exportDetail};
}

export default connect(mapStateToProps)(Export);