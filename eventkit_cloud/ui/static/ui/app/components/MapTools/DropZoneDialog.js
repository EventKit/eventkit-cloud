import React, {Component, PropTypes} from 'react';
import styles from '../../styles/DropZone.css';
import {PopupBox} from '../PopupBox.js';
import FileFileUpload from 'material-ui/svg-icons/file/file-upload';
const Dropzone = require('react-dropzone');

export class DropZoneDialog extends Component {

    constructor(props) {
        super(props);
        this.onDrop = this.onDrop.bind(this);
        this.onOpenClick = this.onOpenClick.bind(this);
        this.handleClear = this.handleClear.bind(this);
    }

    onDrop(acceptedFiles) {
        if(acceptedFiles.length == 1) {
            const file = acceptedFiles[0];
            this.props.setImportModalState(false);
            this.props.processGeoJSONFile(file);
        }
    }

    onOpenClick() {
        this.dropzone.open();
    }

    handleClear() {
        this.props.setImportModalState(false);
        this.props.setAllButtonsDefault();
    }
    render() {

        return (
            <PopupBox 
                show={this.props.showImportModal}
                title="Import AOI"
                onExit={this.handleClear}>
                <Dropzone onDrop={this.onDrop} 
                            multiple={false} 
                            className={styles.dropZone}
                            ref={(node) => {this.dropzone = node;}} 
                            disableClick={true}
                            maxSize={2000000}>
                        <div className={styles.dropZoneText}>
                        <span><strong>GeoJSON</strong> format only, <strong>2MB</strong> max,<br/>Drag and drop or<br/></span>
                        <button onClick={this.onOpenClick} className={styles.dropZoneImportButton}><FileFileUpload />Select A File</button>
                        </div>
                    </Dropzone>
            </PopupBox>
        )
    }
}

DropZoneDialog.propTypes = {
    showImportModal: PropTypes.bool,
    setAllButtonsDefault: PropTypes.func,
    setImportModalState: PropTypes.func,
    processGeoJSONFile: PropTypes.func,
}

export default DropZoneDialog;
