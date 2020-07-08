import * as React from 'react';

import Popover from '@material-ui/core/Popover';
import WarningIcon from '@material-ui/icons/Warning';
import Typography from '@material-ui/core/Typography';
import { useCallback, useState } from 'react';
import {
    createStyles, IconButton, Link, Theme, withStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import AlertError from '@material-ui/icons/Error';
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
});

interface Props extends React.HTMLAttributes<HTMLElement> {
    someProvidersAvailable: boolean;
    classes: { [className: string]: string };
}

export function NotificationPopover(props: Props) {
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

    const getIcon = useCallback(() => {
        if (props.someProvidersAvailable) {
            return (
                <WarningIcon
                    className="qa-PermissionNotification-AlertError"
                    style={{ color: theme.eventkit.colors.running }}
                />
            );
        }
        return (
            <AlertError
                className="qa-PermissionNotification-AlertWarning"
                style={{ color: theme.eventkit.colors.warning, opacity: 0.6 }}
            />
        );
    }, [props.someProvidersAvailable]);

    const getMessage = useCallback(() => {
        if (props.someProvidersAvailable) {
            return 'Some source are unavailable due to user permissions.';
        }
        return 'No sources are available due to user permissions.';
    }, [props.someProvidersAvailable]);

    const openEl = Boolean(anchorElement);
    return (
        <div className={classes.popoverBlock}>
            <IconButton
                className={classes.warningIconBtn}
                onClick={handlePopoverOpen}
            >
                {getIcon()}
            </IconButton>
            <span style={{ paddingTop: '3px', paddingLeft: '3px' }}>
                <Link
                    className={props.classes.name}
                    onClick={handlePopoverOpen}
                >
                    <Typography
                        variant="h6"
                        gutterBottom
                        className={classes.permissionNotificationText}
                    >
                        Permission Notification
                    </Typography>
                </Link>
            </span>
            <Popover
                PaperProps={{
                    style: { padding: '16px', width: '30%' },
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
                    <div>
                        {getMessage()}  If you believe this is an error, contact your administrator.
                    </div>
                </div>
            </Popover>
        </div>
    );
}

export default withStyles(jss)(NotificationPopover);
