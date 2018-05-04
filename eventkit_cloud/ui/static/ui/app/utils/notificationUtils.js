import React from 'react';
import InfoIcon from 'material-ui/svg-icons/action/info';
import CheckCircleIcon from 'material-ui/svg-icons/action/check-circle';
import WarningIcon from 'material-ui/svg-icons/alert/warning';
import ErrorIcon from 'material-ui/svg-icons/alert/error';
import { Link } from 'react-router';

const verbs = {
    runStarted: 'run_started',
    runCanceled: 'run_canceled',
    runCompleted: 'run_completed',
    runFailed: 'run_failed',
    runDeleted: 'run_deleted',
    removedFromGroup: 'removed_from_group',
    addedToGroup: 'added_to_group',
    setAsGroupAdmin: 'set_as_group_admin',
    removedAsGroupAdmin: 'removed_as_group_admin',
};

// NOTE: This should ideally be a NotificationMessage component, but we need to return the bare elements without
// a wrapper to solve the middle text truncation problem. With React 16 we'll be able to do this from a component
// by using fragments (https://reactjs.org/docs/fragments.html).
export function getNotificationMessage({ notification, textStyle, linkStyle, onLinkClick = () => { return true; } }) {
    let styles = {
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

    styles = {
        ...styles,
        textBold: {
            ...styles.text,
            fontWeight: 'bold',
        }
    };

    const handleLinkClick = (e) => {
        if (!onLinkClick()) {
            e.preventDefault();
        }
    };

    const verb = notification.verb.toLowerCase();
    switch (verb) {
        case verbs.runStarted:
            return [
                <span
                    key={`${notification.id}-span0`}
                    className={'qa-NotificationMessage-Text'}
                    style={styles.text}
                >
                    DataPack&nbsp;
                </span>,
                <Link
                    key={`${notification.id}-Link`}
                    className={'qa-NotificationMessage-Link'}
                    to={`/status/${notification.actor.details.job.uid}`}
                    href={`/status/${notification.actor.details.job.uid}`}
                    style={styles.link}
                    onClick={handleLinkClick}
                    title={notification.actor.details.job.name}
                >
                    {notification.actor.details.job.name}
                </Link>,
                <span
                    key={`${notification.id}-span1`}
                    className={'qa-NotificationMessage-Text'}
                    style={styles.text}
                >
                    &nbsp;has started.
                </span>
            ];
        case verbs.runCanceled:
            return [
                <span
                    key={`${notification.id}-span0`}
                    className={'qa-NotificationMessage-Text'}
                    style={styles.text}
                >
                    DataPack&nbsp;
                </span>,
                <Link
                    key={`${notification.id}-Link`}
                    className={'qa-NotificationMessage-Link'}
                    to={`/status/${notification.actor.details.job.uid}`}
                    href={`/status/${notification.actor.details.job.uid}`}
                    style={styles.link}
                    onClick={handleLinkClick}
                    title={notification.actor.details.job.name}
                >
                    {notification.actor.details.job.name}
                </Link>,
                <span
                    key={`${notification.id}-span1`}
                    className={'qa-NotificationMessage-Text'}
                    style={styles.text}
                >
                    &nbsp;was canceled.
                </span>
            ];
        case verbs.runCompleted:
            return [
                <span
                    key={`${notification.id}-span0`}
                    className={'qa-NotificationMessage-Text'}
                    style={styles.text}
                >
                    DataPack&nbsp;
                </span>,
                <Link
                    key={`${notification.id}-Link`}
                    className={'qa-NotificationMessage-Link'}
                    to={`/status/${notification.actor.details.job.uid}`}
                    href={`/status/${notification.actor.details.job.uid}`}
                    style={styles.link}
                    onClick={handleLinkClick}
                    title={notification.actor.details.job.name}
                >
                    {notification.actor.details.job.name}
                </Link>,
                <span
                    key={`${notification.id}-span1`}
                    className={'qa-NotificationMessage-Text'}
                    style={styles.text}
                >
                    &nbsp;is complete.
                </span>
            ];
        case verbs.runFailed:
            return [
                <span
                    key={`${notification.id}-span0`}
                    className={'qa-NotificationMessage-Text'}
                    style={styles.text}
                >
                    DataPack&nbsp;
                </span>,
                <Link
                    key={`${notification.id}-Link`}
                    className={'qa-NotificationMessage-Link'}
                    to={`/status/${notification.actor.details.job.uid}`}
                    href={`/status/${notification.actor.details.job.uid}`}
                    style={styles.link}
                    onClick={handleLinkClick}
                    title={notification.actor.details.job.name}
                >
                    {notification.actor.details.job.name}
                </Link>,
                <span
                    key={`${notification.id}-span1`}
                    className={'qa-NotificationMessage-Text'}
                    style={styles.text}
                >
                    &nbsp;failed to complete.
                </span>
            ];
        case verbs.runDeleted:
            return [
                <span
                    key={`${notification.id}-span0`}
                    className={'qa-NotificationMessage-Text'}
                    style={styles.text}
                >
                    DataPack&nbsp;
                </span>,
                <Link
                    key={`${notification.id}-Link`}
                    className={'qa-NotificationMessage-Link'}
                    to={`/status/${notification.actor.details.job.uid}`}
                    href={`/status/${notification.actor.details.job.uid}`}
                    style={styles.link}
                    onClick={handleLinkClick}
                    title={notification.actor.details.job.name}
                >
                    {notification.actor.details.job.name}
                </Link>,
                <span
                    key={`${notification.id}-span1`}
                    className={'qa-NotificationMessage-Text'}
                    style={styles.text}
                >
                    &nbsp;was deleted.
                </span>
            ];
        case verbs.addedToGroup:
            return [
                <span
                    key={`${notification.id}-span0`}
                    className={'qa-NotificationMessage-Text'}
                    style={styles.text}
                >
                    Added to group&nbsp;
                </span>,
                <span
                    key={`${notification.id}-span1`}
                    className={'qa-NotificationMessage-Text'}
                    style={styles.textBold}
                >
                    {notification.action_object.details.name}
                </span>,
            ];
        case verbs.removedFromGroup:
            return [
                <span
                    key={`${notification.id}-span0`}
                    className={'qa-NotificationMessage-Text'}
                    style={styles.text}
                >
                    Removed from group&nbsp;
                </span>,
                <span
                    key={`${notification.id}-span1`}
                    className={'qa-NotificationMessage-Text'}
                    style={styles.textBold}
                >
                    {notification.action_object.details.name}
                    </span>,
            ];
        case verbs.setAsGroupAdmin:
            return [
                <span
                    key={`${notification.id}-span0`}
                    className={'qa-NotificationMessage-Text'}
                    style={styles.text}
                >
                    Set as admin of group&nbsp;
                </span>,
                <span
                    key={`${notification.id}-span1`}
                    className={'qa-NotificationMessage-Text'}
                    style={styles.textBold}
                >
                    {notification.action_object.details.name}
                </span>,
            ];
        case verbs.removedAsGroupAdmin:
            return [
                <span
                    key={`${notification.id}-span0`}
                    className={'qa-NotificationMessage-Text'}
                    style={styles.text}
                >
                    Removed as admin of group&nbsp;
                </span>,
                <span
                    key={`${notification.id}-span1`}
                    className={'qa-NotificationMessage-Text'}
                    style={styles.textBold}
                >
                    {notification.action_object.details.name}
                </span>,
            ];
        default:
            console.error(`Unsupported notification verb '${verb}'`, notification);
            return null;
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

    const infoIcon = <InfoIcon className={'qa-NotificationIcon'} style={{...styles.icon, fill: '#4598BF'}} />;
    const checkCircleIcon = <CheckCircleIcon className={'qa-NotificationIcon'} style={{...styles.icon, fill: '#55BA63'}} />;
    const warningIcon = <WarningIcon className={'qa-NotificationIcon'} style={{...styles.icon, fill: '#F4D225'}} />;
    const errorIcon = <ErrorIcon className={'qa-NotificationIcon'} style={{...styles.icon, fill: '#CE4427'}} />;

    const verb = notification.verb.toLowerCase();
    switch (verb) {
        case verbs.runStarted:
        case verbs.addedToGroup:
        case verbs.removedFromGroup:
        case verbs.setAsGroupAdmin:
        case verbs.removedAsGroupAdmin:
            return infoIcon;
        case verbs.runCompleted:
            return checkCircleIcon;
        case verbs.runDeleted:
        case verbs.runCanceled:
            return warningIcon;
        case verbs.runFailed:
            return errorIcon;
        default:
            return null;
    }
}

export function getNotificationViewPath(notification) {
    const verb = notification.verb.toLowerCase();
    switch (verb) {
        case verbs.runStarted:
        case verbs.runCanceled:
        case verbs.runCompleted:
        case verbs.runDeleted:
        case verbs.runFailed:
            return `/status/${notification.actor.details.job.uid}`;
        case verbs.addedToGroup:
        case verbs.removedFromGroup:
        case verbs.setAsGroupAdmin:
        case verbs.removedAsGroupAdmin:
            return '/groups';
        default:
            return null;
    }
}
