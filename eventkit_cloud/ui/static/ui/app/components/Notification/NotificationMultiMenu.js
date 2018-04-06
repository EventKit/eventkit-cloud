import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { IconButton, IconMenu, MenuItem } from 'material-ui';
import MoreHorizIcon from 'material-ui/svg-icons/navigation/more-horiz'
import FlagIcon from 'material-ui/svg-icons/content/flag';
import CloseIcon from 'material-ui/svg-icons/navigation/close';
import values from 'lodash/values';
import {
    markNotificationsAsRead,
    markNotificationsAsUnread,
    removeNotifications
} from '../../actions/notificationsActions';

export class NotificationMultiMenu extends React.Component {
    constructor(props) {
        super(props);
        this.handleMarkAsRead = this.handleMarkAsRead.bind(this);
        this.handleMarkAsUnread = this.handleMarkAsUnread.bind(this);
        this.handleRemove = this.handleRemove.bind(this);
    }

    handleMarkAsRead() {
        this.props.markNotificationsAsRead(values(this.props.selectedNotifications));
        this.props.onMarkAsRead(values(this.props.selectedNotifications));
    }

    handleMarkAsUnread() {
        this.props.markNotificationsAsUnread(values(this.props.selectedNotifications));
        this.props.onMarkAsUnread(values(this.props.selectedNotifications));
    }

    handleRemove() {
        this.props.removeNotifications(values(this.props.selectedNotifications));
        this.props.onRemove(values(this.props.selectedNotifications));
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
                color: '#4598bf',
            },
        };

        let showMarkAsRead = false;
        let showMarkAsUnread = false;
        for (let uid of Object.keys(this.props.selectedNotifications)) {
            const notification = this.props.selectedNotifications[uid];
            if (notification.read) {
                showMarkAsUnread = true;
            } else {
                showMarkAsRead = true;
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
                {showMarkAsUnread ?
                    <MenuItem
                        style={styles.menuItem}
                        primaryText="Mark As Unread"
                        leftIcon={<FlagIcon/>}
                        onClick={this.handleMarkAsUnread}
                    />
                    :
                    null
                }
                {showMarkAsRead ?
                    <MenuItem
                        style={styles.menuItem}
                        primaryText="Mark As Read"
                        leftIcon={<FlagIcon />}
                        onClick={this.handleMarkAsRead}
                    />
                    :
                    null
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

NotificationMultiMenu.propTypes = {
    style: PropTypes.object,
    selectedNotifications: PropTypes.object.isRequired,
    onMarkAsRead: PropTypes.func,
    onMarkAsUnread: PropTypes.func,
    onRemove: PropTypes.func,
};

NotificationMultiMenu.defaultProps = {
    style: {},
    onMarkAsRead: () => {},
    onMarkAsUnread: () => {},
    onRemove: () => {},
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
)(NotificationMultiMenu);
