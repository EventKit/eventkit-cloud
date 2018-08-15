import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ActionSettingsOverscan from '@material-ui/icons/SettingsOverscan';
import ContentClear from '@material-ui/icons/Clear';

export class MapViewButton extends Component {
    constructor(props) {
        super(props);
        this.handleOnClick = this.handleOnClick.bind(this);
    }

    handleOnClick() {
        if (this.props.buttonState === 'SELECTED') {
            this.props.setAllButtonsDefault();
            this.props.handleCancel();
        } else if (this.props.buttonState === 'DEFAULT') {
            this.props.setMapViewButtonSelected();
            this.props.setMapView();
        }
    }

    render() {
        const state = this.props.buttonState;
        const styles = {
            buttonName: {
                fontSize: '.5em',
                width: '100%',
                height: '12px',
                color: '#4498c0',
                position: 'relative',
                bottom: '5px',
                padding: '0 4px',
                lineHeight: '1.3em',
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
                outline: 'none',
            },
        };

        const DEFAULT_ICON = ((
            <div id="default_icon">
                <ActionSettingsOverscan
                    className="qa-MapViewButton-ActionSettingsOverscan-default"
                    style={{ fontSize: '1.3em', padding: '0px', fill: '#4498c0' }}
                />
                <div className="qa-MapViewButton-div-default" style={styles.buttonName}>CURRENT VIEW</div>
            </div>
        ));

        const INACTIVE_ICON = ((
            <div id="inactive_icon">
                <ActionSettingsOverscan
                    className="qa-MapViewButton-ActionSettingsOverscan-inactive"
                    style={{
                        opacity: 0.4, fontSize: '1.3em', padding: '0px', fill: '#4498c0',
                    }}
                />
                <div className="qa-MapViewButton-div-inactive" style={{ ...styles.buttonName, opacity: 0.4 }}>CURRENT VIEW</div>
            </div>
        ));

        const SELECTED_ICON = ((
            <div id="selected_icon">
                <ContentClear
                    className="qa-MapViewButton-ContentClear"
                    style={{ fontSize: '1.3em', padding: '0px', fill: '#4498c0' }}
                />
                <div className="qa-MapViewButton-div-selected" style={styles.buttonName}>CURRENT VIEW</div>
            </div>
        ));

        let icon = SELECTED_ICON;
        if (state === 'DEFAULT') {
            icon = DEFAULT_ICON;
        } else if (state === 'INACTIVE') {
            icon = INACTIVE_ICON;
        }

        return (
            <button className="qa-MapViewButton-button" style={styles.drawButtonGeneral} onClick={this.handleOnClick}>
                {icon}
            </button>
        );
    }
}

MapViewButton.propTypes = {
    buttonState: PropTypes.string.isRequired,
    setMapView: PropTypes.func.isRequired,
    setMapViewButtonSelected: PropTypes.func.isRequired,
    setAllButtonsDefault: PropTypes.func.isRequired,
    handleCancel: PropTypes.func.isRequired,
};

export default MapViewButton;

