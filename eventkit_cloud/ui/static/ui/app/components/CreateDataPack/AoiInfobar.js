import React, {Component} from 'react';
import {connect} from 'react-redux';
import {toggleZoomToSelection, clickZoomToSelection, toggleResetMap, clickResetMap} from '../../actions/AoiInfobarActions.js';
import {PopupBox} from '../PopupBox';
import AlertWarning from 'material-ui/svg-icons/alert/warning';
import ImageCropSquare from 'material-ui/svg-icons/image/crop-square';
import ActionRoom from 'material-ui/svg-icons/action/room';
import ActionSearch from 'material-ui/svg-icons/action/search';

const iconStyle = {color: 'grey', width: '30px', height: '30px', verticalAlign: 'top'}
export const NO_SELECTION_ICON = <AlertWarning style={iconStyle} className={"qa-AoiInfobar-icon-no-selection"}/>;
export const MULTIPOLYGON_ICON = <ImageCropSquare style={iconStyle} className={"qa-AoiInfobar-icon-multipolygon"}/>;
export const POLYGON_ICON = <ImageCropSquare style={iconStyle} className={"qa-AoiInfobar-icon-polygon"}/>;
export const POINT_ICON = <ActionRoom style={iconStyle} className={"qa-AoiInfobar-icon-point"}/>;
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
        const styles = {
            wrapper: {
                height: '70px',
                zIndex: 2,
                position: 'absolute',
                width: '100%',
                bottom: '40px'
            },
            infobar: {
                width: '70%',
                maxWidth: '550px',
                margin: '0 auto',
                height: '100%',
                backgroundColor: '#fff'
            },
            topbar: {
                height: '30px',
                width: '100%',
                padding: '5px 10px'
            },
            title: {
                fontSize: '12px',
            },
            detailbar: {
                height: '40px',
                padding: '0px 5px 10px'
            },
            button: {
                fontSize: '10px',
                background: 'none',
                border: 'none',
                float: 'right',
                padding: '0px',
                color: '#4498c0',
                outline: 'none'
            },
            searchIcon: {
                height: '20px',
                width: '20px',
                fill: '#4498c0',
                verticalAlign: 'middle'
            },
            detailText: {
                display: 'inline-block',
                fontSize: '12px'
            },
            name: {
                paddingLeft: '6px',
                width: '100%'
            },
            description: {
                paddingLeft: '6px',
                width: '100%',
                color: 'grey'
            }
        }
        return (
            <div>
                {this.state.showAoiInfobar ? 
                <div style={styles.wrapper}>  
                    <div style={styles.infobar}>
                        <div style={styles.topbar}>
                            <span className={"qa-AoiInfobar-title"} style={styles.title}>
                                <strong>Area Of Interest (AOI)</strong>
                            </span>
                            <button className={"qa-AoiInfobar-button-zoom"} style={styles.button} onClick={this.dispatchZoomToSelection}>
                                <ActionSearch style={styles.searchIcon} className={"qa-AoiInfobar-ActionSearch"}/> ZOOM TO SELECTION
                            </button>
                        </div>
                        <div style={styles.detailbar}>
                            {this.state.geometryIcon}
                            <div style={styles.detailText}>
                                <div className={"qa-AoiInfobar-name"} style={styles.name}>
                                    <strong>{this.state.aoiTitle}</strong>
                                </div>
                                <div className={"qa-AoiInfobar-description"} style={styles.description}>
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
