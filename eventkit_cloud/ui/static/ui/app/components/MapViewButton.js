import React, {Component} from 'react';
import {connect} from 'react-redux';
import styles from './DrawAOIToolbar.css';
import {setMapViewButtonSelected, setAllButtonsDefault} from '../actions/mapToolActions'
import {updateMode, updateBbox} from '../actions/exportsActions.js';

export class MapViewButton extends Component {

    constructor(props) {
        super(props);
        this.handleOnClick = this.handleOnClick.bind(this);
        this.state = {
            icon: DEFAULT_ICON,
        }
    }

    componentWillReceiveProps(nextProps) {
        //If the button has been selected update the button state
        if(nextProps.toolbarIcons.mapView == 'SELECTED'){
            this.setState({icon: SELECTED_ICON});
        }
        // If the button has been de-selected update the button state
        if(nextProps.toolbarIcons.mapView == 'DEFAULT'){
            this.setState({icon: DEFAULT_ICON});
        }
        // If the button has been set as inactive update the state
        if(nextProps.toolbarIcons.mapView == 'INACTIVE') {
            this.setState({icon: INACTIVE_ICON});
        }
    }

    handleOnClick() {
        if(this.state.icon == SELECTED_ICON) {
            this.props.setAllButtonsDefault();
            this.props.handleCancel();
        }
        else if (this.state.icon == DEFAULT_ICON) {
            this.props.setMapViewButtonSelected();
            this.props.setMapView();
        }
    }

    render() {
        return (
            <div>
                <button className={styles.drawButtonGeneral} onClick={this.handleOnClick}>
                    {this.state.icon}
                </button>
            </div>
        )
    }
}

const DEFAULT_ICON = <div>
                        <i className={"material-icons " + styles.defaultButton}>crop_original</i>
                        <div className={styles.buttonName}>CURRENT VIEW</div>
                    </div>
                    
const INACTIVE_ICON = <div>
                        <i className={"material-icons " + styles.inactiveButton}>crop_original</i>
                        <div className={styles.buttonName + ' ' + styles.buttonNameInactive}>CURRENT VIEW</div>
                    </div>

const SELECTED_ICON =<div>
                        <i className={"material-icons " + styles.selectedButton}>clear</i>
                        <div className={styles.buttonName}>CURRENT VIEW</div>
                    </div>

function mapStateToProps(state) {
    return {
        toolbarIcons: state.toolbarIcons,
        mode: state.mode,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        updateMode: (newMode) => {
            dispatch(updateMode(newMode));
        },
        setMapViewButtonSelected: () => {
            dispatch(setMapViewButtonSelected());
        },
        setAllButtonsDefault: () => {
            dispatch(setAllButtonsDefault());
        }
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MapViewButton);
