import 'openlayers/dist/ol.css'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import ol from 'openlayers'
import styles from './DrawAOIToolbar.css'
import DrawControl from './openlayers.DrawControl.js'
import RaisedButton from 'material-ui/RaisedButton'
import FlatButton from 'material-ui/FlatButton'
import {Toolbar, ToolbarGroup, ToolbarSeparator,ToolbarTitle} from 'material-ui/Toolbar'
import {toggleDrawExtension, toggleDrawCancel, clickDrawCancel, toggleDrawRedraw,
    clickDrawRedraw, toggleDrawSet, clickDrawSet, toggleDrawBoxButton} from '../actions/drawToolBarActions.js'
import {updateMode, updateBbox} from '../actions/exportsActions.js'
import DrawButtons from './DrawButtons.js'


export const MODE_DRAW_BBOX = 'MODE_DRAW_BBOX'
export const MODE_NORMAL = 'MODE_NORMAL'


export class DrawAOIToolbar extends Component {

    constructor(props) {
        super(props);
        this.handleDrawBoxClick = this.handleDrawBoxClick.bind(this);
        this.updateDrawExtensionVisibility = this.updateDrawExtensionVisibility.bind(this);
        this.handleDrawCancel = this.handleDrawCancel.bind(this);
        this.handleDrawRedraw = this.handleDrawRedraw.bind(this);
        this.state = {
            extensionClass: styles.extensionToolbarDivHidden,
            redrawDisabled: true,
            setDisabled: true,
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

    }

    updateDrawExtensionVisibility(visible) {
        if (visible) {
            this.setState({extensionClass: styles.extensionToolbarDiv});
            
        }
        else {
            this.setState({extensionClass: styles.extensionToolbarDivHidden});
            
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

    handleDrawCancel(){
        this.props.updateMode('MODE_DRAW_NORMAL');
        this.props.toggleDrawCancel(this.props.drawCancelDisabled);
        this.setState({extensionClass: styles.extensionToolbarDivHidden});
        this.props.toggleDrawSet(this.props.drawSet.disabled);
        this.props.toggleDrawBoxButton(this.props.drawBoxButton.disabled);
        this.props.toggleDrawRedraw(this.props.drawRedraw.disabled);
    }

    handleDrawRedraw() {
        console.log('You have chosen to redraw')
        this.props.updateMode('MODE_DRAW_BBOX')
        this.props.toggleDrawRedraw(this.props.drawRedraw.disabled)
        this.props.toggleDrawSet(this.props.drawSet.disabled)
    }

    render() {

        const toolbarStyles = {
            toolbar: {
                height: '50px',
                backgroundColor: '#fff',
            },
            setButton: {
                height: '30px',
                width: '70px',
            }
        }


        return (
            <div className={styles.toolbarsContainer}>
                <div className={styles.toolbarDiv}>
                    <Toolbar style={toolbarStyles.toolbar}>
                        <div className={styles.titleDiv}>
                            <span className={styles.titleSpan}><strong>Draw Custom</strong></span>
                        </div>
                        <DrawButtons />
                    </Toolbar>
                </div>
                <div className={this.state.extensionClass}>
                    <Toolbar style={toolbarStyles.toolbar}>
                        <div className={styles.cancelButtonDiv}>
                            <FlatButton 
                                label="Cancel" 
                                primary={!this.props.drawCancel.disabled}
                                disabled={this.props.drawCancel.disabled}
                                onClick={this.props.clickDrawCancel}
                             />
                        </div>
                        <div className={styles.redrawButtonDiv}>
                            <FlatButton
                                label="Redraw"
                                primary={!this.props.drawRedraw.disabled}
                                disabled={this.props.drawRedraw.disabled}
                                onClick={this.props.clickDrawRedraw}
                            />
                        </div>
                        <div className={styles.setButtonDiv}>
                            <RaisedButton label="SET"
                              style={toolbarStyles.setButton}
                              className={styles.setButton}
                              primary={!this.props.drawSet.disabled}
                              disabled={this.props.drawSet.disabled}
                              onClick={this.props.clickDrawSet}
                            />
                        </div>
                    </Toolbar>
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



