import React, {Component, PropTypes} from 'react';
import ActionSettingsOverscan from 'material-ui/svg-icons/action/settings-overscan';
import ContentClear from 'material-ui/svg-icons/content/clear';

export class MapViewButton extends Component {

    constructor(props) {
        super(props);
        this.handleOnClick = this.handleOnClick.bind(this);
    }

    handleOnClick() {
        if(this.props.buttonState == 'SELECTED') {
            this.props.setAllButtonsDefault();
            this.props.handleCancel();
        }
        else if (this.props.buttonState == 'DEFAULT') {
            this.props.setMapViewButtonSelected();
            this.props.setMapView();
        }
    }

    render() {
        const state = this.props.buttonState;
        const styles = {
            buttonName: {
                fontSize: '.5em',
                width: '50px',
                height: '12px',
                color: '#4498c0',
                bottom: '0',
            },
            drawButtonGeneral: {
                height: '50px',
                width: '50px',
                borderTop: '1px solid #e6e6e6',
                borderRight: 'none',
                borderLeft: 'none',
                borderBottom: 'none',
                margin: 0,
                padding: 0,
                backgroundColor: '#fff',
                outline: 'none'
            }
        }

        const DEFAULT_ICON = <div>
                <ActionSettingsOverscan style={{fontSize: '1.3em', padding: '0px', fill: '#4498c0'}}/>
                <div style={styles.buttonName}>CURRENT VIEW</div>
            </div>
                    
        const INACTIVE_ICON = <div>
                <ActionSettingsOverscan style={{opacity: 0.4, fontSize: '1.3em', padding: '0px', fill: '#4498c0'}}/>
                <div style={{...styles.buttonName, opacity: 0.4}}>CURRENT VIEW</div>
            </div>

        const SELECTED_ICON =<div>
                <ContentClear style={{fontSize: '1.3em', padding: '0px', fill: '#4498c0'}}/>
                <div style={styles.buttonName}>CURRENT VIEW</div>
            </div>
        
        return (
            <button style={styles.drawButtonGeneral} onClick={this.handleOnClick}>
                {state == 'DEFAULT' ? DEFAULT_ICON : state == 'INACTIVE' ? INACTIVE_ICON : SELECTED_ICON}
            </button>
        )
    }
}

MapViewButton.propTypes = {
    buttonState: PropTypes.string,
    setMapView: PropTypes.func,
    setMapViewButtonSelected: PropTypes.func,
    setAllButtonsDefault: PropTypes.func,
    handleCancel: PropTypes.func
}

export default MapViewButton;

