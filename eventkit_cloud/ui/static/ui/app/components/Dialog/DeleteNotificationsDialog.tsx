import { Component } from 'react';
import { Theme } from '@mui/material/styles';
import withTheme from '@mui/styles/withTheme';
import createStyles from '@mui/styles/createStyles';
import withStyles from '@mui/styles/withStyles';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import BaseDialog from './BaseDialog';

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    form: {
        width: '100%',
        padding: '20px 20px 0px',
    },
    radio: {
        padding: '12px',
    },
    radioLabel: {
        fontSize: '14px',
        color: 'inherit',
    },
    delete: {
        color: theme.eventkit.colors.warning,
    },
});

interface Props {
    show: boolean;
    deleteAll: 'false' | 'true';
    onCancel: () => void;
    onDelete: () => void;
    onSelectionChange: (e: any) => void;
    theme: Theme & Eventkit.Theme;
    classes: {
        form: string;
        radio: string;
        radioLabel: string;
        delete: string;
    };
}

export class DeleteNotificationsDialog extends Component<Props, {}> {
    render() {
        const { classes } = this.props;

        const actions = [
            <Button
                key="confirm"
                className={`qa-DeleteDialog-Button-confirm ${classes.delete}`}
                color="secondary"
                onClick={this.props.onDelete}
                variant="contained"
            >
                DELETE
            </Button>,
            <Button
                key="cancel"
                className="qa-DeleteDialog-Button-cancel"
                color="secondary"
                onClick={this.props.onCancel}
                variant="contained"
            >
                CANCEL
            </Button>,
        ];

        return (
            <BaseDialog
                show={this.props.show}
                title="DELETE ALL?"
                actions={actions}
                onClose={this.props.onCancel}
            >
                You have selected to delete all notifications on this page,
                would you like to delete ALL notifications in the system as well?
                <FormControl className={classes.form}>
                    <RadioGroup
                        value={this.props.deleteAll}
                        onChange={this.props.onSelectionChange}
                    >
                        <FormControlLabel
                            value="false"
                            control={<Radio color="primary" className={classes.radio} />}
                            label="No, just delete the notifications that I have selected."
                            classes={{ label: classes.radioLabel }}
                        />
                        <FormControlLabel
                            value="true"
                            control={<Radio color="primary" className={classes.radio} />}
                            label="Yes, delete ALL my notifications."
                            classes={{ label: classes.radioLabel }}
                        />
                    </RadioGroup>
                </FormControl>
            </BaseDialog>
        );
    }
}

export default withTheme(withStyles(jss)(DeleteNotificationsDialog));
