import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import ActionSearch from '@material-ui/icons/Search';
import ContentClear from '@material-ui/icons/Clear';

export class SearchAOIButton extends Component {
    constructor(props) {
        super(props);
        this.handleOnClick = this.handleOnClick.bind(this);
    }

    handleOnClick() {
        if (this.props.buttonState === 'SELECTED') {
            this.props.handleCancel();
            this.props.setAllButtonsDefault();
        }
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const state = this.props.buttonState;
        const styles = {
            buttonName: {
                color: colors.primary,
                bottom: '0px',
                fontSize: '8px',
                width: '50px',
                height: '12px',
            },
            buttonGeneral: {
                height: '50px',
                width: '50px',
                borderLeft: '1px solid #e6e6e6',
                borderBottom: 'none',
                borderTop: 'none',
                borderRight: 'none',
                margin: '0px',
                padding: '0px',
                backgroundColor: colors.white,
                outline: 'none',
            },

        };
        const DEFAULT_ICON = ((
            <div id="default_icon">
                <ActionSearch
                    className="qa-SearchAOIButton-ActionSearch-default"
                    color="primary"
                />
                <div className="qa-SearchAOIButton-div-default" style={styles.buttonName}>SEARCH</div>
            </div>
        ));

        const INACTIVE_ICON = ((
            <div id="inactive_icon">
                <ActionSearch
                    className="qa-SearchAOIButton-ActionSearch-inactive"
                    style={{ opacity: 0.4 }}
                    color="primary"
                />
                <div className="qa-SearchAOIButton-div-default"style={{ ...styles.buttonName, opacity: 0.4 }}>SEARCH</div>
            </div>
        ));

        const SELECTED_ICON = ((
            <div id="selected_icon">
                <ContentClear
                    className="qa-SearchAOIButton-ContentClear"
                    color="primary"
                />
                <div className="qa-SearchAOIButton-div" style={styles.buttonName}>SEARCH</div>
            </div>
        ));

        let icon = SELECTED_ICON;
        if (state === 'DEFAULT') {
            icon = DEFAULT_ICON;
        } else if (state === 'INACTIVE') {
            icon = INACTIVE_ICON;
        }

        return (
            <button className="qa-SearchAOIButton-button"style={styles.buttonGeneral} onClick={this.handleOnClick}>
                {icon}
            </button>
        );
    }
}

SearchAOIButton.propTypes = {
    buttonState: PropTypes.string.isRequired,
    handleCancel: PropTypes.func.isRequired,
    setAllButtonsDefault: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withTheme()(SearchAOIButton);

