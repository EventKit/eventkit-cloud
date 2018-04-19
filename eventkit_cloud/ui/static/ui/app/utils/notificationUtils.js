import React from 'react';
import Info from 'material-ui/svg-icons/action/info';
import CheckCircle from 'material-ui/svg-icons/action/check-circle';
import Warning from 'material-ui/svg-icons/alert/warning';
import Error from 'material-ui/svg-icons/alert/error';
import { Link } from 'react-router';

// NOTE: This should ideally be a NotificationMessage component, but we need to return the bare elements without
// a wrapper to solve the middle text truncation problem. With React 16 we'll be able to do this from a component
// by using fragments (https://reactjs.org/docs/fragments.html).
export function getNotificationMessage({ notification, textStyle, linkStyle, onLinkClick = () => { return true; } }) {
    const styles = {
        text: textStyle || {
            whiteSpace: 'nowrap',
        },
        link: linkStyle || {
            color: '#337ab7',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
    };

    const handleLinkClick = (e) => {
        if (!onLinkClick()) {
            e.preventDefault();
        }
    };

    const type = getNotificationType(notification);
    switch (type) {
        case 'run_start':
            return [
                <span key={`${notification.id}-span0`} style={styles.text}>DataPack&nbsp;</span>,
                <Link
                    key={`${notification.id}-Link`}
                    to={`/status/${notification.actor.details.job.uid}`}
                    href={`/status/${notification.actor.details.job.uid}`}
                    style={styles.link}
                    onClick={handleLinkClick}
                    title={notification.actor.details.job.name}
                >
                    {notification.actor.details.job.name}
                </Link>,
                <span key={`${notification.id}-span1`} style={styles.text}>&nbsp;has started.</span>
            ];
        case 'run_complete':
            return [
                <span key={`${notification.id}-span0`} style={styles.text}>DataPack&nbsp;</span>,
                <Link
                    key={`${notification.id}-Link`}
                    to={`/status/${notification.actor.details.job.uid}`}
                    href={`/status/${notification.actor.details.job.uid}`}
                    style={styles.link}
                    onClick={handleLinkClick}
                    title={notification.actor.details.job.name}
                >
                    {notification.actor.details.job.name}
                </Link>,
                <span key={`${notification.id}-span1`} style={styles.text}>&nbsp;is complete.</span>
            ];
        case 'run_delete':
            return [
                <span key={`${notification.id}-span0`} style={styles.text}>DataPack&nbsp;</span>,
                <Link
                    key={`${notification.id}-Link`}
                    to={`/status/${notification.actor.details.job.uid}`}
                    href={`/status/${notification.actor.details.job.uid}`}
                    style={styles.link}
                    onClick={handleLinkClick}
                    title={notification.actor.details.job.name}
                >
                    {notification.actor.details.job.name}
                </Link>,
                <span key={`${notification.id}-span1`} style={styles.text}>&nbsp;was deleted.</span>
            ];
        case 'run_error':
            return [
                <span key={`${notification.id}-span0`} style={styles.text}>DataPack&nbsp;</span>,
                <Link
                    key={`${notification.id}-Link`}
                    to={`/status/${notification.actor.details.job.uid}`}
                    href={`/status/${notification.actor.details.job.uid}`}
                    style={styles.link}
                    onClick={handleLinkClick}
                    title={notification.actor.details.job.name}
                >
                    {notification.actor.details.job.name}
                </Link>,
                <span key={`${notification.id}-span1`} style={styles.text}>&nbsp;failed to complete.</span>
            ];
        default:
            console.error(`Unsupported notification type '${type}'`, notification);
    }
}

// NOTE: This should ideally be a NotificationIcon component, but is here for consistency with getNotificationMessage().
export function getNotificationIcon({ notification, iconStyle }) {
    const styles = {
        icon: iconStyle || {
            marginRight: '10px',
            flex: '0 0 auto',
        },
    };

    const infoIcon = <Info style={{...styles.icon, fill: '#4598BF'}} />;
    const checkCircleIcon = <CheckCircle style={{...styles.icon, fill: '#55BA63'}} />;
    const warningIcon = <Warning style={{...styles.icon, fill: '#F4D225'}} />;
    const errorIcon = <Error style={{...styles.icon, fill: '#CE4427'}} />;

    const type = getNotificationType(notification);
    switch (type) {
        case 'run_start':
            return infoIcon;
        case 'run_complete':
            return checkCircleIcon;
        case 'run_delete':
            return warningIcon;
        case 'run_error':
            return errorIcon;
        default:
            console.error(`Unsupported notification type '${type}'`, notification);
    }
}

export function getNotificationViewPath(notification) {
    const type = getNotificationType(notification);
    switch (type) {
        case 'run_start':
        case 'run_complete':
        case 'run_delete':
        case 'run_error':
            return `/status/${notification.actor.details.job.uid}`;
        default:
            console.error(`Unsupported notification type '${type}'`, notification);
    }
}

function getNotificationType(notification) {
    let type = notification.verb.toLowerCase();
    if (notification.actor) {
        type = `${notification.actor.type.toLowerCase()}_${type}`;
    }

    const level = notification.level.toLowerCase();
    switch (type) {
        case 'run_end':
            if (level === 'error') {
                return 'run_error';
            } else {
                return 'run_complete';
            }
        default:
            return type;
    }
}
