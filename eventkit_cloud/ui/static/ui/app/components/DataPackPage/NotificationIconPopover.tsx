import * as React from 'react';

import Popover from '@material-ui/core/Popover';
import WarningIcon from '@material-ui/icons/Warning';
import { useState } from 'react';
import {
    createStyles, IconButton, Theme, withStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import theme from '../../styles/eventkit_theme';

const jss = (theme: Eventkit.Theme & Theme) => createStyles({
    popoverBlock: {
        display: 'flex',
        height: '35px',
        color: 'primary',
        position: 'sticky',
        bottom: 0,
    },
    warningIconBtn: {
        color: theme.eventkit.colors.running,
        '&:hover': {
            backgroundColor: 'rgb(245, 245, 245)',
        },
    },
    title: {
        color: theme.eventkit.colors.primary,
        paddingLeft: '5px',
        paddingTop: '9px',
        fontWeight: 600,
    },
    iconBtn: {
        float: 'right',
        '&:hover': {
            backgroundColor: theme.eventkit.colors.white,
        },
    },
    alertIcon: {
        color: theme.eventkit.colors.warning,
        height: '18px',
        marginTop: '3px',
    },
    permissionNotificationText: {
        color: theme.eventkit.colors.primary,
        flex: '1 1 auto',
        paddingTop: '6px',
        cursor: 'pointer',
    },
    popoverText: {
        display: 'inline-flex',
        paddingTop: '5px',
    },
});

interface Props extends React.HTMLAttributes<HTMLElement> {
    view: 'groups' | 'members';
    classes: { [className: string]: string };
}

export function NotificationIconPopover(props: Props) {
    const [anchorElement, setAnchor] = useState(null);
    const { classes } = props;

    const handlePopoverOpen = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        setAnchor(e.currentTarget);
    };

    const handlePopoverClose = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        setAnchor(null);
    };

    const openEl = Boolean(anchorElement);
    return (
        <div className={classes.popoverBlock}>
            <IconButton
                className={classes.warningIconBtn}
                onClick={handlePopoverOpen}
            >
                <WarningIcon style={{ color: theme.eventkit.colors.running }} />
            </IconButton>
            <Popover
                PaperProps={{
                    style: { padding: '16px', width: '35%' },
                }}
                open={openEl}
                anchorEl={anchorElement}
                onClose={handlePopoverClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
            >
                <div>
                    <IconButton
                        className={classes.iconBtn}
                        type="button"
                        onClick={handlePopoverClose}
                    >
                        <CloseIcon />
                    </IconButton>
                    {props.view === 'groups'
                        ? (
                            <div style={{ display: 'inline-flex', paddingTop: '5px' }}>
                                Some of the users in this group may not have access to some of the resources you are trying
                                to share.
                            </div>
                        )
                        : (
                            <div className={classes.popoverText}>
                                This user may not have access to some of the resources you are trying to share.
                            </div>
                        )}
                </div>
            </Popover>
        </div>
    );
}

export default withStyles(jss)(NotificationIconPopover);
