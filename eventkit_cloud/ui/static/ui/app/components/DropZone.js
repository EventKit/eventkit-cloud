import React, {Component} from 'react';
import {connect} from 'react-redux';
import ol from 'openlayers';
import styles from './DropZone.css';
import {updateMode, updateBbox} from '../actions/exportsActions.js';
import {setImportButtonSelected, setAllButtonsDefault, setImportModalState, processGeoJSONFile, resetGeoJSONFile} from '../actions/mapToolActions';
import { Modal } from 'react-bootstrap';
const Dropzone = require('react-dropzone');

export class DropZone extends Component {

    constructor(props) {
        super(props);
        this.onDrop = this.onDrop.bind(this);
        this.onOpenClick = this.onOpenClick.bind(this);
        this.handleClear = this.handleClear.bind(this);
        this.handleErrorClear = this.handleErrorClear.bind(this);
        this.state = {
            showErrorMessage: false,
            errorMessage: null,
        }
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.importGeom.error != this.props.importGeom.error) {
            if(nextProps.importGeom.error) {
                this.props.setAllButtonsDefault();
                this.setState({showErrorMessage: true, errorMessage: nextProps.importGeom.error});
            }
        }
    }

    onDrop(acceptedFiles) {
        const file = acceptedFiles[0];
        this.props.setImportModalState(false);
        this.props.processGeoJSONFile(file);
    }

    onOpenClick() {
        this.dropzone.open();
    }

    handleClear() {
        this.props.setImportModalState(false);
        this.props.setAllButtonsDefault();
    }

    handleErrorClear() {
        this.setState({showErrorMessage: false});
        this.props.resetGeoJSONFile();
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
                {this.state.showErrorMessage ?
                <div className={styles.fileErrorContainer}>
                    <div className={styles.dropZoneTitlebar}>
                        <span className={styles.dropZoneTitle}><strong>Error</strong></span>
                        <button onClick={this.handleErrorClear} className={styles.fileErrorClear}><i className={"material-icons"}>clear</i></button>
                    </div>
                    <div className={styles.fileError}>
                        {this.state.errorMessage}
                    </div>
                </div>
                : null}
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        toolbarIcons: state.toolbarIcons,
        mode: state.mode,
        showImportModal: state.showImportModal,
        importGeom: state.importGeom,
    };
}


function mapDispatchToProps(dispatch) {
    return {
        setImportButtonSelected: () => {
            dispatch(setImportButtonSelected());
        },
        setAllButtonsDefault: () => {
            dispatch(setAllButtonsDefault());
        },
        setImportModalState: (visibility) => {
            dispatch(setImportModalState(visibility));
        },
        processGeoJSONFile: (file) => {
            dispatch(processGeoJSONFile(file));
        },
        resetGeoJSONFile: (file) => {
            dispatch(resetGeoJSONFile());
        },
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DropZone);
