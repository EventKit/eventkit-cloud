import PropTypes from 'prop-types';
import React, { Component } from 'react';
import FileFileUpload from 'material-ui/svg-icons/file/file-upload';
import ContentClear from 'material-ui/svg-icons/content/clear';

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
                <FileFileUpload
                    className="qa-ImportButton-FileFileUpload-default"
                    style={{ fontSize: '1.3em', padding: '0px', fill: '#4498c0' }}
                />
                <div className="qa-ImportButton-div-default" style={styles.buttonName}>IMPORT</div>
            </div>
        ));

        const INACTIVE_ICON = ((
            <div id="inactive_icon">
                <FileFileUpload
                    className="qa-ImportButton-FileFileUpload-inactive"
                    style={{
                        opacity: 0.4, fontSize: '1.3em', padding: '0px', fill: '#4498c0',
                    }}
                />
                <div className="qa-ImportButton-div-inactive" style={{ ...styles.buttonName, opacity: 0.4 }}>IMPORT</div>
            </div>
        ));

        const SELECTED_ICON = ((
            <div id="selected_icon">
                <ContentClear
                    className="qa-ImportButton-ContentClear"
                    style={{ fontSize: '1.3em', padding: '0px', fill: '#4498c0' }}
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
            <button className="qa-ImportButton-button" style={styles.drawButtonGeneral} onClick={this.handleOnClick}>
                {icon}
            </button>
        );
    }
}

ImportButton.propTypes = {
    buttonState: PropTypes.string.isRequired,
    setImportButtonSelected: PropTypes.func.isRequired,
    setAllButtonsDefault: PropTypes.func.isRequired,
    setImportModalState: PropTypes.func.isRequired,
    handleCancel: PropTypes.func.isRequired,
};

export default ImportButton;
