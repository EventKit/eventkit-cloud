import PropTypes from 'prop-types';
import React, { Component } from 'react';
import NavigationCheck from '@material-ui/icons/Check';
import Button from '@material-ui/core/Button';

export class SaveButton extends Component {
    render() {
        const styles = {
            button: {
                height: '35px',
                width: '200px',
                boxShadow: 'none',
                padding: '0px 5px',
            },
        };

        if (this.props.saved) {
            styles.button.backgroundColor = '#55BA63';
            styles.button.color = '#fff';
            return (
                <Button
                    className="qa-SaveButton-Button-Saved"
                    style={styles.button}
                    color="primary"
                    variant="contained"
                    disabled
                >
                    Saved
                    <NavigationCheck className="qa-SaveButton-NavigationCheck" style={{ fill: '#fff', verticalAlign: 'middle' }} />
                </Button>
            );
        }

        if (this.props.saveDisabled) {
            styles.button.backgroundColor = 'rgba(226,226,226, 0.5)';
            styles.button.color = '#e2e2e2';
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
};

export default SaveButton;
