
import PropTypes from 'prop-types';
import React, { Component } from 'react';
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
                outline: 'none',
            },
        };

        const DEFAULT_ICON = ((
            <div id="default_icon">
                <ImageCropSquare
                    className="qa-DrawBoxButton-ImageCropSquare-default"
                    style={{ fontSize: '1.3em', padding: '0px', fill: '#4498c0' }}
                />
                <div className="qa-DrawBoxButton-div-default" style={styles.buttonName}>BOX</div>
            </div>
        ));

        const INACTIVE_ICON = ((
            <div id="inactive_icon">
                <ImageCropSquare
                    className="qa-DrawBoxButton-ImageCropSquare-inactive"
                    style={{
                        opacity: 0.4, fontSize: '1.3em', padding: '0px', fill: '#4498c0',
                    }}
                />
                <div className="qa-DrawBoxButton-div-inactive" style={{ ...styles.buttonName, opacity: 0.4 }}>BOX</div>
            </div>
        ));

        const SELECTED_ICON = ((
            <div id="selected_icon">
                <ContentClear className="qa-DrawBoxButton-ContentClear" style={{ fontSize: '1.3em', padding: '0px', fill: '#4498c0' }} />
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
            <button className="qa-DrawBoxButton-button" style={styles.drawButtonGeneral} onClick={this.handleOnClick}>
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
};

export default DrawBoxButton;

