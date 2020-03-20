import * as React from "react";
import {createStyles, Switch, Theme, withStyles, withTheme} from "@material-ui/core";

interface Props {
    onSwitch: () => void;
    isSwitchOn: boolean;
    classes: { [className: string]: string; }
}

function SwitchControl(props: Props) {
    const { classes, onSwitch, isSwitchOn } = props;

    return (
        <span className={classes.switch}>
            <span style={{ fontSize: '16px' }}>
                Footprints
            </span>
            <Switch
                value="switch"
                checked={isSwitchOn}
                onChange={onSwitch}
                classes={{ switchBase: classes.switchBase, checked: classes.checked }}
            />
        </span>
    );
}

const jss = (theme: Theme & Eventkit.Theme) => createStyles({
    switch: {
        float: 'right',
        marginTop: '-12px',
        marginRight: '-14px'
    },
    switchBase: {
        color: theme.eventkit.colors.white,
        '&$checked': {
            color: theme.eventkit.colors.primary,
        },
    },
    checked: {},
});

export default withTheme()(withStyles<any, any>(jss)(SwitchControl));
