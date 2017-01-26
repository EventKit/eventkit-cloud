import React, {Component} from 'react';
import {connect} from 'react-redux';
import styles from './DrawAOIToolbar.css';
import {toggleDrawExtension, toggleDrawCancel, clickDrawCancel, toggleDrawRedraw,
    clickDrawRedraw, toggleDrawBoxButton, toggleDrawFreeButton, toggleDrawSet} from '../actions/drawToolBarActions.js';
import {updateMode, updateBbox} from '../actions/exportsActions.js';
import DrawButtons from './DrawButtons.js';
import RedrawAOIButton from './RedrawAOIButton.js';
import CancelAOIButton from './CancelAOIButton';
import SetAOIButton from './SetAOIButton.js';
import { Button } from 'react-bootstrap';


export const MODE_DRAW_BBOX = 'MODE_DRAW_BBOX'
export const MODE_NORMAL = 'MODE_NORMAL'


export class DrawAOIToolbar extends Component {

    constructor(props) {
        super(props);
        this.handleDrawBoxClick = this.handleDrawBoxClick.bind(this);
        this.handleDrawFreeClick = this.handleDrawFreeClick.bind(this);
        this.updateDrawExtensionVisibility = this.updateDrawExtensionVisibility.bind(this);
        this.state = {
            extensionClass: styles.extensionToolbarDivHidden,
        };
    }

    componentWillReceiveProps(nextProps){
        if(nextProps.drawBoxButton.click != this.props.drawBoxButton.click) {
            this.handleDrawBoxClick();
        }
        if(nextProps.drawFreeButton.click != this.props.drawFreeButton.click) {
            this.handleDrawFreeClick();
        }
        if(nextProps.drawExtensionVisible != this.props.drawExtensionVisible) {
            this.updateDrawExtensionVisibility(nextProps.drawExtensionVisible);
        }

    }

    updateDrawExtensionVisibility(visible) {
        if (visible) {
            this.setState({extensionClass: styles.extensionToolbarDiv});
            
        }
        else {
            this.setState({extensionClass: styles.extensionToolbarDivHidden});
            
        }
    }

    handleDrawFreeClick() {
        if(this.props.drawFreeButton.disabled) {
            this.props.updateMode('MODE_DRAW_FREE');
            this.props.showDrawExtension(true);
            // make the cancel button available
            this.props.toggleDrawCancel(false);
        }
    }

    handleDrawBoxClick() {
        // If button is not already active, add the extension
        if(this.props.drawBoxButton.disabled) {
            this.props.updateMode('MODE_DRAW_BBOX')
            this.props.showDrawExtension(true);
            // make the cancel button available
            this.props.toggleDrawCancel(false);
        }
    }

    render() {

        return (
            <div className={styles.toolbarsContainer}>
                <div className={styles.toolbarDiv}>
                    <div className={styles.title}>Draw Custom</div>
                    <div className={styles.drawButtonsDiv}>
                        <DrawButtons />
                    </div>
                </div>
                <div className={this.state.extensionClass}>
                        <SetAOIButton />
                        <RedrawAOIButton />
                        <CancelAOIButton />
                </div>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        drawExtensionVisible: state.drawExtensionVisible,
        drawCancel: state.drawCancel,
        drawRedraw: state.drawRedraw,
        drawBoxButton: state.drawBoxButton,
        drawFreeButton: state.drawFreeButton,
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
        clickDrawRedraw: () => {
            dispatch(clickDrawRedraw());
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



