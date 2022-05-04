import { Component } from 'react';
import { Theme } from '@mui/material/styles';
import withTheme from '@mui/styles/withTheme';
import NavigationCheck from '@mui/icons-material/Check';
import Button from '@mui/material/Button';

interface Props {
    saved: boolean;
    saveDisabled: boolean;
    handleSubmit: () => void;
    theme: Eventkit.Theme & Theme;
}

export class SaveButton extends Component<Props, {}> {
    render() {
        const { colors } = this.props.theme.eventkit;
        const styles = {
            button: {
                height: '35px',
                width: '200px',
                boxShadow: 'none',
                padding: '0px 5px',
                color: undefined,
                backgroundColor: undefined,
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

export default withTheme(SaveButton);
