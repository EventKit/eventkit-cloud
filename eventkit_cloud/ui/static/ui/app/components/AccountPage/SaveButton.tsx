import { withTheme, Theme } from '@material-ui/core/styles';
import NavigationCheck from '@material-ui/icons/Check';
import Button from '@material-ui/core/Button';

interface Props {
    saved: boolean;
    saveDisabled: boolean;
    handleSubmit: () => void;
    theme: Eventkit.Theme & Theme;
}

export const SaveButton = (props: Props) => {
    const { colors } = props.theme.eventkit;
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

    if (props.saved) {
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

    if (props.saveDisabled) {
        styles.button.backgroundColor = colors.grey;
        styles.button.color = colors.secondary_dark;
    }

    return (
        <Button
            className="qa-SaveButton-Button-SaveChanges"
            disabled={props.saveDisabled}
            style={styles.button}
            color="primary"
            variant="contained"
            onClick={props.handleSubmit}
        >
            Save Changes
        </Button>
    );
};

export default withTheme(SaveButton);
