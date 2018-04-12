import React, { Component, PropTypes } from 'react';
import NavigationCheck from 'material-ui/svg-icons/navigation/check';
import RaisedButton from 'material-ui/RaisedButton';

export class SaveButton extends Component {
    render() {
        const styles = {
            button: {
                height: '35px',
                width: '200px',
                boxShadow: 'none',
                backgroundColor: 'none',
            },
            label: {
                lineHeight: '35px',
                padding: '0px 5px',
            },
        };

        if (this.props.saved) {
            return (
                <RaisedButton
                    className="qa-SaveButton-RaisedButton-Saved"
                    style={styles.button}
                    disabled
                    label="Saved"
                    disabledLabelColor="#fff"
                    labelStyle={styles.label}
                    disabledBackgroundColor="#55BA63"
                >
                    <NavigationCheck className="qa-SaveButton-NavigationCheck" style={{ fill: '#fff', verticalAlign: 'middle' }} />
                </RaisedButton>
            );
        }

        return (
            <RaisedButton
                className="qa-SaveButton-RaisedButton-SaveChanges"
                disabled={this.props.saveDisabled}
                disabledLabelColor="#e2e2e2"
                disabledBackgroundColor="rgba(226,226,226, 0.5)"
                style={styles.button}
                label="Save Changes"
                labelColor="#fff"
                labelStyle={styles.label}
                backgroundColor="#4498c0"
                onClick={this.props.handleSubmit}
            />
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
