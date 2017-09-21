import React, {Component, PropTypes} from 'react';
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
        const styles = {
            drop: {
                margin: 'auto',
                width: '90%',
                height: '200px',
                textAlign: 'center',
                border: '1px dashed',
                fontSize: '1em',
                color: '#4498c0'
            },
            text: {
                verticalAlign: 'center',
                color: 'grey',
                height: '100px',
                marginTop: '50px'
            },
            button: {
                border: 'none',
                backgroundColor: '#4498c0',
                color: '#fff',
                margin: '15px 5px 10px 5px',
                height: '30px',
                padding: '5p 10px',
            },
            icon: {
              verticalAlign: 'middle',
              fontSize: '20px',
              marginRight: '5px',
              color: '#fff'
            }
        }

        return (
            <PopupBox 
                show={this.props.showImportModal}
                title="Import AOI"
                onExit={this.handleClear}>
                <Dropzone 
                    onDrop={this.onDrop} 
                    multiple={false} 
                    style={styles.drop}
                    ref={(node) => {this.dropzone = node;}} 
                    disableClick={true}
                    maxSize={2000000}
                    className={'qa-DropZoneDialog-Dropzone'}
                >
                    <div style={styles.text} className={'qa-DropZoneDialog-text'}>
                        <span><strong>GeoJSON</strong> format only, <strong>2MB</strong> max,<br/>Drag and drop or<br/></span>
                        <button 
                            onClick={this.onOpenClick} 
                            style={styles.button}
                            className={'qa-DropZoneDialog-button'}
                        >
                            <FileFileUpload style={styles.icon} className={'qa-DropZoneDialog-icon-upload'}/>
                            Select A File
                        </button>
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
