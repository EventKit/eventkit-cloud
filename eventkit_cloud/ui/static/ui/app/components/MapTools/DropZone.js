import React, {Component, PropTypes} from 'react';
import DropZoneError from './DropZoneError';
import DropZoneDialog from './DropZoneDialog';

export class DropZone extends Component {

    constructor(props) {
        super(props);
    }

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
        )
    }
}

DropZone.propTypes = {
    importGeom: PropTypes.object,
    showImportModal: PropTypes.bool,
    setAllButtonsDefault: PropTypes.func,
    setImportModalState: PropTypes.func,
    processGeoJSONFile: PropTypes.func,
    resetGeoJSONFile: PropTypes.func,
}

export default DropZone;

