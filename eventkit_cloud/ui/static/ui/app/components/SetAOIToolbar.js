import 'openlayers/dist/ol.css';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import ol from 'openlayers';
import styles from './SetAOIToolbar.css';
import {toggleZoomToSelection, clickZoomToSelection, toggleResetMap, clickResetMap} from '../actions/setAoiToolbarActions.js';
import {PopupBox} from './PopupBox.js';

export const NO_SELECTION_ICON = 'warning';
export const POLYGON_ICON = 'crop_square';
export const POINT_ICON = 'room';

const isEqual = require('lodash/isEqual');

export class SetAOIToolbar extends Component {

    constructor(props) {
        super(props)
        this.updateZoomToSelectionState = this.updateZoomToSelectionState.bind(this);
        this.dispatchZoomToSelection = this.dispatchZoomToSelection.bind(this);
        this.updateResetMapState = this.updateResetMapState.bind(this);
        this.dispatchResetMap = this.dispatchResetMap.bind(this);
        this.handleAoiInfo = this.handleAoiInfo.bind(this);
        this.handleInfoClick = this.handleInfoClick.bind(this);

        this.state = {
            aoiDescription: 'No AOI Set',
            aoiTitle: '',
            zoomToSelectionClass: styles.inactiveButton,
            resetMapClass: styles.inactiveButton,
            geometryIcon: NO_SELECTION_ICON,
            showInfoPopup: false,
        }
    }

    componentWillReceiveProps(nextProps) {
        // Check if zoomToSelection state has been changed
        if (nextProps.zoomToSelection.disabled != this.props.zoomToSelection.disabled) {
            this.updateZoomToSelectionState(nextProps.zoomToSelection.disabled);
        }

        // Check if resetMap state has been changed
        if (nextProps.resetMap.disabled != this.props.zoomToSelection.disabled) {
            this.updateResetMapState(nextProps.resetMap.disabled);
        }

        if(!isEqual(nextProps.aoiInfo.geojson, this.props.aoiInfo.geojson)) {
            this.handleAoiInfo(nextProps.aoiInfo);
        }
    }

    handleAoiInfo(aoiInfo) {
        if(!isEqual(aoiInfo.geojson, {})) {
            this.props.toggleZoomToSelection(false);
            this.props.toggleResetMap(false);
            if(aoiInfo.geomType == 'Point') {
            this.setState({geometryIcon: POINT_ICON});
            }
            else if(aoiInfo.geomType == 'Polygon') {
                this.setState({geometryIcon: POLYGON_ICON});
            }
            this.setState({aoiTitle: aoiInfo.title});
            this.setState({aoiDescription: aoiInfo.description});    
        }
        else {
            this.props.toggleZoomToSelection(true);
            this.props.toggleResetMap(true);
            this.setState({geometryIcon: NO_SELECTION_ICON});
            this.setState({aoiTitle: ''});
            this.setState({aoiDescription: 'No AOI Set'});    
        }
    }

    handleInfoClick() {
        console.log('Ive been clicked');
        this.setState({showInfoPopup: true})
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

        return (
            <div>
                <div className={styles.setAOIContainer}>
                    <div className={styles.topBar}>
                        <span className={styles.setAOITitle}><strong>Set Area Of Interest (AOI)</strong></span>
                        <button className={styles.simpleButton + ' ' + this.state.zoomToSelectionClass} onClick={this.dispatchZoomToSelection}><i className={"fa fa-search-plus"}></i> ZOOM TO SELECTION</button>
                        <button className={styles.simpleButton + ' ' + this.state.resetMapClass} onClick={this.dispatchResetMap}><i className={"fa fa-refresh"}></i> RESET VIEW</button>
                    </div>
                    <div className={styles.detailBar}>
                        <i 
                            style={this.state.geometryIcon == NO_SELECTION_ICON ? {color: '#f4d225'}: {color: '#4598bf'}} 
                            className={"material-icons " + styles.geometryIcon}>
                                {this.state.geometryIcon}
                        </i>
                        <div className={styles.detailText}>
                            <div className={styles.aoiTitle}>
                                <strong>{this.state.aoiTitle}</strong>
                                {this.state.geometryIcon != NO_SELECTION_ICON ? 
                                    <button className={styles.aoiInfo} onClick={this.handleInfoClick}>
                                        <i className={"material-icons"} style={{fontSize: '15px', color: '#4598bf'}}>info</i>
                                    </button>
                                : null}
                            </div>
                            <div className={styles.aoiDescription}>
                                {this.state.aoiDescription}
                            </div>
                        </div>
                    </div>
                </div>
                <PopupBox show={this.state.showInfoPopup} title='AOI Info' onExit={() => {this.setState({showInfoPopup: false})}}>
                    <p> AOI Geojson </p>
                    <div style={{overflowY: 'scroll', maxHeight: '430px'}}>{JSON.stringify(this.props.aoiInfo.geojson, undefined, 2)}</div>
                </PopupBox>
            </div>
        )
    }
}

SetAOIToolbar.propTypes = {
    bbox: React.PropTypes.arrayOf(React.PropTypes.number),
    aoiInfo: React.PropTypes.object,
    zoomToSelection: React.PropTypes.object,
    resetMap: React.PropTypes.object,
    toggleZoomToSelection: React.PropTypes.func,
    clickZoomToSelection: React.PropTypes.func,
    toggleResetMap: React.PropTypes.func,
    clickResetMap: React.PropTypes.func,
}

function mapStateToProps(state) {
    return {
        bbox: state.bbox,
        aoiInfo: state.aoiInfo,
        zoomToSelection: state.zoomToSelection,
        resetMap: state.resetMap,
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
