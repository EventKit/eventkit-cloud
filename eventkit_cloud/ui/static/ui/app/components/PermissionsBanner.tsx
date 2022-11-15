import { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Divider from '@material-ui/core/Divider';
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
        borderRadius: 0,
        flexGrow: 1,
        position: 'relative',
        display: 'flex',
        textAlign: 'center',
        paddingLeft: '15%',
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
        textAlign: 'center',
    },
    expand: {
        display: 'flex',
        flex: '0 0 auto',
        flexGrow: 1,
    },
});

export interface Props {
    handleClosedPermissionsBanner: () => void;
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
            <Paper elevation={0} className={classes.paper}>
                <Grid container spacing={8} justifyContent="space-between">
                    <Grid item xs={10}>
                        <div className={(!isOpen) ? classes.nonExpandedText : classes.expandedText}>
                            Some sources may have been limited based on your permissions. If you believe this is an
                            error, please contact an administrator.
                        </div>
                    </Grid>
                    <Grid item>
                        <ButtonBase
                            className="qa-NotificationsTableItem-ActionButtons-Expand"
                            onClick={(!isOpen) ? handleExpand : handleCloseExpand}
                        >
                            {!isOpen && (<ExpandMoreIcon />)}
                            {isOpen && (<ExpandLessIcon />)}
                        </ButtonBase>
                        <ButtonBase
                            className="qa-NotificationsTableItem-ActionButtons-Remove"
                            onClick={props.handleClosedPermissionsBanner}
                        >
                            <CloseIcon fontSize="small" />
                        </ButtonBase>
                    </Grid>
                </Grid>
            </Paper>
            <Divider />
        </>
    );
}

export default withStyles(jss)(PermissionsBanner);
