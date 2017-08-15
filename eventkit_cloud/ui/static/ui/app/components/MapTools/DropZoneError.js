import React, {Component, PropTypes} from 'react';
import styles from '../../styles/DropZone.css';
import {PopupBox} from '../PopupBox';

export class DropZoneError extends Component {

    constructor(props) {
        super(props);
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

    handleErrorClear() {
        this.setState({showErrorMessage: false});
        this.props.resetGeoJSONFile();
    }

    render() {

        return (
            <PopupBox
                show={this.state.showErrorMessage}
                title="Error"
                onExit={this.handleErrorClear}>
                <div className={styles.fileError}>
                    {this.state.errorMessage}
                </div>
            </PopupBox>
        )
    }
}

DropZoneError.propTypes = {
    importGeom: PropTypes.object,
    setAllButtonsDefault: PropTypes.func,
    resetGeoJSONFile: PropTypes.func,
}

export default DropZoneError;
