import 'openlayers/dist/ol.css'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import ol from 'openlayers'
import styles from './SetAOIToolbar.css'
import DrawControl from './openlayers.DrawControl.js'
import {Toolbar, ToolbarGroup, ToolbarSeparator,ToolbarTitle} from 'material-ui/Toolbar'
import {toggleZoomToSelection, clickZoomToSelection, toggleResetMap, clickResetMap} from '../actions/setAoiToolbarActions.js'
import {clearSearchBbox} from '../actions/searchToolbarActions';

export const NO_SELECTION_TEXT = 'None Set'
export const CARDINAL_DIRECTIONS = "(West, South, East, North)"

const isEqual = require('lodash/isEqual');

export class SetAOIToolbar extends Component {

    constructor(props) {
        super(props)

        this.updateBboxText = this.updateBboxText.bind(this);
        this.updateZoomToSelectionState = this.updateZoomToSelectionState.bind(this);
        this.dispatchZoomToSelection = this.dispatchZoomToSelection.bind(this);
        this.updateResetMapState = this.updateResetMapState.bind(this);
        this.dispatchResetMap = this.dispatchResetMap.bind(this);
        this.handleAOISet = this.handleAOISet.bind(this);

        this.state = {
            areaSelectedText: NO_SELECTION_TEXT,
            zoomToSelectionClass: styles.inactiveButton,
            resetMapClass: styles.inactiveButton,
        }
    }

    componentWillReceiveProps(nextProps) {
        // Check if zoomToSelction state has been changed
        if (nextProps.zoomToSelection.disabled != this.props.zoomToSelection.disabled) {
            this.updateZoomToSelectionState(nextProps.zoomToSelection.disabled);
        }

        // Check if resetMap state has been changed
        if (nextProps.resetMap.disabled != this.props.zoomToSelection.disabled) {
            this.updateResetMapState(nextProps.resetMap.disabled);
        }
        if (nextProps.isAOISet != this.props.isAOISet) {
            this.handleAOISet(nextProps.isAOISet, nextProps.bbox, nextProps.geojson);
        }
    }

    handleAOISet(isSet, bbox, geojson) {
        if(isSet) {
            this.updateBboxText(bbox);
            this.props.toggleZoomToSelection(false);
            this.props.toggleResetMap(false);
        }
        else {
            this.updateBboxText([]);
            this.props.toggleZoomToSelection(true);
            this.props.toggleResetMap(true);
        }
    }

    updateBboxText(bbox) {
        // If a valid bbox has been set display it in the toolbar
        if (bbox.length != 0 && bbox != null) {
            this.setState({areaSelectedText:
                CARDINAL_DIRECTIONS + `: ${bbox[0]}, ${bbox[1]}, ${bbox[2]}, ${bbox[3]}`});
            this.props.toggleZoomToSelection(false);
            this.props.toggleResetMap(false);
        }
        // If no valid bbox set reset text to no selection
        else {
            if(this.state.areaSelectedText != NO_SELECTION_TEXT) {
                this.setState({areaSelectedText: NO_SELECTION_TEXT});
            }
            this.props.toggleZoomToSelection(true);
            this.props.toggleResetMap(true);
        }
    }

    // Change the appearance of the button to either active or inactive
    updateZoomToSelectionState(disabled) {
        if (disabled) {
            this.setState({zoomToSelectionClass: styles.inactiveButton});
        }
        else {
            this.setState({zoomToSelectionClass: styles.activeButton});
        }
    }

    // Change the appearance of the button to either active or inactive
    updateResetMapState(disabled) {
        if (disabled) {
            this.setState({resetMapClass: styles.inactiveButton});
        }
        else {
            this.setState({resetMapClass: styles.activeButton});
        }
    }

    dispatchZoomToSelection() {
        //If the zoom button is active dispatch the click
        if(!this.props.zoomToSelection.disabled){
            this.props.clickZoomToSelection();
        }
    }

    dispatchResetMap() {
        //If the reset map butotn is active dispatch the click
        if(!this.props.resetMap.disabled) {
            this.props.clickResetMap();
        }
    }

    render() {

        const toolbarStyles = {
            toolbar: {
                backgroundColor: '#fff',

            },
        }

        return (
            <div className={styles.toolbarDiv}>
                    <div className={styles.titleDiv}>
                        <strong>Set Area Of Interest (AOI)</strong>
                    </div>
                    <div className={styles.selectedDiv}>
                        {this.state.areaSelectedText}
                    </div>
                    <div className={styles.resetMapDiv}>
                        <button className={styles.simpleButton + ' '
                        + this.state.resetMapClass} onClick={this.dispatchResetMap}><i className={'fa fa-refresh'}></i>  RESET MAP</button>
                    </div>
                    <div className={styles.zoomToDiv}>
                        <button className={styles.simpleButton + ' '
                        + this.state.zoomToSelectionClass} onClick={this.dispatchZoomToSelection}><i className={'fa fa-search-plus'}></i>  ZOOM TO SELECTION</button>
                    </div>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        bbox: state.bbox,
        geojson: state.geojson,
        zoomToSelection: state.zoomToSelection,
        resetMap: state.resetMap,
        isAOISet: state.isAOISet,
    }
}

function mapDispatchToProps(dispatch) {
    return {
        toggleZoomToSelection: (isDisabled) => {
            dispatch(toggleZoomToSelection(isDisabled));
        },
        clickZoomToSelection: () => {
            dispatch(clickZoomToSelection());
        },
        toggleResetMap: (isDisabled) => {
            dispatch(toggleResetMap(isDisabled));
        },
        clickResetMap: () => {
            dispatch(clickResetMap());
        }
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SetAOIToolbar)
