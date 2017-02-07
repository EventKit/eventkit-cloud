import React, {Component} from 'react';
import {connect} from 'react-redux';
import styles from './DropZone.css';
import {setAllButtonsDefault, resetGeoJSONFile} from '../actions/mapToolActions';

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
            <div>
                { this.state.showErrorMessage ?
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
        importGeom: state.importGeom,
    };
}


function mapDispatchToProps(dispatch) {
    return {
        setAllButtonsDefault: () => {
            dispatch(setAllButtonsDefault());
        },
        resetGeoJSONFile: (file) => {
            dispatch(resetGeoJSONFile());
        },
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DropZoneError);
