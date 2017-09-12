import React, {Component} from 'react';
import {connect} from 'react-redux';
import styles from '../../styles/AoiInfobar.css';
import {toggleZoomToSelection, clickZoomToSelection, toggleResetMap, clickResetMap} from '../../actions/AoiInfobarActions.js';
import {PopupBox} from '../PopupBox';
import AlertWarning from 'material-ui/svg-icons/alert/warning';
import ImageCropSquare from 'material-ui/svg-icons/image/crop-square';
import ActionRoom from 'material-ui/svg-icons/action/room';
import ActionSearch from 'material-ui/svg-icons/action/search';

export const NO_SELECTION_ICON = <AlertWarning className={styles.geometryIcon}/>;
export const MULTIPOLYGON_ICON = <ImageCropSquare className={styles.geometryIcon}/>;
export const POLYGON_ICON = <ImageCropSquare className={styles.geometryIcon}/>;
export const POINT_ICON = <ActionRoom className={styles.geometryIcon}/>;
import isEqual from 'lodash/isEqual';

export class AoiInfobar extends Component {

    constructor(props) {
        super(props)
        this.dispatchZoomToSelection = this.dispatchZoomToSelection.bind(this);
        this.handleAoiInfo = this.handleAoiInfo.bind(this);
        this.state = {
            aoiDescription: '',
            aoiTitle: '',
            geometryIcon: NO_SELECTION_ICON,
            showAoiInfobar: false,
        }
    }

    componentDidMount() {
        this.handleAoiInfo(this.props.aoiInfo);
    }

    componentWillReceiveProps(nextProps) {
        if(!isEqual(nextProps.aoiInfo.geojson, this.props.aoiInfo.geojson)) {
            this.handleAoiInfo(nextProps.aoiInfo);
        }
    }

    handleAoiInfo(aoiInfo) {
        if(!isEqual(aoiInfo.geojson, {})) {
            if(aoiInfo.geomType == 'Point') {
            this.setState({geometryIcon: POINT_ICON});
            }
            else if(aoiInfo.geomType == 'Polygon') {
                this.setState({geometryIcon: POLYGON_ICON});
            }
            else if(aoiInfo.geomType == 'MultiPolygon') {
                this.setState({geometryIcon: MULTIPOLYGON_ICON});
            }
            this.setState({aoiTitle: aoiInfo.title});
            this.setState({aoiDescription: aoiInfo.description});
            this.setState({showAoiInfobar: true});
        }
        else {
            this.setState({showAoiInfobar: false});
            this.setState({geometryIcon: NO_SELECTION_ICON});
            this.setState({aoiTitle: ''});
            this.setState({aoiDescription: 'No AOI Set'});    
        }
    }

    dispatchZoomToSelection() {
        //If the zoom button is active dispatch the click
        if(!this.props.zoomToSelection.disabled){
            this.props.clickZoomToSelection();
        }
    }

    render() {
        return (
            <div>
                {this.state.showAoiInfobar ? 
                <div className={styles.aoiInfoWrapper}>
                    
                    <div className={styles.aoiInfobar}>
                        <div className={styles.topBar}>
                            <span className={styles.aoiInfoTitle}><strong>Area Of Interest (AOI)</strong></span>
                            <button className={styles.simpleButton + ' ' + styles.activeButton} onClick={this.dispatchZoomToSelection}>
                                <ActionSearch style={{fill: '#4498c0', verticalAlign: 'middle'}} className={styles.actionSearch}/> ZOOM TO SELECTION
                            </button>
                        </div>
                        <div className={styles.detailBar}>
                            {this.state.geometryIcon}
                            <div className={styles.detailText}>
                                <div className={styles.aoiTitle}>
                                    <strong>{this.state.aoiTitle}</strong>
                                </div>
                                <div className={styles.aoiDescription}>
                                    {this.state.aoiDescription}
                                </div>
                            </div>
                        </div>   
                    </div>
                    
                </div>
                : null}
            </div>
        )
    }
}

AoiInfobar.propTypes = {
    aoiInfo: React.PropTypes.object,
    zoomToSelection: React.PropTypes.object,
    clickZoomToSelection: React.PropTypes.func,
}

function mapStateToProps(state) {
    return {
        aoiInfo: state.aoiInfo,
        zoomToSelection: state.zoomToSelection,
    }
}

function mapDispatchToProps(dispatch) {
    return {
        
        clickZoomToSelection: () => {
            dispatch(clickZoomToSelection());
        },
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(AoiInfobar)
