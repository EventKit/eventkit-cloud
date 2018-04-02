import React from 'react';
import Info from 'material-ui/svg-icons/action/info';
import CheckCircle from 'material-ui/svg-icons/action/check-circle';
import Warning from 'material-ui/svg-icons/alert/warning';
import Error from 'material-ui/svg-icons/alert/error';
import { Link } from 'react-router';

const types = {
    DATAPACK_COMPLETE_SUCCESS: 'datapack-complete-success',
    DATAPACK_COMPLETE_ERROR: 'datapack-complete-error',
};

// NOTE: This should ideally be a NotificationMessage component, but we need to return the bare elements without
// a wrapper to solve the middle text truncation problem. With React 16 we'll be able to do this from a component
// by using fragments (https://reactjs.org/docs/fragments.html).
export function getNotificationMessage({ notification, textStyle, linkStyle }) {
    const styles = {
        text: textStyle || {
            whiteSpace: 'nowrap',
        },
        link: linkStyle || {
            textDecoration: 'underline',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
    };

    switch (notification.type) {
        case types.DATAPACK_COMPLETE_SUCCESS:
            return [
                <Link
                    key={`${notification.uid}-Link`}
                    to={`/status/${notification.data.run.job.uid}`}
                    href={`/status/${notification.data.run.job.uid}`}
                    style={styles.link}
                >
                    {notification.data.run.job.name}
                </Link>,
                <span key={`${notification.uid}-span0`} style={styles.text}>&nbsp;is complete.</span>
            ];
        case types.DATAPACK_COMPLETE_ERROR:
            return [
                <Link
                    key={`${notification.uid}-Link`}
                    to={`/status/${notification.data.run.job.uid}`}
                    href={`/status/${notification.data.run.job.uid}`}
                    style={styles.link}
                >
                    {notification.data.run.job.name}
                </Link>,
                <span key={`${notification.uid}-span0`} style={styles.text}>&nbsp;failed to complete.</span>
            ];
        default:
            console.error(`Unsupported notification type '${notification.type}'`, notification);
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

    switch (notification.type) {
        case types.DATAPACK_COMPLETE_SUCCESS:
            return checkCircleIcon;
        case types.DATAPACK_COMPLETE_ERROR:
            return errorIcon;
        default:
            console.error(`Unsupported notification type '${notification.type}'`, notification);
    }
}

export function getNotificationViewUrl(notification) {
    switch (notification.type) {
        case types.DATAPACK_COMPLETE_SUCCESS:
        case types.DATAPACK_COMPLETE_ERROR:
            return `/status/${notification.data.run.uid}`;
        default:
            console.error(`Unsupported notification type '${notification.type}'`, notification);
    }
}
