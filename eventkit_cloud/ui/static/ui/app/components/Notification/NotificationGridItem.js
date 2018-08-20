import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import Paper from '@material-ui/core/Paper';
import { markNotificationsAsRead, markNotificationsAsUnread, removeNotifications } from '../../actions/notificationsActions';
import { getNotificationIcon, getNotificationMessage, getNotificationViewPath } from '../../utils/notificationUtils';
import NotificationMenu from './NotificationMenu';


export class NotificationGridItem extends Component {
    constructor(props) {
        super(props);
        this.handleView = this.handleView.bind(this);
    }

    handleView() {
        // Allow the parent component the opportunity to stop or handle navigation.
        const path = getNotificationViewPath(this.props.notification);
        if (this.props.onView(this.props.notification, path)) {
            this.props.router.push(path);
            this.props.markNotificationsAsRead([this.props.notification]);
        }
    }

    render() {
        const styles = {
            root: {
                display: 'flex',
                alignItems: 'center',
                padding: '15px',
                fontSize: (window.innerWidth > 575) ? '18px' : '14px',
                color: 'rgba(0, 0, 0, 0.54)',
                transition: 'background-color 0.25s',
                ...this.props.style,
            },
            content: {
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            },
            icon: {
                flex: '0 0 auto',
                marginRight: '10px',
            },
            date: {
                margin: '0 10px',
                fontSize: (window.innerWidth > 575) ? '12px' : '10px',
                display: 'flex',
                alignItems: 'center',
                flex: '0 0 auto',
            },
            iconMenu: {
                padding: '0',
                width: '24px',
                height: '24px',
                verticalAlign: 'middle',
            },
            menuItem: {
                fontSize: (window.innerWidth < 768) ? 10 : 12,
            },
        };

        const icon = getNotificationIcon({ notification: this.props.notification });
        const message = getNotificationMessage({
            notification: this.props.notification,
            onLinkClick: this.handleView,
        });

        return (
            <Paper
                style={{
                    ...styles.root,
                    backgroundColor: (this.props.notification.unread) ? '#d5e6f1' : 'white',
                }}
            >
                {icon}
                {message}
                <div style={{ flex: '1' }} />
                <div
                    className="qa-NotificationGridItem-Date"
                    style={styles.date}
                >
                    {moment(this.props.notification.timestamp).fromNow()}
                </div>
                <NotificationMenu
                    notification={this.props.notification}
                    router={this.props.router}
                    onMarkAsRead={this.props.onMarkAsRead}
                    onMarkAsUnread={this.props.onMarkAsUnread}
                    onRemove={this.props.onRemove}
                    onView={this.handleView}
                />
            </Paper>
        );
    }
}

NotificationGridItem.propTypes = {
    style: PropTypes.object,
    notification: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
    onMarkAsRead: PropTypes.func,
    onMarkAsUnread: PropTypes.func,
    onRemove: PropTypes.func,
    onView: PropTypes.func,
    markNotificationsAsRead: PropTypes.func.isRequired,
};

NotificationGridItem.defaultProps = {
    style: {},
    onMarkAsRead: undefined,
    onMarkAsUnread: undefined,
    onRemove: undefined,
    onView: () => true,
};

function mapDispatchToProps(dispatch) {
    return {
        markNotificationsAsRead: notification => dispatch(markNotificationsAsRead(notification)),
        markNotificationsAsUnread: notification => dispatch(markNotificationsAsUnread(notification)),
        removeNotifications: notification => dispatch(removeNotifications(notification)),
    };
}

export default connect(
    null,
    mapDispatchToProps,
)(NotificationGridItem);
