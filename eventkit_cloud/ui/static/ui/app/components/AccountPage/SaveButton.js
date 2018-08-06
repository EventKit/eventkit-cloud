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
                color: '#fff',
                backgroundColor: '#4498c0',
                fontSize: '14px',
                padding: '0px 5px',
            },
        };

        if (this.props.saved) {
            styles.button.backgroundColor = '#55BA63';
            return (
                <Button
                    className="qa-SaveButton-RaisedButton-Saved"
                    style={styles.button}
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
                className="qa-SaveButton-RaisedButton-SaveChanges"
                disabled={this.props.saveDisabled}
                style={styles.button}
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
