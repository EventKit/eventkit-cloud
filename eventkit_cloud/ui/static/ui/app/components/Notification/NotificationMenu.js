import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { withTheme } from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import FlagIcon from '@material-ui/icons/Flag';
import CloseIcon from '@material-ui/icons/Close';
import IconMenu from '../common/IconMenu';
import { getNotificationViewPath } from '../../utils/notificationUtils';
import {
    markNotificationsAsRead,
    markNotificationsAsUnread,
    removeNotifications,
} from '../../actions/notificationsActions';

export class NotificationMenu extends React.Component {
    constructor(props) {
        super(props);
        this.handleMarkAsRead = this.handleMarkAsRead.bind(this);
        this.handleMarkAsUnread = this.handleMarkAsUnread.bind(this);
        this.handleRemove = this.handleRemove.bind(this);
        this.handleView = this.handleView.bind(this);
    }

    handleMarkAsRead() {
        if (this.props.onMarkAsRead(this.props.notification)) {
            this.props.markNotificationsAsRead([this.props.notification]);
        }
    }

    handleMarkAsUnread() {
        if (this.props.onMarkAsUnread(this.props.notification)) {
            this.props.markNotificationsAsUnread([this.props.notification]);
        }
    }

    handleRemove() {
        if (this.props.onRemove(this.props.notification)) {
            this.props.removeNotifications([this.props.notification]);
        }
    }

    handleView() {
        const path = getNotificationViewPath(this.props.notification);
        if (this.props.onView(this.props.notification, path)) {
            this.props.history.push(path);
            this.props.markNotificationsAsRead([this.props.notification]);
        }
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            icon: {
                color: colors.text_primary,
                marginRight: '5px',
            },
            menuItem: {
                fontSize: '12px',
                lineHeight: '24px',
            },
        };

        const viewPath = getNotificationViewPath(this.props.notification);

        return (
            <IconMenu
                className="qa-NotificationMenu-IconMenu"
                menuStyle={{ zIndex: 1400 }}
                style={{ width: '26px', height: '26px' }}
            >
                {viewPath
                    ? (
                        <MenuItem
                            className="qa-NotificationMenu-MenuItem-View"
                            key="view"
                            onClick={this.handleView}
                            style={styles.menuItem}
                        >
                            <OpenInNewIcon style={styles.icon} />
                            {' '}
View
                        </MenuItem>
                    )
                    : null
                }
                {this.props.notification.unread
                    ? (
                        <MenuItem
                            className="qa-NotificationMenu-MenuItem-MarkAsRead"
                            key="markRead"
                            onClick={this.handleMarkAsRead}
                            style={styles.menuItem}
                        >
                            <FlagIcon style={styles.icon} />
                            {' '}
Mark As Read
                        </MenuItem>
                    )
                    : (
                        <MenuItem
                            className="qa-NotificationMenu-MenuItem-MarkAsUnread"
                            key="markUnread"
                            onClick={this.handleMarkAsUnread}
                            style={styles.menuItem}
                        >
                            <FlagIcon style={styles.icon} />
                            {' '}
Mark As Unread
                        </MenuItem>
                    )
                }
                <MenuItem
                    className="qa-NotificationMenu-MenuItem-Remove"
                    key="remove"
                    onClick={this.handleRemove}
                    style={styles.menuItem}
                >
                    <CloseIcon style={styles.icon} />
                    {' '}
Remove
                </MenuItem>
            </IconMenu>
        );
    }
}

NotificationMenu.propTypes = {
    history: PropTypes.object.isRequired,
    markNotificationsAsRead: PropTypes.func.isRequired,
    markNotificationsAsUnread: PropTypes.func.isRequired,
    notification: PropTypes.object.isRequired,
    onMarkAsRead: PropTypes.func,
    onMarkAsUnread: PropTypes.func,
    onRemove: PropTypes.func,
    onView: PropTypes.func,
    removeNotifications: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired,
};

NotificationMenu.defaultProps = {
    onMarkAsRead: () => true,
    onMarkAsUnread: () => true,
    onRemove: () => true,
    onView: () => true,
};

function mapDispatchToProps(dispatch) {
    return {
        markNotificationsAsRead: notifications => dispatch(markNotificationsAsRead(notifications)),
        markNotificationsAsUnread: notifications => dispatch(markNotificationsAsUnread(notifications)),
        removeNotifications: notifications => dispatch(removeNotifications(notifications)),
    };
}

export default withTheme()(connect(
    null,
    mapDispatchToProps,
)(NotificationMenu));
