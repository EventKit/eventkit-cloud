import React, {Component} from 'react';
import {connect} from 'react-redux';
import styles from './DropZone.css';
import {setImportButtonSelected, setAllButtonsDefault, setImportModalState, processGeoJSONFile, resetGeoJSONFile} from '../actions/mapToolActions';
import { Modal } from 'react-bootstrap';
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
            <div>
                {this.props.showImportModal ? 
                <div className={styles.dropZoneContainer}>
                    <div className={styles.dropZoneTitlebar}>
                        <span className={styles.dropZoneTitle}><strong>Import AOI</strong></span>
                        <button onClick={this.handleClear} className={styles.dropZoneClear}><i className={"material-icons"}>clear</i></button>
                    </div>
                    <Dropzone onDrop={this.onDrop} 
                            multiple={false} 
                            className={styles.dropZone}
                            ref={(node) => {this.dropzone = node;}} 
                            disableClick={true}
                            maxSize={28000000}>
                        <div className={styles.dropZoneText}>
                        <span><strong>GeoJSON</strong> format only, <strong>26MB</strong> max,<br/>Drag and drop or<br/></span>
                        <button onClick={this.onOpenClick} className={styles.dropZoneImportButton}><i className={"material-icons"}>file_upload</i>Select A File</button>
                        </div>
                    </Dropzone>
                </div>
                : null}
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        showImportModal: state.showImportModal,
    };
}


function mapDispatchToProps(dispatch) {
    return {
        setAllButtonsDefault: () => {
            dispatch(setAllButtonsDefault());
        },
        setImportModalState: (visibility) => {
            dispatch(setImportModalState(visibility));
        },
        processGeoJSONFile: (file) => {
            dispatch(processGeoJSONFile(file));
        },
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DropZoneDialog);
