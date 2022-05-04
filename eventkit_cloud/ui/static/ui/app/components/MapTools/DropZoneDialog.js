import PropTypes from 'prop-types';
import { Component } from 'react';
import withTheme from '@mui/styles/withTheme';
import Dropzone from 'react-dropzone';
import Button from '@mui/material/Button';
import FileFileUpload from '@mui/icons-material/CloudUpload';
import RootRef from '@mui/material/RootRef/RootRef';
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
        let maxUploadSize = 5;
        if (this.context.config) {
            maxUploadSize = this.context.config.MAX_UPLOAD_SIZE;
        }

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
                    maxSize={maxUploadSize * 1000000}
                    className="qa-DropZoneDialog-Dropzone"
                >
                    {({ getRootProps, getInputProps }) => {
                        const { ref } = getRootProps();
                        return (
                            <>
                                <div {...getRootProps()} style={styles.drop} className="qa-DropZoneDialog-text">
                                    <span style={styles.text}>
                                        <strong>GeoJSON, KML, GPKG, zipped SHP, GeoTIFF</strong>
                                        <br />
                                        and other major geospatial data formats are supported.
                                        <br />
                                        <strong> {maxUploadSize} MB </strong>
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
                            </>
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

DropZoneDialog.contextTypes = {
    config: PropTypes.shape({
        MAX_UPLOAD_SIZE: PropTypes.number,
    }),
};

export default withTheme(DropZoneDialog);
