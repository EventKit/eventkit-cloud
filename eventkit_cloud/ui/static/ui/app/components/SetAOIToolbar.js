import 'openlayers/dist/ol.css'
import React, {Component} from 'react'
import ol from 'openlayers'
import styles from './SetAOIToolbar.css'
import DrawControl from './openlayers.DrawControl.js'
import {Toolbar, ToolbarGroup, ToolbarSeparator,ToolbarTitle} from 'material-ui/Toolbar'
import FlatButton from 'material-ui/FlatButton'

export default class SetAOIToolbar extends Component {

    constructor(props) {
        super(props)
    }


    render() {

        const toolbarStyles = {
            toolbar: {
                backgroundColor: '#fff',

            },
        }

        return (
            <div className={styles.toolbarDiv}>
                <Toolbar style={toolbarStyles.toolbar}>
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
                </Toolbar>
            </div>
        )
    }
}
