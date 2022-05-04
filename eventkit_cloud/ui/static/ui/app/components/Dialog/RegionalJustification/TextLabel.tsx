import { Theme } from "@mui/material/styles";
import createStyles from '@mui/styles/createStyles';
import withStyles from '@mui/styles/withStyles';
import {TextField} from "@mui/material";


interface TextLabelProps {
    enabled: boolean;
    onChange: (...args: any) => void;
    option: Eventkit.JustificationOption;
    classes: { [className: string]: string };
}

function TextLabel(props: TextLabelProps) {
    const {enabled, option, onChange, classes} = props;
    return (
        <div>
            <strong>
                {/* eslint-disable-next-line react/no-danger */}
                <div dangerouslySetInnerHTML={{__html: option.name}}/>
            </strong>
            <div className={classes.entryRow}>
                <span className={classes.left}>{option.suboption.label}</span>
                <div className={classes.right}>
                    <TextField
                        id={`option${option.id}`}
                        autoComplete="off"
                        className={classes.textField}
                        InputProps={{className: classes.input}}
                        inputProps={{className: classes.innerInput}}
                        variant={"outlined" as "outlined"}
                        onChange={onChange}
                        disabled={!enabled}
                    />
                </div>
            </div>
        </div>
    )
}

const labelJss = (theme: Eventkit.Theme & Theme) => createStyles({
    input: {
        fontSize: '12px',
        padding: '0px',
        width: '200px',
    },
    innerInput: {
        padding: '5px'
    },
    entryRow: {
        display: 'flex',
        flexWrap: 'wrap',
        [theme.breakpoints.down('md')]: {
            display: 'block',
        },
    },
    left: {
        margin: 'auto',
    },
    right: {
        flexGrow: 5,
        marginLeft: '25px',
        [theme.breakpoints.down('md')]: {
            margin: '0px',
        },
    },
    textField: {
        backgroundColor: theme.eventkit.colors.white,
    },
});

export default withStyles(labelJss)(TextLabel)
