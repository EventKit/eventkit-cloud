import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import FileFileUpload from '@material-ui/icons/CloudUpload';
import ContentClear from '@material-ui/icons/Clear';

export class ImportButton extends Component {
    constructor(props) {
        super(props);
        this.handleOnClick = this.handleOnClick.bind(this);
    }

    handleOnClick() {
        if (this.props.buttonState === 'SELECTED') {
            this.props.setAllButtonsDefault();
            this.props.setImportModalState(false);
            this.props.handleCancel();
        } else if (this.props.buttonState === 'DEFAULT') {
            this.props.setImportButtonSelected();
            this.props.setImportModalState(true);
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
                <FileFileUpload
                    className="qa-ImportButton-FileFileUpload-default"
                    color="primary"
                />
                <div className="qa-ImportButton-div-default" style={styles.buttonName}>IMPORT</div>
            </div>
        ));

        const INACTIVE_ICON = ((
            <div id="inactive_icon">
                <FileFileUpload
                    className="qa-ImportButton-FileFileUpload-inactive"
                    style={{ opacity: 0.4 }}
                    color="primary"
                />
                <div className="qa-ImportButton-div-inactive" style={{ ...styles.buttonName, opacity: 0.4 }}>IMPORT</div>
            </div>
        ));

        const SELECTED_ICON = ((
            <div id="selected_icon">
                <ContentClear
                    className="qa-ImportButton-ContentClear"
                    color="primary"
                />
                <div className="qa-ImportButton-div-selected" style={styles.buttonName}>IMPORT</div>
            </div>
        ));

        let icon = SELECTED_ICON;
        if (state === 'DEFAULT') {
            icon = DEFAULT_ICON;
        } else if (state === 'INACTIVE') {
            icon = INACTIVE_ICON;
        }

        return (
            <button type="button" className="qa-ImportButton-button" style={styles.drawButtonGeneral} onClick={this.handleOnClick}>
                {icon}
            </button>
        );
    }
}

ImportButton.propTypes = {
    buttonState: PropTypes.string.isRequired,
    handleCancel: PropTypes.func.isRequired,
    setAllButtonsDefault: PropTypes.func.isRequired,
    setImportButtonSelected: PropTypes.func.isRequired,
    setImportModalState: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withTheme()(ImportButton);
