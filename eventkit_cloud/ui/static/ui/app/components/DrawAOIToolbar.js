import 'openlayers/dist/ol.css';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import ol from 'openlayers';
import styles from './DrawAOIToolbar.css';
import DrawControl from './openlayers.DrawControl.js';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import {Toolbar, ToolbarGroup, ToolbarSeparator,ToolbarTitle} from 'material-ui/Toolbar';
import {toggleDrawExtension, toggleDrawCancel, clickDrawCancel, toggleDrawRedraw,
    clickDrawRedraw, toggleDrawSet, clickDrawSet, toggleDrawBoxButton} from '../actions/drawToolBarActions.js';
import {updateMode, updateBbox} from '../actions/exportsActions.js';
import DrawButtons from './DrawButtons.js';
import { Button } from 'react-bootstrap';


export const MODE_DRAW_BBOX = 'MODE_DRAW_BBOX'
export const MODE_NORMAL = 'MODE_NORMAL'


export class DrawAOIToolbar extends Component {

    constructor(props) {
        super(props);
        this.handleDrawBoxClick = this.handleDrawBoxClick.bind(this);
        this.updateDrawExtensionVisibility = this.updateDrawExtensionVisibility.bind(this);
        this.handleDrawCancel = this.handleDrawCancel.bind(this);
        this.handleDrawRedraw = this.handleDrawRedraw.bind(this);
        this.updateCancelButtonState = this.updateCancelButtonState.bind(this);
        this.updateRedrawButtonState = this.updateRedrawButtonState.bind(this);
        this.state = {
            extensionClass: styles.extensionToolbarDivHidden,
            redrawDisabled: true,
            setDisabled: true,
            setButtonClass: styles.setButtonInactive,
            cancelButtonClass: styles.flatButtonInactive,
            redrawButtonClass: styles.flatButtonInactive,
        };
    }

    componentWillReceiveProps(nextProps){
        if(nextProps.drawCancel.click != this.props.drawCancel.click) {
            this.handleDrawCancel();
        }
        if(nextProps.drawRedraw.click != this.props.drawRedraw.click) {
            this.handleDrawRedraw();
        }
        if(nextProps.drawBoxButton.click != this.props.drawBoxButton.click) {
            this.handleDrawBoxClick();
        }
        if(nextProps.drawCancel.disabled != this.props.drawCancel.disabled) {
            this.updateCancelButtonState(nextProps.drawCancel.disabled);
        }
        if (nextProps.drawRedraw.disabled != this.props.drawRedraw.disabled) {
            this.updateRedrawButtonState(nextProps.drawRedraw.disabled);
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

    updateCancelButtonState(disabled) {
        if (disabled) {
            this.setState({cancelButtonClass: styles.flatButtonInactive});
        }
        else {
            this.setState({cancelButtonClass: styles.flatButtonActive});
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


    handleDrawBoxClick() {
        // If button is not already active, add the extension
        if(this.props.drawBoxButton.disabled) {
            console.log(this.props.drawBoxButton.disabled);
            this.props.updateMode('MODE_DRAW_BBOX')
            this.props.showDrawExtension(this.props.drawExtensionVisible);
            this.setState({extensionClass: styles.extensionToolbarDiv});
            // make the cancel button available
            this.props.toggleDrawCancel(this.props.drawCancel.disabled)
        }
    }

    dispatchDrawCancel() {
        //If the button is active, dispatch the 'click'
        if (!this.props.drawCancel.disabled) {
            this.props.clickDrawCancel()
        }
    }
    dispatchDrawRedraw() {
        if (!this.props.drawRedraw.disabled) {
            this.props.clickDrawRedraw()
        }
    }

    handleDrawCancel(){
        this.props.updateMode('MODE_DRAW_NORMAL');
        this.props.toggleDrawCancel(false);
        this.setState({extensionClass: styles.extensionToolbarDivHidden});
        this.props.toggleDrawSet(false);
        this.props.toggleDrawBoxButton(false);
        this.props.toggleDrawRedraw(false);
    }

    handleDrawRedraw() {
        console.log('You have chosen to redraw')
        this.props.updateMode('MODE_DRAW_BBOX')
        this.props.toggleDrawRedraw(false);
        this.props.toggleDrawSet(false);
    }

    render() {

        const toolbarStyles = {
            toolbar: {
                height: '50px',
                backgroundColor: '#fff',
                padding: '0px 0px',
            },
            setButton: {
                height: '30px',
                width: '70px',
            }
        }


        return (
            <div className={styles.toolbarsContainer}>
                <div className={styles.toolbarDiv}>
                    <div className={styles.title}>Draw Custom</div>
                    <div className={styles.drawButtonsDiv}>
                        <DrawButtons />
                    </div>
                </div>
                <div className={this.state.extensionClass}>



                        <div className={styles.setButtonDiv}>
                            <Button bsClass={styles.buttonGeneral + ' ' + this.state.setButtonClass} onClick={this.props.clickDrawSet}>SET</Button>
                        </div>
                        <Button bsClass={styles.buttonGeneral + ' ' + this.state.redrawButtonClass}
                            onClick={this.props.clickDrawRedraw}>
                                Redraw
                        </Button>
                        <Button bsClass={styles.buttonGeneral + ' ' + this.state.cancelButtonClass}
                            onClick={this.props.clickDrawCancel}>
                                Cancel
                        </Button>
                </div>
            </div>
        )
    }
}

//<FlatButton
//                                label="Cancel"
//                                primary={!this.props.drawCancel.disabled}
//                                disabled={this.props.drawCancel.disabled}
//                                onClick={this.props.clickDrawCancel}
//                             />

// <div className={styles.redrawButtonDiv}>
//                            <FlatButton
//                                label="Redraw"
//                                primary={!this.props.drawRedraw.disabled}
//                                disabled={this.props.drawRedraw.disabled}
//                                onClick={this.props.clickDrawRedraw}
//                            />
//                        </div>

function mapStateToProps(state) {
    return {
        drawExtensionVisible: state.drawExtensionVisible,
        drawCancel: state.drawCancel,
        drawRedraw: state.drawRedraw,
        drawSet: state.drawSet,
        drawBoxButton: state.drawBoxButton,
        mode: state.mode,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        showDrawExtension: (currentVisibility) => {
            dispatch(toggleDrawExtension(currentVisibility))
        },
        toggleDrawCancel: (currentVisibility) => {
            dispatch (toggleDrawCancel(currentVisibility))
        },
        clickDrawCancel: () => {
            dispatch(clickDrawCancel())
        },
        toggleDrawRedraw: (currentVisibility) => {
            dispatch(toggleDrawRedraw(currentVisibility))
        },
        clickDrawRedraw: () => {
            dispatch(clickDrawRedraw())
        },
        toggleDrawSet: (currentToggleState) => {
            dispatch(toggleDrawSet(currentToggleState))
        },
        clickDrawSet: () => {
            dispatch(clickDrawSet())
        },
        updateMode: (newMode) => {
            dispatch(updateMode(newMode))
        },
        toggleDrawBoxButton: (currentToggleState) => {
            dispatch(toggleDrawBoxButton(currentToggleState))
        },
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DrawAOIToolbar);



