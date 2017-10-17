import React, { Component, PropTypes } from 'react';
import BaseDialog from '../BaseDialog';

export class DropZoneError extends Component {
    constructor(props) {
        super(props);
        this.handleErrorClear = this.handleErrorClear.bind(this);
        this.state = {
            showErrorMessage: false,
            errorMessage: null,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.importGeom.error !== this.props.importGeom.error) {
            if (nextProps.importGeom.error) {
                this.props.setAllButtonsDefault();
                this.setState({ showErrorMessage: true, errorMessage: nextProps.importGeom.error });
            }
        }
    }

    handleErrorClear() {
        this.setState({ showErrorMessage: false });
        this.props.resetGeoJSONFile();
    }

    render() {
        return (
            <BaseDialog
                show={this.state.showErrorMessage}
                title="Error"
                onClose={this.handleErrorClear}
            >
                <div className="qa-DropZoneError-error">
                    {this.state.errorMessage}
                </div>
            </BaseDialog>
        );
    }
}

DropZoneError.propTypes = {
    importGeom: PropTypes.object.isRequired,
    setAllButtonsDefault: PropTypes.func.isRequired,
    resetGeoJSONFile: PropTypes.func.isRequired,
};

export default DropZoneError;
