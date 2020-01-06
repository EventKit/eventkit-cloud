import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
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
        const { colors } = this.props.theme.eventkit;

        const state = this.props.buttonState;
        const styles = {
            buttonName: {
                bottom: '0',
                color: colors.primary,
                fontSize: '8px',
                height: '12px',
                width: '50px',
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
                <ContentCreate
                    className="qa-DrawFreeButton-ContentCreate-default"
                    color="primary"
                />
                <div className="qa-DrawFreeButton-div-default" style={styles.buttonName}>DRAW</div>
            </div>
        ));

        const INACTIVE_ICON = ((
            <div id="inactive_icon">
                <ContentCreate
                    className="qa-DrawFreeButton-ContentCreate-inactive"
                    color="primary"
                    style={{ opacity: 0.4 }}
                />
                <div className="qa-DrawFreeButton-div-inactive" style={{ ...styles.buttonName, opacity: 0.4 }}>DRAW</div>
            </div>
        ));

        const SELECTED_ICON = ((
            <div id="selected_icon">
                <ContentClear
                    className="qa-DrawFreeButton-ContentCreate-selected"
                    color="primary"
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
            <button type="button" className="qa-DrawFreeButton-button" style={styles.drawButtonGeneral} onClick={this.handleOnClick}>
                {icon}
            </button>
        );
    }
}

DrawFreeButton.propTypes = {
    buttonState: PropTypes.string.isRequired,
    handleCancel: PropTypes.func.isRequired,
    setAllButtonsDefault: PropTypes.func.isRequired,
    setFreeButtonSelected: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired,
    updateMode: PropTypes.func.isRequired,
};

export default withTheme()(DrawFreeButton);
