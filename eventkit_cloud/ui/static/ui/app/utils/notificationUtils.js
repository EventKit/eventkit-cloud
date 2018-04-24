import React from 'react';
import Info from 'material-ui/svg-icons/action/info';
import CheckCircle from 'material-ui/svg-icons/action/check-circle';
import Warning from 'material-ui/svg-icons/alert/warning';
import Error from 'material-ui/svg-icons/alert/error';
import { Link } from 'react-router';

const verbs = {
    run_started: 'run_started',
    run_completed: 'run_completed',
    run_failed: 'run_failed',
    run_deleted: 'run_deleted',
    run_canceled: 'run_canceled',
    removed_from_group: 'removed_from_group',
    added_to_group: 'added_to_group',
    set_as_group_admin: 'set_as_group_admin',
};

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

    const verb = notification.verb.toLowerCase();
    switch (verb) {
        case verbs.run_started:
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
        case verbs.run_completed:
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
        case verbs.run_deleted:
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
        case verbs.run_failed:
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
            console.error(`Unsupported notification verb '${verb}'`, notification);
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

    const verb = notification.verb.toLowerCase();
    switch (verb) {
        case verbs.run_started:
            return infoIcon;
        case verbs.run_completed:
            return checkCircleIcon;
        case verbs.run_deleted:
            return warningIcon;
        case verbs.run_failed:
            return errorIcon;
        default:
            console.error(`Unsupported notification verb '${verb}'`, notification);
    }
}

export function getNotificationViewPath(notification) {
    const verb = notification.verb.toLowerCase();
    switch (verb) {
        case verbs.run_started:
        case verbs.run_completed:
        case verbs.run_deleted:
        case verbs.run_failed:
            return `/status/${notification.actor.details.job.uid}`;
        default:
            console.error(`Unsupported notification verb '${verb}'`, notification);
    }
}
