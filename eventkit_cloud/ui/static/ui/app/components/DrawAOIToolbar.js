import React, {Component} from 'react';
import styles from './DrawAOIToolbar.css';
import DrawBoxButton from './DrawBoxButton';
import DrawFreeButton from './DrawFreeButton';
import MapViewButton from './MapViewButton';
import ImportButton from './ImportButton';

export class DrawAOIToolbar extends Component {

    constructor(props) {
        super(props);
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

export default DrawAOIToolbar;



