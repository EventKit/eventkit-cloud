import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ContentCreate from '@material-ui/icons/Create';
import ContentClear from '@material-ui/icons/Clear';

export class DrawFreeButton extends Component {
    constructor(props) {
        super(props);
        this.handleOnClick = this.handleOnClick.bind(this);
    }

    handleOnClick() {
        if (this.props.buttonState === 'SELECTED') {
            this.props.setAllButtonsDefault();
            this.props.handleCancel();
        } else if (this.props.buttonState === 'DEFAULT') {
            this.props.setFreeButtonSelected();
            this.props.updateMode('MODE_DRAW_FREE');
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
                <ContentCreate
                    className="qa-DrawFreeButton-ContentCreate-default"
                    style={{ fontSize: '1.3em', padding: '0px', fill: '#4498c0' }}
                />
                <div className="qa-DrawFreeButton-div-default" style={styles.buttonName}>DRAW</div>
            </div>
        ));

        const INACTIVE_ICON = ((
            <div id="inactive_icon">
                <ContentCreate
                    className="qa-DrawFreeButton-ContentCreate-inactive"
                    style={{
                        opacity: 0.4, fontSize: '1.3em', padding: '0px', fill: '#4498c0',
                    }}
                />
                <div className="qa-DrawFreeButton-div-inactive" style={{ ...styles.buttonName, opacity: 0.4 }}>DRAW</div>
            </div>
        ));

        const SELECTED_ICON = ((
            <div id="selected_icon">
                <ContentClear
                    className="qa-DrawFreeButton-ContentCreate-selected"
                    style={{ fontSize: '1.3em', padding: '0px', fill: '#4498c0' }}
                />
                <div className="qa-DrawFreeButton-div-selected" style={styles.buttonName}>DRAW</div>
            </div>
        ));

        let icon = SELECTED_ICON;
        if (state === 'DEFAULT') {
            icon = DEFAULT_ICON;
        } else if (state === 'INACTIVE') {
            icon = INACTIVE_ICON;
        }

        return (
            <button className="qa-DrawFreeButton-button" style={styles.drawButtonGeneral} onClick={this.handleOnClick}>
                {icon}
            </button>
        );
    }
}

DrawFreeButton.propTypes = {
    buttonState: PropTypes.string.isRequired,
    updateMode: PropTypes.func.isRequired,
    setFreeButtonSelected: PropTypes.func.isRequired,
    setAllButtonsDefault: PropTypes.func.isRequired,
    handleCancel: PropTypes.func.isRequired,
};

export default DrawFreeButton;

