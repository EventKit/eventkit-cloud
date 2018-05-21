import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { Divider, IconButton, IconMenu, MenuItem } from 'material-ui';
import MoreHorizIcon from 'material-ui/svg-icons/navigation/more-horiz'
import FlagIcon from 'material-ui/svg-icons/content/flag';
import CloseIcon from 'material-ui/svg-icons/navigation/close';
import values from 'lodash/values';
import {
    markAllNotificationsAsRead,
    markNotificationsAsRead,
    markNotificationsAsUnread,
    removeNotifications
} from '../../actions/notificationsActions';

export class NotificationsTableMenu extends React.Component {
    constructor(props) {
        super(props);
        this.handleMarkAsRead = this.handleMarkAsRead.bind(this);
        this.handleMarkAsUnread = this.handleMarkAsUnread.bind(this);
        this.handleRemove = this.handleRemove.bind(this);
        this.handleMarkAllAsRead = this.handleMarkAllAsRead.bind(this);
    }

    handleMarkAsRead() {
        if (this.props.onMarkAsRead(values(this.props.selectedNotifications))) {
            this.props.markNotificationsAsRead(values(this.props.selectedNotifications));
        }
    }

    handleMarkAsUnread() {
        if (this.props.onMarkAsUnread(values(this.props.selectedNotifications))) {
            this.props.markNotificationsAsUnread(values(this.props.selectedNotifications));
        }
    }

    handleRemove() {
        if (this.props.onRemove(values(this.props.selectedNotifications))) {
            this.props.removeNotifications(values(this.props.selectedNotifications));
        }
    }

    handleMarkAllAsRead() {
        if (this.props.onMarkAllAsRead()) {
            this.props.markAllNotificationsAsRead();
        }
    }

    render() {
        const styles = {
            menuButton: {
                padding: '0',
                width: '20px',
                height: 'auto',
                verticalAlign: 'middle',
            },
            menuButtonIcon: {
                color: '#337ab7',
            },
            markAllAsRead: {
                color: '#337ab7',
                textAlign: 'center',
            }
        };

        let showMarkAsRead = false;
        let showMarkAsUnread = false;
        const selectedNotificationsKeys = Object.keys(this.props.selectedNotifications);
        for (let uid of selectedNotificationsKeys) {
            const notification = this.props.selectedNotifications[uid];
            if (notification.unread) {
                showMarkAsRead = true;
            } else {
                showMarkAsUnread = true;
            }

            if (showMarkAsUnread && showMarkAsRead) {
                break;
            }
        }

        return (
            <IconMenu
                style={this.props.style}
                iconButtonElement={
                    <IconButton
                        style={styles.menuButton}
                        iconStyle={styles.menuButtonIcon}
                    >
                        <MoreHorizIcon />
                    </IconButton>}
                anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
                targetOrigin={{ horizontal: 'left', vertical: 'top' }}
            >
                {showMarkAsRead ?
                    <MenuItem
                        className={'qa-NotificationsTableMenu-MarkAsRead'}
                        primaryText="Mark As Read"
                        leftIcon={<FlagIcon />}
                        onClick={this.handleMarkAsRead}
                    />
                    :
                    null
                }
                {showMarkAsUnread ?
                    <MenuItem
                        className={'qa-NotificationsTableMenu-MarkAsUnread'}
                        primaryText="Mark As Unread"
                        leftIcon={<FlagIcon/>}
                        onClick={this.handleMarkAsUnread}
                    />
                    :
                    null
                }
                {(selectedNotificationsKeys.length > 0) ?
                    <MenuItem
                        className={'qa-NotificationsTableMenu-Remove'}
                        primaryText="Remove"
                        leftIcon={<CloseIcon />}
                        onClick={this.handleRemove}
                    />
                    :
                    null
                }
                {(selectedNotificationsKeys.length > 0) ?
                    <Divider />
                    :
                    null
                }
                <MenuItem
                    className={'qa-NotificationsTableMenu-MarkAllAsRead'}
                    style={styles.markAllAsRead}
                    primaryText="Mark All As Read"
                    onClick={this.handleMarkAllAsRead}
                />
            </IconMenu>
        );
    }
}

NotificationsTableMenu.propTypes = {
    style: PropTypes.object,
    selectedNotifications: PropTypes.object.isRequired,
    onMarkAsRead: PropTypes.func,
    onMarkAsUnread: PropTypes.func,
    onRemove: PropTypes.func,
    onMarkAllAsRead: PropTypes.func,
};

NotificationsTableMenu.defaultProps = {
    style: {},
    onMarkAsRead: () => { return true; },
    onMarkAsUnread: () => { return true; },
    onRemove: () => { return true; },
    onMarkAllAsRead: () => { return true; },
};

function mapDispatchToProps(dispatch) {
    return {
        markNotificationsAsRead: (notifications) => dispatch(markNotificationsAsRead(notifications)),
        markNotificationsAsUnread: (notifications) => dispatch(markNotificationsAsUnread(notifications)),
        removeNotifications: (notifications) => dispatch(removeNotifications(notifications)),
        markAllNotificationsAsRead: () => dispatch(markAllNotificationsAsRead()),
    };
}

export default connect(
    null,
    mapDispatchToProps,
)(NotificationsTableMenu);
