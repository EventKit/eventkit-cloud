import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import styles from '../../styles/AoiInfobar.css';
import AlertWarning from 'material-ui/svg-icons/alert/warning';
import ImageCropSquare from 'material-ui/svg-icons/image/crop-square';
import ActionRoom from 'material-ui/svg-icons/action/room';
import ActionSearch from 'material-ui/svg-icons/action/search';
import isEqual from 'lodash/isEqual';

export const NO_SELECTION_ICON = <AlertWarning className={styles.geometryIcon}/>;
export const MULTIPOLYGON_ICON = <ImageCropSquare className={styles.geometryIcon}/>;
export const POLYGON_ICON = <ImageCropSquare className={styles.geometryIcon}/>;
export const POINT_ICON = <ActionRoom className={styles.geometryIcon}/>;

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
            let icon = null
            if(aoiInfo.geomType == 'Point') {
                icon = POINT_ICON;
            }
            else if(aoiInfo.geomType == 'Polygon') {
                icon = POLYGON_ICON;
            }
            else if(aoiInfo.geomType == 'MultiPolygon') {
                icon = MULTIPOLYGON_ICON;
            }
            this.setState({
                geometryIcon: icon,
                aoiTitle: aoiInfo.title,
                aoiDescription: aoiInfo.description,
                showAoiInfobar: true
            });
        }
        else {
            this.setState({
                showAoiInfobar: false,
                geometryIcon: NO_SELECTION_ICON,
                aoiTitle: '',
                aoiDescription: 'No AOI Set'
            });
        }
    }

    dispatchZoomToSelection() {
        //If the zoom button is active dispatch the click
        if(!this.props.disabled){
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
    aoiInfo: PropTypes.object,
    disabled: PropTypes.bool,
    clickZoomToSelection: PropTypes.func,
}

export default AoiInfobar;
