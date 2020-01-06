import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import Dropzone from 'react-dropzone';
import Button from '@material-ui/core/Button';
import FileFileUpload from '@material-ui/icons/CloudUpload';
import RootRef from '@material-ui/core/RootRef/RootRef';
import BaseDialog from '../Dialog/BaseDialog';

export class DropZoneDialog extends Component {
    constructor(props) {
        super(props);
        this.onDrop = this.onDrop.bind(this);
        this.handleClear = this.handleClear.bind(this);
    }

    onDrop(acceptedFiles) {
        if (acceptedFiles.length === 1) {
            const file = acceptedFiles[0];
            this.props.setImportModalState(false);
            this.props.processGeoJSONFile(file);
        }
    }

    handleClear() {
        this.props.setImportModalState(false);
        this.props.setAllButtonsDefault();
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            drop: {
                border: '1px dashed',
                color: colors.primary,
                fontSize: '1em',
                height: '250px',
                margin: '0px auto',
                textAlign: 'center',
                verticalAlign: 'center',
                width: '100%',
            },
            text: {
                color: colors.grey,
                height: '100px',
                marginTop: '30px',
                verticalAlign: 'center',
            },
        };

        return (
            <BaseDialog
                actions={[]}
                bodyStyle={{ paddingBottom: '50px' }}
                className="qa-DropZoneDialog-BaseDialog"
                onClose={this.handleClear}
                show={this.props.showImportModal}
                title="Import AOI"
            >
                <Dropzone
                    className="qa-DropZoneDialog-Dropzone"
                    maxSize={5000000}
                    multiple={false}
                    onDrop={this.onDrop}
                    style={{}}
                >
                    {({ getRootProps, getInputProps }) => {
                        const { ref } = getRootProps();
                        return (
                            <RootRef rootRef={ref}>
                                <div {...getRootProps()} style={styles.drop} className="qa-DropZoneDialog-text">
                                    <span style={styles.text}>
                                        <strong>GeoJSON, KML, GPKG, zipped SHP,</strong>
                                        <br />
                            and other major geospatial data formats are supported.
                                        <br />
                                        <strong> 5 MB </strong>
max
                                        <br />
                            Drag and drop or
                                        <br />
                                    </span>
                                    <Button
                                        className="qa-DropZoneDialog-Button-select"
                                        color="primary"
                                        style={{ margin: '15px 10px' }}
                                        variant="contained"
                                    >
                                        <input {...getInputProps()} />
                                        <FileFileUpload color="secondary" style={{ marginRight: '5px' }} />
                                    Select A File
                                    </Button>
                                </div>
                            </RootRef>
                        );
                    }}
                </Dropzone>
            </BaseDialog>
        );
    }
}

DropZoneDialog.propTypes = {
    processGeoJSONFile: PropTypes.func.isRequired,
    setAllButtonsDefault: PropTypes.func.isRequired,
    setImportModalState: PropTypes.func.isRequired,
    showImportModal: PropTypes.bool.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withTheme()(DropZoneDialog);
