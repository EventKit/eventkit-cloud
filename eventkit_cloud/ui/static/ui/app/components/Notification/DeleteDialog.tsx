import * as React from 'react';
import { withTheme, createStyles, withStyles, Theme } from '@material-ui/core/styles';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import BaseDialog from '../Dialog/BaseDialog';

const jss = (theme: Theme) => createStyles({
    form: {
        width: '100%',
        padding: '20px 20px 0px',
    },
    radioLabel: {
        fontSize: '12px',
    },
});

interface Props {
    show: boolean;
    deleteAll: 'false' | 'true';
    onClose: () => void;
    onSelectionChange: (e: any) => void;
    theme: Theme & Eventkit.Theme;
    classes: {
        form: string;
        radioLabel: string;
    };
}

export class DeleteDialog extends React.Component<Props, {}> {
    render() {
        const { classes } = this.props;

        return (
            <BaseDialog
                show={this.props.show}
                title="DELETE ALL?"
                onClose={this.props.onClose}
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
                            control={<Radio color="primary" />}
                            label="No, just delete the visible notifications that I have selected."
                            classes={{ label: classes.radioLabel }}
                        />
                        <FormControlLabel
                            value="true"
                            control={<Radio color="primary" />}
                            label="Yes, delete all my notifications in the system."
                            classes={{ label: classes.radioLabel }}
                        />
                    </RadioGroup>
                </FormControl>
            </BaseDialog>
        );
    }
}

export default withTheme()(withStyles(jss)(DeleteDialog));
