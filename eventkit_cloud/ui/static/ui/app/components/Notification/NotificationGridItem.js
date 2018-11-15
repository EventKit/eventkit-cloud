import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTheme } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import moment from 'moment';
import Paper from '@material-ui/core/Paper';
import { markNotificationsAsRead, markNotificationsAsUnread, removeNotifications } from '../../actions/notificationsActions';
import { getNotificationViewPath } from '../../utils/notificationUtils';
import NotificationMessage from './NotificationMessage';
import NotificationIcon from './NotificationIcon';
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
        const { colors } = this.props.theme.eventkit;
        const { width } = this.props;

        const styles = {
            root: {
                display: 'flex',
                alignItems: 'center',
                padding: '15px',
                fontSize: isWidthUp('sm', width) ? '18px' : '14px',
                color: colors.text_primary,
                transition: 'background-color 0.25s',
                backgroundColor: (this.props.notification.unread) ? colors.selected_primary : colors.white,
                ...this.props.paperStyle,
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
                fontSize: isWidthUp('sm', width) ? '12px' : '10px',
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
                fontSize: !isWidthUp('md', width) ? 10 : 12,
            },
        };

        return (
            <div className="qa-NotificationGridItem" style={this.props.style}>
                <Paper style={styles.root}>
                    <NotificationIcon notification={this.props.notification} />
                    <NotificationMessage
                        notification={this.props.notification}
                        onLinkClick={this.handleView}
                    />
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
            </div>
        );
    }
}

NotificationGridItem.propTypes = {
    style: PropTypes.object,
    paperStyle: PropTypes.object,
    notification: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
    onMarkAsRead: PropTypes.func,
    onMarkAsUnread: PropTypes.func,
    onRemove: PropTypes.func,
    onView: PropTypes.func,
    markNotificationsAsRead: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired,
    width: PropTypes.string.isRequired,
};

NotificationGridItem.defaultProps = {
    style: {},
    paperStyle: {},
    onMarkAsRead: () => true,
    onMarkAsUnread: () => true,
    onRemove: () => true,
    onView: () => true,
};

function mapDispatchToProps(dispatch) {
    return {
        markNotificationsAsRead: notification => dispatch(markNotificationsAsRead(notification)),
        markNotificationsAsUnread: notification => dispatch(markNotificationsAsUnread(notification)),
        removeNotifications: notification => dispatch(removeNotifications(notification)),
    };
}

export default
@withWidth()
@withTheme()
@connect(null, mapDispatchToProps)
class Default extends NotificationGridItem {}
