import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { withTheme } from '@material-ui/core/styles';
import Divider from '@material-ui/core/Divider';
import MenuItem from '@material-ui/core/MenuItem';
import FlagIcon from '@material-ui/icons/Flag';
import CloseIcon from '@material-ui/icons/Close';
import values from 'lodash/values';
import IconMenu from '../common/IconMenu';
import {
    markAllNotificationsAsRead,
    markNotificationsAsRead,
    markNotificationsAsUnread,
    removeNotifications,
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
        const { colors } = this.props.theme.eventkit;

        const styles = {
            menuButton: {
                padding: '0',
                width: '20px',
                height: 'auto',
                verticalAlign: 'middle',
            },
            item: {
                fontSize: '14px',
                color: colors.text_primary,
            },
            icon: {
                color: colors.text_primary,
                marginRight: '5px',
            },
            markAllAsRead: {
                fontSize: '15px',
                color: colors.primary,
                textAlign: 'center',
            },
        };

        let showMarkAsRead = false;
        let showMarkAsUnread = false;
        const selectedNotificationsKeys = Object.keys(this.props.selectedNotifications);
        selectedNotificationsKeys.every((uid) => {
            const notification = this.props.selectedNotifications[uid];
            if (notification.unread) {
                showMarkAsRead = true;
            } else {
                showMarkAsUnread = true;
            }

            if (showMarkAsUnread && showMarkAsRead) {
                return false;
            }
            return true;
        });

        return (
            <IconMenu
                style={{ transform: 'rotate(90deg)' }}
                anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
                transformOrigin={{ horizontal: 'left', vertical: 'top' }}
            >
                {showMarkAsRead ?
                    <MenuItem
                        className="qa-NotificationsTableMenu-MarkAsRead"
                        style={styles.item}
                        onClick={this.handleMarkAsRead}
                    >
                        <FlagIcon style={styles.icon} />
                        Mark As Read
                    </MenuItem>
                    :
                    null
                }
                {showMarkAsUnread ?
                    <MenuItem
                        className="qa-NotificationsTableMenu-MarkAsUnread"
                        style={styles.item}
                        onClick={this.handleMarkAsUnread}
                    >
                        <FlagIcon style={styles.icon} />
                        Mark As Unread
                    </MenuItem>
                    :
                    null
                }
                {(selectedNotificationsKeys.length > 0) ?
                    <MenuItem
                        className="qa-NotificationsTableMenu-Remove"
                        style={styles.item}
                        onClick={this.handleRemove}
                    >
                        <CloseIcon style={styles.icon} />
                        Remove
                    </MenuItem>
                    :
                    null
                }
                {(selectedNotificationsKeys.length > 0) ?
                    <Divider />
                    :
                    null
                }
                <MenuItem
                    className="qa-NotificationsTableMenu-MarkAllAsRead"
                    onClick={this.handleMarkAllAsRead}
                    style={styles.markAllAsRead}
                >
                    Mark All As Read
                </MenuItem>
            </IconMenu>
        );
    }
}

NotificationsTableMenu.propTypes = {
    selectedNotifications: PropTypes.object.isRequired,
    onMarkAsRead: PropTypes.func,
    onMarkAsUnread: PropTypes.func,
    onRemove: PropTypes.func,
    onMarkAllAsRead: PropTypes.func,
    markNotificationsAsRead: PropTypes.func.isRequired,
    markNotificationsAsUnread: PropTypes.func.isRequired,
    removeNotifications: PropTypes.func.isRequired,
    markAllNotificationsAsRead: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired,
};

NotificationsTableMenu.defaultProps = {
    onMarkAsRead: () => true,
    onMarkAsUnread: () => true,
    onRemove: () => true,
    onMarkAllAsRead: () => true,
};

function mapDispatchToProps(dispatch) {
    return {
        markNotificationsAsRead: notifications => dispatch(markNotificationsAsRead(notifications)),
        markNotificationsAsUnread: notifications => dispatch(markNotificationsAsUnread(notifications)),
        removeNotifications: notifications => dispatch(removeNotifications(notifications)),
        markAllNotificationsAsRead: () => dispatch(markAllNotificationsAsRead()),
    };
}

export default withTheme()(connect(
    null,
    mapDispatchToProps,
)(NotificationsTableMenu));
