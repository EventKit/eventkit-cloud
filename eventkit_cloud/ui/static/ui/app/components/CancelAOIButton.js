import React, {Component} from 'react';
import {connect} from 'react-redux';
import styles from './DrawAOIToolbar.css';
import {toggleDrawExtension, toggleDrawCancel, clickDrawCancel, toggleDrawRedraw,
    toggleDrawBoxButton, toggleDrawFreeButton, toggleDrawSet} from '../actions/drawToolBarActions.js';
import {updateMode, updateBbox} from '../actions/exportsActions.js';
import { Button } from 'react-bootstrap';


export const MODE_DRAW_BBOX = 'MODE_DRAW_BBOX'
export const MODE_NORMAL = 'MODE_NORMAL'


export class DrawAOIToolbar extends Component {

    constructor(props) {
        super(props);
        this.handleDrawCancel = this.handleDrawCancel.bind(this);
        this.updateCancelButtonState = this.updateCancelButtonState.bind(this);
        this.state = {
            cancelButtonClass: styles.flatButtonInactive,
        };
    }

    componentWillReceiveProps(nextProps){
        if(nextProps.drawCancel.click != this.props.drawCancel.click) {
            this.handleDrawCancel();
        }
        if(nextProps.drawCancel.disabled != this.props.drawCancel.disabled) {
            this.updateCancelButtonState(nextProps.drawCancel.disabled);
        }
    }

    updateCancelButtonState(disabled) {
        if (disabled) {
            this.setState({cancelButtonClass: styles.flatButtonInactive});
        }
        else {
            this.setState({cancelButtonClass: styles.flatButtonActive});
        }
    }

    dispatchDrawCancel() {
        //If the button is active, dispatch the 'click'
        if (!this.props.drawCancel.disabled) {
            this.props.clickDrawCancel()
        }
    }

    handleDrawCancel(){
        this.props.updateMode('MODE_DRAW_NORMAL');
        this.props.toggleDrawCancel(true);
        this.props.showDrawExtension(false);
        this.props.toggleDrawSet(true);
        this.props.toggleDrawBoxButton(true);
        this.props.toggleDrawFreeButton(true);
        this.props.toggleDrawRedraw(true);
    }


    render() {

        return (
            <Button bsClass={styles.buttonGeneral + ' ' + this.state.cancelButtonClass}
                onClick={this.props.clickDrawCancel}>
                    Cancel
            </Button>
        )
    }
}

function mapStateToProps(state) {
    return {
        drawExtensionVisible: state.drawExtensionVisible,
        drawCancel: state.drawCancel,
        mode: state.mode,
        geojson: state.geojson,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        showDrawExtension: (visible) => {
            dispatch(toggleDrawExtension(visible));
        },
        toggleDrawCancel: (isDisabled) => {
            dispatch (toggleDrawCancel(isDisabled));
        },
        clickDrawCancel: () => {
            dispatch(clickDrawCancel());
        },
        toggleDrawRedraw: (isDisabled) => {
            dispatch(toggleDrawRedraw(isDisabled));
        },
        updateMode: (newMode) => {
            dispatch(updateMode(newMode));
        },
        toggleDrawBoxButton: (isDisabled) => {
            dispatch(toggleDrawBoxButton(isDisabled));
        },
        toggleDrawFreeButton: (isDisabled) => {
            dispatch(toggleDrawFreeButton(isDisabled));
        },
        toggleDrawSet: (isDisabled) => {
            dispatch(toggleDrawSet(isDisabled));
        },
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DrawAOIToolbar);



