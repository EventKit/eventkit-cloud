import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { withTheme } from '@material-ui/core/styles';
import NavigationCheck from '@material-ui/icons/Check';
import Button from '@material-ui/core/Button';

export class SaveButton extends Component {
    render() {
        const { colors } = this.props.theme.eventkit;
        const styles = {
            button: {
                height: '35px',
                width: '200px',
                boxShadow: 'none',
                padding: '0px 5px',
            },
        };

        if (this.props.saved) {
            styles.button.backgroundColor = colors.success;
            styles.button.color = colors.white;
            return (
                <Button
                    className="qa-SaveButton-Button-Saved"
                    style={styles.button}
                    color="primary"
                    variant="contained"
                    disabled
                >
                    Saved
                    <NavigationCheck className="qa-SaveButton-NavigationCheck" style={{ fill: colors.white, verticalAlign: 'middle' }} />
                </Button>
            );
        }

        if (this.props.saveDisabled) {
            styles.button.backgroundColor = colors.grey;
            styles.button.color = colors.secondary_dark;
        }

        return (
            <Button
                className="qa-SaveButton-Button-SaveChanges"
                disabled={this.props.saveDisabled}
                style={styles.button}
                color="primary"
                variant="contained"
                onClick={this.props.handleSubmit}
            >
                Save Changes
            </Button>
        );
    }
}

SaveButton.defaultProps = {
    saved: false,
    saveDisabled: false,
};

SaveButton.propTypes = {
    saved: PropTypes.bool,
    saveDisabled: PropTypes.bool,
    handleSubmit: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired,
};

export default withTheme()(SaveButton);
