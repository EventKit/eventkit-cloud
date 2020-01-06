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
            this.props.history.push(path);
            this.props.markNotificationsAsRead([this.props.notification]);
        }
    }

    render() {
        const { colors } = this.props.theme.eventkit;
        const { width } = this.props;

        const styles = {
            content: {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
            },
            date: {
                alignItems: 'center',
                display: 'flex',
                flex: '0 0 auto',
                fontSize: isWidthUp('sm', width) ? '12px' : '10px',
                margin: '0 10px',
            },
            icon: {
                flex: '0 0 auto',
                marginRight: '10px',
            },
            iconMenu: {
                height: '24px',
                padding: '0',
                verticalAlign: 'middle',
                width: '24px',
            },
            menuItem: {
                fontSize: !isWidthUp('md', width) ? 10 : 12,
            },
            root: {
                alignItems: 'center',
                backgroundColor: (this.props.notification.unread) ? colors.selected_primary : colors.white,
                color: colors.text_primary,
                display: 'flex',
                fontSize: isWidthUp('sm', width) ? '18px' : '14px',
                padding: '15px',
                transition: 'background-color 0.25s',
                ...this.props.paperStyle,
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
                        history={this.props.history}
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
    history: PropTypes.object.isRequired,
    markNotificationsAsRead: PropTypes.func.isRequired,
    notification: PropTypes.object.isRequired,
    onMarkAsRead: PropTypes.func,
    onMarkAsUnread: PropTypes.func,
    onRemove: PropTypes.func,
    onView: PropTypes.func,
    paperStyle: PropTypes.object,
    style: PropTypes.object,
    theme: PropTypes.object.isRequired,
    width: PropTypes.string.isRequired,
};

NotificationGridItem.defaultProps = {
    onMarkAsRead: () => true,
    onMarkAsUnread: () => true,
    onRemove: () => true,
    onView: () => true,
    paperStyle: {},
    style: {},
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
