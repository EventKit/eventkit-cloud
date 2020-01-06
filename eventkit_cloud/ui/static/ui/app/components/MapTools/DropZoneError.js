import PropTypes from 'prop-types';
import React, { Component } from 'react';
import BaseDialog from '../Dialog/BaseDialog';

export class DropZoneError extends Component {
    constructor(props) {
        super(props);
        this.handleErrorClear = this.handleErrorClear.bind(this);
        this.state = {
            errorMessage: null,
            showErrorMessage: false,
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.importGeom.error !== prevProps.importGeom.error) {
            if (this.props.importGeom.error) {
                this.props.setAllButtonsDefault();
                // reconsider setting state in componentDidUpdate in the future
                this.setState({ // eslint-disable-line
                    errorMessage: this.props.importGeom.error,
                    showErrorMessage: true,
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
                onClose={this.handleErrorClear}
                show={this.state.showErrorMessage}
                title="Error"
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
    resetGeoJSONFile: PropTypes.func.isRequired,
    setAllButtonsDefault: PropTypes.func.isRequired,
};

export default DropZoneError;
