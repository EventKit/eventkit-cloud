import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
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
        const { colors } = this.props.theme.eventkit;

        const state = this.props.buttonState;
        const styles = {
            buttonName: {
                bottom: '5px',
                color: colors.primary,
                fontSize: '8px',
                height: '12px',
                lineHeight: '8px',
                padding: '0 4px',
                position: 'relative',
                width: '100%',
            },
            drawButtonGeneral: {
                backgroundColor: colors.white,
                borderBottom: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: '1px solid #e6e6e6',
                height: '50px',
                margin: 0,
                outline: 'none',
                padding: 0,
                width: '50px',
            },
        };

        const DEFAULT_ICON = ((
            <div id="default_icon">
                <ActionSettingsOverscan
                    className="qa-MapViewButton-ActionSettingsOverscan-default"
                    color="primary"
                />
                <div className="qa-MapViewButton-div-default" style={styles.buttonName}>CURRENT VIEW</div>
            </div>
        ));

        const INACTIVE_ICON = ((
            <div id="inactive_icon">
                <ActionSettingsOverscan
                    className="qa-MapViewButton-ActionSettingsOverscan-inactive"
                    style={{ opacity: 0.4 }}
                    color="primary"
                />
                <div className="qa-MapViewButton-div-inactive" style={{ ...styles.buttonName, opacity: 0.4 }}>CURRENT VIEW</div>
            </div>
        ));

        const SELECTED_ICON = ((
            <div id="selected_icon">
                <ContentClear
                    className="qa-MapViewButton-ContentClear"
                    color="primary"
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
            <button type="button" className="qa-MapViewButton-button" style={styles.drawButtonGeneral} onClick={this.handleOnClick}>
                {icon}
            </button>
        );
    }
}

MapViewButton.propTypes = {
    buttonState: PropTypes.string.isRequired,
    handleCancel: PropTypes.func.isRequired,
    setAllButtonsDefault: PropTypes.func.isRequired,
    setMapView: PropTypes.func.isRequired,
    setMapViewButtonSelected: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withTheme()(MapViewButton);
