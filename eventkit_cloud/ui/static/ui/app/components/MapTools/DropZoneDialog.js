import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import Dropzone from 'react-dropzone';
import Button from '@material-ui/core/Button';
import FileFileUpload from '@material-ui/icons/CloudUpload';
import RootRef from '@material-ui/core/RootRef/RootRef';
import BaseDialog from '../Dialog/BaseDialog';

export class DropZoneDialog extends Component {

    static contextTypes = {
        config: PropTypes.object,
    };

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
                margin: '0px auto',
                width: '100%',
                height: '250px',
                textAlign: 'center',
                border: '1px dashed',
                fontSize: '1em',
                color: colors.primary,
                verticalAlign: 'center',
            },
            text: {
                verticalAlign: 'center',
                color: colors.grey,
                height: '100px',
                marginTop: '30px',
            },
        };

        return (
            <BaseDialog
                show={this.props.showImportModal}
                onClose={this.handleClear}
                title="Import AOI"
                actions={[]}
                bodyStyle={{ paddingBottom: '50px' }}
                className="qa-DropZoneDialog-BaseDialog"
            >
                <Dropzone
                    onDrop={this.onDrop}
                    multiple={false}
                    style={{}}
                    maxSize={this.context.config.MAX_UPLOAD_SIZE * 1000000}
                    className="qa-DropZoneDialog-Dropzone"
                >
                    {({ getRootProps, getInputProps }) => {
                        const { ref } = getRootProps();
                        return (
                            <RootRef rootRef={ref}>
                                <div {...getRootProps()} style={styles.drop} className="qa-DropZoneDialog-text">
                                    <span style={styles.text}>
                                        <strong>GeoJSON, KML, GPKG, zipped SHP, GeoTIFF</strong>
                                        <br />
                                        and other major geospatial data formats are supported.
                                        <br />
                                        <strong> {this.context.config.MAX_UPLOAD_SIZE} MB </strong>
                                        max
                                        <br />
                                        Drag and drop or
                                        <br />
                                    </span>
                                    <Button
                                        style={{ margin: '15px 10px' }}
                                        variant="contained"
                                        color="primary"
                                        className="qa-DropZoneDialog-Button-select"
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
    showImportModal: PropTypes.bool.isRequired,
    setAllButtonsDefault: PropTypes.func.isRequired,
    setImportModalState: PropTypes.func.isRequired,
    processGeoJSONFile: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withTheme(DropZoneDialog);
