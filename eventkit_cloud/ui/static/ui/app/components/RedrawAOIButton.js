import React, {Component} from 'react';
import {connect} from 'react-redux';
import styles from './DrawAOIToolbar.css';
import {toggleDrawExtension, toggleDrawCancel, clickDrawCancel, toggleDrawRedraw,
    clickDrawRedraw, toggleDrawBoxButton, toggleDrawFreeButton, toggleDrawSet} from '../actions/drawToolBarActions.js';
import {updateMode, updateBbox} from '../actions/exportsActions.js';
import { Button } from 'react-bootstrap';


export const MODE_DRAW_BBOX = 'MODE_DRAW_BBOX'
export const MODE_NORMAL = 'MODE_NORMAL'

export class RedrawAOIButton extends Component {

    constructor(props) {
        super(props);
        this.handleDrawRedraw = this.handleDrawRedraw.bind(this);
        this.updateRedrawButtonState = this.updateRedrawButtonState.bind(this);
        this.state = {
            redrawButtonClass: styles.flatButtonInactive,
        };
    }

    componentWillReceiveProps(nextProps){
        if(nextProps.drawRedraw.click != this.props.drawRedraw.click) {
            this.handleDrawRedraw();
        }
        if (nextProps.drawRedraw.disabled != this.props.drawRedraw.disabled) {
            this.updateRedrawButtonState(nextProps.drawRedraw.disabled);
        }
    }


    updateRedrawButtonState(disabled) {
        if (disabled) {
            this.setState({redrawButtonClass: styles.flatButtonInactive});
        }
        else {
            this.setState({redrawButtonClass: styles.flatButtonActive});
        }
    }

    dispatchDrawRedraw() {
        if (!this.props.drawRedraw.disabled) {
            this.props.clickDrawRedraw()
        }
    }

    handleDrawRedraw() {
        if(!this.props.drawBoxButton.disabled) {
            this.props.updateMode('MODE_DRAW_BBOX');
        }
        else if(!this.props.drawFreeButton.disabled) {
            this.props.updateMode('MODE_DRAW_FREE');
        }
        this.props.toggleDrawRedraw(true);
        this.props.toggleDrawSet(true);
    }

    render() {

        return (
            <Button bsClass={styles.buttonGeneral + ' ' + this.state.redrawButtonClass}
                onClick={this.props.clickDrawRedraw}>
                    Redraw
            </Button>
        )
    }
}

function mapStateToProps(state) {
    return {
        drawBoxButton: state.drawBoxButton,
        drawFreeButton: state.drawFreeButton,
        drawRedraw: state.drawRedraw,
        mode: state.mode,
        geojson: state.geojson,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        updateMode: (newMode) => {
            dispatch(updateMode(newMode));
        },
        toggleDrawRedraw: (isDisabled) => {
            dispatch(toggleDrawRedraw(isDisabled));
        },
        clickDrawRedraw: () => {
            dispatch(clickDrawRedraw());
        },
        toggleDrawSet: (isDisabled) => {
            dispatch(toggleDrawSet(isDisabled))
        }
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(RedrawAOIButton);


