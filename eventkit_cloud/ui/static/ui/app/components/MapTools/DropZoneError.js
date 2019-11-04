import PropTypes from 'prop-types';
import React, { Component } from 'react';
import BaseDialog from '../Dialog/BaseDialog';

export class DropZoneError extends Component {
    constructor(props) {
        super(props);
        this.handleErrorClear = this.handleErrorClear.bind(this);
        this.state = {
            showErrorMessage: false,
            errorMessage: null,
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.importGeom.error !== prevProps.importGeom.error) {
            if (this.props.importGeom.error) {
                this.props.setAllButtonsDefault();
                // reconsider setting state in componentDidUpdate in the future
                this.setState({ // eslint-disable-line
                    showErrorMessage: true,
                    errorMessage: this.props.importGeom.error,
                });
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
