import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Divider from '@material-ui/core/Divider';
import CssBaseline from '@material-ui/core/CssBaseline';
import CloseIcon from '@material-ui/icons/Close';
import ButtonBase from '@material-ui/core/ButtonBase';
import { createStyles, Theme, withStyles } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    paper: {
        zIndex: 6,
        padding: '11px',
        backgroundColor: '#FAFFB5',
        flexGrow: 1,
        position: 'relative',
        display: 'flex'
    },
    nonExpandedText: {
        fontSize: '13px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        flexGrow: 1,
    },
    expandedText: {
        fontSize: '13px',
        flexGrow: 2,
    },
    expand: {
        display: 'flex',
        flex: '0 0 auto',
        flexGrow: 1,
    },
});

export interface Props {
    handleClosedPermissionsBanner: () => void;
    isOpen: boolean;
    classes: { [className: string]: string };
}

function PermissionsBanner(props: Props) {
    const { classes } = props;
    const [isOpen, setOpen] = useState(false);

    const handleExpand = () => {
        setOpen(true);
    };

    const handleCloseExpand = () => {
        setOpen(false);
    };

    return (
        <>
            <CssBaseline />
            <Paper elevation={0} className={classes.paper} square={false}>
                <Grid container spacing={32} justify="space-between">
                    {!isOpen
                        ? (
                            <>
                                <Grid item xs={10}>
                                    <div className={classes.nonExpandedText}>
                                    If you believe this is an error, Lorem ipsum dolor sit amet, consectetur
                                    adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
                                    aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                                    aliquip ex ea commodo consequat.
                                    </div>
                                </Grid>
                                <Grid item>
                                    <ButtonBase
                                        className="qa-NotificationsTableItem-ActionButtons-Expand"
                                        onClick={handleExpand}
                                    >
                                        <ExpandMoreIcon />
                                    </ButtonBase>
                                    <ButtonBase
                                        className="qa-NotificationsTableItem-ActionButtons-Remove"
                                        onClick={props.handleClosedPermissionsBanner}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </ButtonBase>
                                </Grid>
                            </>
                        )
                        : (
                            <>
                                <Grid item xs={10}>
                                    <div className={classes.expandedText}>
                                    If you believe this is an error, Lorem ipsum dolor sit amet, consectetur
                                    adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
                                    aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                                    aliquip ex ea commodo consequat.
                                    </div>
                                </Grid>
                                <Grid item>
                                    <ButtonBase
                                        className="qa-NotificationsTableItem-ActionButtons-Expand"
                                        onClick={handleCloseExpand}
                                    >
                                        <ExpandLessIcon />
                                    </ButtonBase>
                                    <ButtonBase
                                        className="qa-NotificationsTableItem-ActionButtons-Remove"
                                        onClick={props.handleClosedPermissionsBanner}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </ButtonBase>
                                </Grid>
                            </>
                        )
                    }
                </Grid>
            </Paper>
            <Divider />
        </>
    );
}

export default withStyles(jss)(PermissionsBanner);
