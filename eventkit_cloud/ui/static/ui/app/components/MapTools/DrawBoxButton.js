import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import ImageCropSquare from '@material-ui/icons/CropSquare';
import ContentClear from '@material-ui/icons/Clear';

export class DrawBoxButton extends Component {
    constructor(props) {
        super(props);
        this.handleOnClick = this.handleOnClick.bind(this);
    }

    handleOnClick() {
        if (this.props.buttonState === 'SELECTED') {
            this.props.setAllButtonsDefault();
            this.props.handleCancel();
        } else if (this.props.buttonState === 'DEFAULT') {
            this.props.setBoxButtonSelected();
            this.props.updateMode('MODE_DRAW_BBOX');
        }
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const state = this.props.buttonState;
        const styles = {
            buttonName: {
                fontSize: '8px',
                width: '55px',
                height: '12px',
                color: colors.primary,
                bottom: '0',
            },
            drawButtonGeneral: {
                height: '50px',
                width: '55px',
                borderTop: '1px solid #e6e6e6',
                borderRight: 'none',
                borderLeft: 'none',
                borderBottom: 'none',
                margin: 0,
                padding: 0,
                backgroundColor: colors.white,
                outline: 'none',
            },
        };

        const DEFAULT_ICON = ((
            <div id="default_icon">
                <ImageCropSquare
                    className="qa-DrawBoxButton-ImageCropSquare-default"
                    color="primary"
                />
                <div className="qa-DrawBoxButton-div-default" style={styles.buttonName}>BOX</div>
            </div>
        ));

        const INACTIVE_ICON = ((
            <div id="inactive_icon">
                <ImageCropSquare
                    className="qa-DrawBoxButton-ImageCropSquare-inactive"
                    style={{ opacity: 0.4 }}
                    color="primary"
                />
                <div className="qa-DrawBoxButton-div-inactive" style={{ ...styles.buttonName, opacity: 0.4 }}>BOX</div>
            </div>
        ));

        const SELECTED_ICON = ((
            <div id="selected_icon">
                <ContentClear
                    className="qa-DrawBoxButton-ContentClear"
                    color="primary"
                />
                <div className="qa-DrawBoxButton-div-selected" style={styles.buttonName}>BOX</div>
            </div>
        ));

        let icon = SELECTED_ICON;
        if (state === 'DEFAULT') {
            icon = DEFAULT_ICON;
        } else if (state === 'INACTIVE') {
            icon = INACTIVE_ICON;
        }

        return (
            <button type="button" className="qa-DrawBoxButton-button" style={styles.drawButtonGeneral} onClick={this.handleOnClick}>
                {icon}
            </button>
        );
    }
}

DrawBoxButton.propTypes = {
    buttonState: PropTypes.string.isRequired,
    updateMode: PropTypes.func.isRequired,
    setBoxButtonSelected: PropTypes.func.isRequired,
    setAllButtonsDefault: PropTypes.func.isRequired,
    handleCancel: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withTheme(DrawBoxButton);
