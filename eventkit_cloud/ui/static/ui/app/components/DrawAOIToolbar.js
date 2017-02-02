import React, {Component} from 'react';
import {connect} from 'react-redux';
import styles from './DrawAOIToolbar.css';
import {toggleDrawSet} from '../actions/drawToolBarActions.js';
import {updateMode, updateBbox} from '../actions/exportsActions.js';
import DrawBoxButton from './DrawBoxButton';
import DrawFreeButton from './DrawFreeButton';
import MapViewButton from './MapViewButton';
import ImportButton from './ImportButton';
import SetAOIButton from './SetAOIButton.js';
import { Button } from 'react-bootstrap';


export const MODE_DRAW_BBOX = 'MODE_DRAW_BBOX'
export const MODE_NORMAL = 'MODE_NORMAL'


export class DrawAOIToolbar extends Component {

    constructor(props) {
        super(props);
        this.state = {
            extensionClass: styles.extensionToolbarDivHidden,
            icons: {
                mapView: 'INACTIVE_ICON',
            }
        };
    }

    componentWillReceiveProps(nextProps){
        console.log('');
    }

    render() {
        return (
            <div>
                <div className={styles.drawButtonsContainer}>
                    <div className={styles.drawButtonsTitle}><strong>TOOLS</strong></div>
                    <DrawBoxButton handleCancel={(sender) => this.props.handleCancel(sender)}/>
                    <DrawFreeButton handleCancel={(sender) => this.props.handleCancel(sender)}/>
                    <MapViewButton handleCancel={(sender) => this.props.handleCancel(sender)}
                                    setMapView={this.props.setMapView}/>
                    <ImportButton handleCancel={(sender) => this.props.handleCancel(sender)}/>
                </div>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        
    };
}

function mapDispatchToProps(dispatch) {
    return {

    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DrawAOIToolbar);



