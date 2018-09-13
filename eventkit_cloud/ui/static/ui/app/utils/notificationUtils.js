import React from 'react';
import InfoIcon from '@material-ui/icons/Info';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import WarningIcon from '@material-ui/icons/Warning';
import ErrorIcon from '@material-ui/icons/Error';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import RemoveCircleIcon from '@material-ui/icons/RemoveCircle';
import { Link } from 'react-router';
import { colors } from '../styles/eventkit_theme';

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

export function getNotificationViewPath(notification) {
    const verb = notification.verb.toLowerCase();
    switch (verb) {
        case verbs.runStarted:
        case verbs.runCanceled:
        case verbs.runCompleted:
        case verbs.runDeleted:
        case verbs.runFailed: {
            const run = notification.actor.details;
            if (!run) {
                return '';
            }

            return `/status/${notification.actor.details.job.uid}`;
        }
        case verbs.addedToGroup:
        case verbs.removedFromGroup:
        case verbs.setAsGroupAdmin:
        case verbs.removedAsGroupAdmin: {
            const group = notification.action_object.details;
            if (!group) {
                return '';
            }

            return `/groups?groups=${group.id}`;
        }
        default:
            return null;
    }
}

// NOTE: This should ideally be a NotificationMessage component, but we need to return the bare elements without
// a wrapper to solve the middle text truncation problem. With React 16 we'll be able to do this from a component
// by using fragments (https://reactjs.org/docs/fragments.html).
export function getNotificationMessage({
    notification,
    textStyle = {},
    linkStyle = {},
    onLinkClick = () => (true),
}) {
    let styles = {
        text: {
            ...textStyle,
            whiteSpace: 'nowrap',
            fontSize: (window.innerWidth >= 512) ? '16px' : '12px',
        },
        link: {
            ...textStyle,
            ...linkStyle,
            color: colors.primary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: (window.innerWidth >= 512) ? '16px' : '12px',
        },
    };

    styles = {
        ...styles,
        name: {
            ...styles.text,
            fontWeight: 'bold',
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
    if (!notification.actor.details && !notification.action_object.details) {
        return [
            <span
                key={`${notification.id}-error`}
                style={{ ...styles.text, color: colors.warning, whiteSpace: 'normal' }}
                className="qa-NotificationMessage-error"
            >
                Uh oh! Sorry, this notification&apos;s details are no longer available.
            </span>,
        ];
    }

    const viewPath = getNotificationViewPath(notification);

    switch (verb) {
        case verbs.runStarted: {
            const run = notification.actor.details;
            return [
                <Link
                    key={`${notification.id}-Link`}
                    className="qa-NotificationMessage-Link"
                    to={viewPath}
                    href={viewPath}
                    style={styles.link}
                    onClick={handleLinkClick}
                    title={run.job.name}
                >
                    {run.job.name}
                </Link>,
                <span
                    key={`${notification.id}-span1`}
                    className="qa-NotificationMessage-Text"
                    style={styles.text}
                >
                    &nbsp;has started processing.
                </span>,
            ];
        }
        case verbs.runCanceled: {
            const run = notification.actor.details;
            return [
                <Link
                    key={`${notification.id}-Link`}
                    className="qa-NotificationMessage-Link"
                    to={viewPath}
                    href={viewPath}
                    style={styles.link}
                    onClick={handleLinkClick}
                    title={run.job.name}
                >
                    {run.job.name}
                </Link>,
                <span
                    key={`${notification.id}-span1`}
                    className="qa-NotificationMessage-Text"
                    style={styles.text}
                >
                    &nbsp;has been canceled.
                </span>,
            ];
        }
        case verbs.runCompleted: {
            const run = notification.actor.details;
            return [
                <Link
                    key={`${notification.id}-Link`}
                    className="qa-NotificationMessage-Link"
                    to={viewPath}
                    href={viewPath}
                    style={styles.link}
                    onClick={handleLinkClick}
                    title={run.job.name}
                >
                    {run.job.name}
                </Link>,
                <span
                    key={`${notification.id}-span1`}
                    className="qa-NotificationMessage-Text"
                    style={styles.text}
                >
                    &nbsp;is complete.
                </span>,
            ];
        }
        case verbs.runFailed: {
            const run = notification.actor.details;
            return [
                <Link
                    key={`${notification.id}-Link`}
                    className="qa-NotificationMessage-Link"
                    to={viewPath}
                    href={viewPath}
                    style={styles.link}
                    onClick={handleLinkClick}
                    title={run.job.name}
                >
                    {run.job.name}
                </Link>,
                <span
                    key={`${notification.id}-span1`}
                    className="qa-NotificationMessage-Text"
                    style={styles.text}
                >
                    &nbsp;failed to complete.
                </span>,
            ];
        }
        case verbs.runDeleted: {
            const run = notification.actor.details;
            return [
                <Link
                    key={`${notification.id}-Link`}
                    className="qa-NotificationMessage-Link"
                    to={viewPath}
                    href={viewPath}
                    style={styles.link}
                    onClick={handleLinkClick}
                    title={run.job.name}
                >
                    {run.job.name}
                </Link>,
                <span
                    key={`${notification.id}-span1`}
                    className="qa-NotificationMessage-Text"
                    style={styles.text}
                >
                    &nbsp;has been deleted.
                </span>,
            ];
        }
        case verbs.addedToGroup: {
            const group = notification.action_object.details;
            return [
                <span
                    key={`${notification.id}-span0`}
                    className="qa-NotificationMessage-Text"
                    style={styles.text}
                >
                    {"You've been added to"}&nbsp;
                </span>,
                <Link
                    key={`${notification.id}-span1`}
                    className="qa-NotificationMessage-Text"
                    to={viewPath}
                    href={viewPath}
                    style={styles.link}
                    onClick={handleLinkClick}
                    title={group.name}
                >
                    {group.name}
                </Link>,
            ];
        }
        case verbs.removedFromGroup: {
            const group = notification.action_object.details;
            return [
                <span
                    key={`${notification.id}-span0`}
                    className="qa-NotificationMessage-Text"
                    style={styles.text}
                >
                    {"You've been removed from"}&nbsp;
                </span>,
                <Link
                    key={`${notification.id}-span1`}
                    className="qa-NotificationMessage-Text"
                    to={viewPath}
                    href={viewPath}
                    style={styles.link}
                    onClick={handleLinkClick}
                    title={group.name}
                >
                    {group.name}
                </Link>,
            ];
        }
        case verbs.setAsGroupAdmin: {
            const group = notification.action_object.details;
            return [
                <span
                    key={`${notification.id}-span0`}
                    className="qa-NotificationMessage-Text"
                    style={styles.text}
                >
                    {"You've been set as an admin of"}&nbsp;
                </span>,
                <Link
                    key={`${notification.id}-span1`}
                    className="qa-NotificationMessage-Text"
                    to={viewPath}
                    href={viewPath}
                    style={styles.link}
                    onClick={handleLinkClick}
                    title={group.name}
                >
                    {group.name}
                </Link>,
            ];
        }
        case verbs.removedAsGroupAdmin: {
            const group = notification.action_object.details;
            return [
                <span
                    key={`${notification.id}-span0`}
                    className="qa-NotificationMessage-Text"
                    style={styles.text}
                >
                    {"You've been removed as an admin of"}&nbsp;
                </span>,
                <Link
                    key={`${notification.id}-span1`}
                    className="qa-NotificationMessage-Text"
                    to={viewPath}
                    href={viewPath}
                    style={styles.link}
                    onClick={handleLinkClick}
                    title={group.name}
                >
                    {group.name}
                </Link>,
            ];
        }
        default:
            console.error(`Unsupported notification verb '${verb}'`, notification);
            return null;
    }
}

// NOTE: This should ideally be a NotificationIcon component, but is here for consistency with getNotificationMessage().
// eslint-disable-next-line react/prop-types
export function getNotificationIcon({ notification, iconStyle }) {
    const styles = {
        icon: iconStyle || {
            marginRight: '10px',
            flex: '0 0 auto',
        },
    };

    const verb = notification.verb.toLowerCase();
    switch (verb) {
        case verbs.runStarted:
            return (
                <InfoIcon
                    className="qa-NotificationIcon"
                    style={{
                        ...styles.icon,
                        fill: colors.background_light,
                    }}
                />
            );
        case verbs.runCompleted:
            return (
                <CheckCircleIcon
                    className="qa-NotificationIcon"
                    style={{
                        ...styles.icon,
                        fill: colors.success,
                    }}
                />
            );
        case verbs.addedToGroup:
        case verbs.setAsGroupAdmin:
            return (
                <AddCircleIcon
                    className="qa-NotificationIcon"
                    style={{
                        ...styles.icon,
                        fill: colors.success,
                    }}
                />
            );
        case verbs.runDeleted:
        case verbs.removedFromGroup:
        case verbs.removedAsGroupAdmin:
            return (
                <RemoveCircleIcon
                    className="qa-NotificationIcon"
                    style={{
                        ...styles.icon,
                        fill: colors.warning,
                    }}
                />
            );
        case verbs.runCanceled:
            return (
                <WarningIcon
                    className="qa-NotificationIcon"
                    style={{
                        ...styles.icon,
                        fill: colors.running,
                    }}
                />
            );
        case verbs.runFailed:
            return (
                <ErrorIcon
                    className="qa-NotificationIcon"
                    style={{
                        ...styles.icon,
                        fill: colors.warning,
                    }}
                />
            );
        default:
            return null;
    }
}
