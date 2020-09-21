import CustomTextField from "../../common/CustomTextField";
import {createStyles, Theme, withStyles} from "@material-ui/core/styles";
import * as React from "react";
import {TextField} from "@material-ui/core";


interface TextLabelProps {
    onChange: (...args: any) => void;
    option: Eventkit.JustificationOption;
    classes: { [className: string]: string };
}

function TextLabel(props: TextLabelProps) {
    const {option, classes} = props;
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
    },
    left: {
        margin: 'auto',
    },
    right: {
        flexGrow: 5,
        marginLeft: '25px',
    },
    textField: {
        backgroundColor: theme.eventkit.colors.white,
    },
});

export default withStyles(labelJss)(TextLabel)