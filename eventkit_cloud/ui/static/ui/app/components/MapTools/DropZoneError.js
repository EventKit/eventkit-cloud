import React, {Component, PropTypes} from 'react';
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
        const style = {
            margin: 'auto',
            width: '90%',
            height: 'auto',
            textAlign: 'center',
            border: '1px dashed',
            fontSize: '1em',
            color: '#707274',
            padding: '20px'
        }

        return (
            <PopupBox
                show={this.state.showErrorMessage}
                title="Error"
                onExit={this.handleErrorClear}>
                <div style={style} className={'qa-DropZoneError-error'}>
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
