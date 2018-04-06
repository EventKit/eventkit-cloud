import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { IconButton, IconMenu, MenuItem } from 'material-ui';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import OpenInNewIcon from 'material-ui/svg-icons/action/open-in-new';
import FlagIcon from 'material-ui/svg-icons/content/flag';
import CloseIcon from 'material-ui/svg-icons/navigation/close';
import { getNotificationViewPath } from '../../utils/notificationUtils';
import {
    markNotificationsAsRead,
    markNotificationsAsUnread,
    removeNotifications
} from '../../actions/notificationsActions';

export class NotificationMenu extends React.Component {
    constructor(props) {
        super(props);
        this.handleMenuItemClick = this.handleMenuItemClick.bind(this);
        this.handleMarkAsRead = this.handleMarkAsRead.bind(this);
        this.handleMarkAsUnread = this.handleMarkAsUnread.bind(this);
        this.handleRemove = this.handleRemove.bind(this);
        this.handleView = this.handleView.bind(this);
        this.state = {
            // This is a slight hack to prevent some glitchy behavior in the notifications dropdown. Without it, clicking
            // the "View" menu item will cause the dropdown to immediately close as the menu item stays for a moment to
            // show its ripple effect. This trick also just makes the menu feel a little more responsive.
            forceClose: false,
        };
    }

    componentDidUpdate() {
        if (this.state.forceClose) {
            this.setState({ forceClose: false });
        }
    }

    handleMenuItemClick(e) {
        e.stopPropagation();
        this.setState({ forceClose: true });
    }

    handleMarkAsRead(e) {
        this.handleMenuItemClick(e);
        this.props.markNotificationsAsRead([this.props.notification]);
        this.props.onMarkAsRead(this.props.notification);
    }

    handleMarkAsUnread(e) {
        this.handleMenuItemClick(e);
        this.props.markNotificationsAsUnread([this.props.notification]);
        this.props.onMarkAsUnread(this.props.notification);
    }

    handleRemove(e) {
        this.handleMenuItemClick(e);
        this.props.removeNotifications([this.props.notification]);
        this.props.onRemove(this.props.notification);
    }

    handleView(e) {
        this.handleMenuItemClick(e);
        const path = getNotificationViewPath(this.props.notification);
        if (this.props.onView(path, this.props.notification)) {
            this.props.router.push(path);
            this.props.markNotificationsAsRead([this.props.notification]);
        }
    }

    render() {
        let styles = {
            menuButton: {
                padding: '0',
                width: '20px',
                height: 'auto',
                verticalAlign: 'middle',
            },
            menuButtonIcon: {
                color: '#4598bf',
            },
        };

        return (
            <IconMenu
                style={this.props.style}
                iconButtonElement={
                    <IconButton
                        style={styles.menuButton}
                        iconStyle={styles.menuButtonIcon}
                    >
                        <MoreVertIcon />
                    </IconButton>}
                anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                open={this.state.forceClose ? false : undefined}
            >
                <MenuItem
                    style={styles.menuItem}
                    primaryText="View"
                    leftIcon={<OpenInNewIcon />}
                    onClick={this.handleView}
                />
                {this.props.notification.read ?
                    <MenuItem
                        style={styles.menuItem}
                        primaryText="Mark As Unread"
                        leftIcon={<FlagIcon />}
                        onClick={this.handleMarkAsUnread}
                    />
                    :
                    <MenuItem
                        style={styles.menuItem}
                        primaryText="Mark As Read"
                        leftIcon={<FlagIcon />}
                        onClick={this.handleMarkAsRead}
                    />
                }
                <MenuItem
                    style={styles.menuItem}
                    primaryText="Remove"
                    leftIcon={<CloseIcon />}
                    onClick={this.handleRemove}
                />
            </IconMenu>
        );
    }
}

NotificationMenu.propTypes = {
    style: PropTypes.object,
    notification: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
    onMarkAsRead: PropTypes.func,
    onMarkAsUnread: PropTypes.func,
    onRemove: PropTypes.func,
    onView: PropTypes.func,
};

NotificationMenu.defaultProps = {
    onMarkAsRead: () => {},
    onMarkAsUnread: () => {},
    onRemove: () => {},
    onView: () => { return true; },
};

function mapDispatchToProps(dispatch) {
    return {
        markNotificationsAsRead: (notifications) => dispatch(markNotificationsAsRead(notifications)),
        markNotificationsAsUnread: (notifications) => dispatch(markNotificationsAsUnread(notifications)),
        removeNotifications: (notifications) => dispatch(removeNotifications(notifications)),
    };
}

export default connect(
    null,
    mapDispatchToProps,
)(NotificationMenu);
