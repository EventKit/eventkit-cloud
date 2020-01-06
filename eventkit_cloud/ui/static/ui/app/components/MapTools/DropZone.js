import PropTypes from 'prop-types';
import React, { Component } from 'react';
import DropZoneError from './DropZoneError';
import DropZoneDialog from './DropZoneDialog';

export class DropZone extends Component {
    render() {
        return (
            <div>
                <DropZoneDialog
                    showImportModal={this.props.showImportModal}
                    setAllButtonsDefault={this.props.setAllButtonsDefault}
                    setImportModalState={this.props.setImportModalState}
                    processGeoJSONFile={this.props.processGeoJSONFile}
                />
                <DropZoneError
                    importGeom={this.props.importGeom}
                    setAllButtonsDefault={this.props.setAllButtonsDefault}
                    resetGeoJSONFile={this.props.resetGeoJSONFile}
                />
            </div>
        );
    }
}

DropZone.propTypes = {
    importGeom: PropTypes.object.isRequired,
    processGeoJSONFile: PropTypes.func.isRequired,
    resetGeoJSONFile: PropTypes.func.isRequired,
    setAllButtonsDefault: PropTypes.func.isRequired,
    setImportModalState: PropTypes.func.isRequired,
    showImportModal: PropTypes.bool.isRequired,
};

export default DropZone;
