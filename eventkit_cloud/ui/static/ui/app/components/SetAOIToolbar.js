import 'openlayers/dist/ol.css'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import ol from 'openlayers'
import styles from './SetAOIToolbar.css'
import DrawControl from './openlayers.DrawControl.js'
import {Toolbar, ToolbarGroup, ToolbarSeparator,ToolbarTitle} from 'material-ui/Toolbar'
import {toggleZoomToSelection, clickZoomToSelection} from '../actions/setAoiToolbarActions.js'

const {Grid, Row, Col} = require('react-flexbox-grid');

export class SetAOIToolbar extends Component {

    constructor(props) {
        super(props)
    }

    handleZoomToSelection() {
        console.log('zooming to selection');
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.bbox != this.props.bbox) {
            if (bbox != [] || bbox != null) {

            }
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
                        None selected
                    </div>
                    <div className={styles.resetMapDiv}>
                        <button className={styles.simpleButton}><i className={'fa fa-refresh'}></i>  RESET MAP</button>
                    </div>
                    <div className={styles.zoomToDiv}>
                        <button className={styles.simpleButton}><i className={'fa fa-search-plus'}></i>  ZOOM TO SELECTION</button>
                    </div>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        bbox: state.bbox,
        zoomToSelection: state.zoomToSelection
    }
}

function mapDispatchToProps(dispatch) {
    return {
        toggleZoomToSelction: (currentState) => {
            dispatch(toggleZoomToSelection(currentState));
        },
        clickZoomToSelection: () => {
            dispatch(clickZoomToSelection());
        }
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SetAOIToolbar)
