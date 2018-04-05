import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { Paper } from 'material-ui';
import moment from 'moment';
import { markNotificationsAsRead, markNotificationsAsUnread, removeNotifications } from '../../actions/notificationsActions';
import { getNotificationIcon, getNotificationMessage, getNotificationViewUrl } from '../../utils/notificationUtils';
import { NotificationMenu } from './NotificationMenu';

export class NotificationGridItem extends Component {
    constructor(props) {
        super(props);
        this.handleMarkAsRead = this.handleMarkAsRead.bind(this);
        this.handleMarkAsUnread = this.handleMarkAsUnread.bind(this);
        this.handleRemove = this.handleRemove.bind(this);
        this.handleView = this.handleView.bind(this);
    }

    handleMarkAsRead() {
        this.props.markNotificationsAsRead([this.props.notification]);
        this.props.onMarkAsRead(this.props.notification);
    }

    handleMarkAsUnread() {
        this.props.markNotificationsAsUnread([this.props.notification]);
        this.props.onMarkAsUnread(this.props.notification);
    }

    handleRemove() {
        this.props.removeNotifications([this.props.notification]);
        this.props.onRemove(this.props.notification);
    }

    handleView() {
        // Allow the parent component the opportunity to stop or handle navigation.
        if (this.props.onView(this.props.notification)) {
            this.props.router.push(getNotificationViewUrl(this.props.notification));
            this.props.markNotificationsAsRead([this.props.notification]);
        }
    }

    render() {
        let styles = {
            root: {
                display: 'flex',
                alignItems: 'center',
                padding: '15px',
                fontSize: (window.innerWidth > 575) ? '18px' : '14px',
                color: 'rgba(0, 0, 0, 0.54)',
                transition: 'background-color 0.25s',
            },
            content: {
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            },
            icon: {
                flex: '0 0 auto',
                marginRight: '10px'
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

        styles.root = {
            ...styles.root,
            ...this.props.style,
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
                    backgroundColor: (this.props.notification.read) ? 'white' : '#d5e6f1',
                }}
            >
                {icon}
                {message}
                <div style={{flex: '1'}}></div>
                <div style={styles.date}>
                    {moment(this.props.notification.date).fromNow()}
                </div>
                <NotificationMenu
                    onMarkAsRead={this.props.notification.read ? null : this.handleMarkAsRead}
                    onMarkAsUnread={this.props.notification.read ? this.handleMarkAsUnread : null}
                    onRemove={this.handleRemove}
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
};

NotificationGridItem.defaultProps = {
    style: {},
    onMarkAsRead: () => {},
    onMarkAsUnread: () => {},
    onRemove: () => {},
    onView: () => { return true; },
};

function mapDispatchToProps(dispatch) {
    return {
        markNotificationsAsRead: (notification) => dispatch(markNotificationsAsRead(notification)),
        markNotificationsAsUnread: (notification) => dispatch(markNotificationsAsUnread(notification)),
        removeNotifications: (notification) => dispatch(removeNotifications(notification)),
    };
}

export default connect(
    null,
    mapDispatchToProps,
)(NotificationGridItem);
