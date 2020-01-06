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
import DeleteDialog from '../Dialog/DeleteNotificationsDialog';

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
        this.handleDialogOpen = this.handleDialogOpen.bind(this);
        this.handleDialogClose = this.handleDialogClose.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.handleSelection = this.handleSelection.bind(this);
        this.state = {
            deleteAll: 'false',
            showRemoveDialog: false,
        };
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
        if (this.props.allSelected && !this.state.showRemoveDialog) {
            this.handleDialogOpen();
        } else if (this.props.onRemove(values(this.props.selectedNotifications))) {
            if (this.state.deleteAll === 'true') {
                // user has opted to delete ALL notifications not just current page
                this.props.removeNotifications();
            } else {
                // delete only wants to delete selected notifications
                this.props.removeNotifications(values(this.props.selectedNotifications));
            }
        }
    }

    handleMarkAllAsRead() {
        if (this.props.onMarkAllAsRead()) {
            this.props.markAllNotificationsAsRead();
        }
    }

    handleDialogOpen() {
        this.setState({ showRemoveDialog: true });
    }

    handleDialogClose() {
        this.setState({ showRemoveDialog: false });
    }

    handleDelete() {
        this.handleRemove();
        this.handleDialogClose();
    }

    handleSelection(e) {
        this.setState({ deleteAll: e.target.value });
    }

    render() {
        const { colors } = this.props.theme.eventkit;

        const styles = {
            icon: {
                color: colors.text_primary,
                marginRight: '5px',
            },
            item: {
                color: colors.text_primary,
                fontSize: '14px',
            },
            markAllAsRead: {
                color: colors.primary,
                fontSize: '15px',
                textAlign: 'center',
            },
            menuButton: {
                height: 'auto',
                padding: '0',
                verticalAlign: 'middle',
                width: '20px',
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
            <React.Fragment>
                <IconMenu
                    style={{ transform: 'rotate(90deg)' }}
                    anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
                    transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                >
                    {showMarkAsRead
                        ? (
                            <MenuItem
                                key="markRead"
                                className="qa-NotificationsTableMenu-MarkAsRead"
                                style={styles.item}
                                onClick={this.handleMarkAsRead}
                            >
                                <FlagIcon style={styles.icon} />
                            Mark As Read
                            </MenuItem>
                        )
                        : null
                    }
                    {showMarkAsUnread
                        ? (
                            <MenuItem
                                key="markUnread"
                                className="qa-NotificationsTableMenu-MarkAsUnread"
                                style={styles.item}
                                onClick={this.handleMarkAsUnread}
                            >
                                <FlagIcon style={styles.icon} />
                            Mark As Unread
                            </MenuItem>
                        )
                        : null
                    }
                    {(selectedNotificationsKeys.length > 0)
                        ? (
                            <MenuItem
                                key="remove"
                                className="qa-NotificationsTableMenu-Remove"
                                style={styles.item}
                                onClick={this.handleRemove}
                            >
                                <CloseIcon style={styles.icon} />
                            Remove
                            </MenuItem>
                        )
                        : null
                    }
                    {(selectedNotificationsKeys.length > 0)
                        ? <Divider key="divider" />
                        : null
                    }
                    <MenuItem
                        key="markAll"
                        className="qa-NotificationsTableMenu-MarkAllAsRead"
                        onClick={this.handleMarkAllAsRead}
                        style={styles.markAllAsRead}
                    >
                        Mark All As Read
                    </MenuItem>
                </IconMenu>
                <DeleteDialog
                    show={this.state.showRemoveDialog}
                    onDelete={this.handleDelete}
                    onCancel={this.handleDialogClose}
                    deleteAll={this.state.deleteAll}
                    onSelectionChange={this.handleSelection}
                />
            </React.Fragment>
        );
    }
}

NotificationsTableMenu.propTypes = {
    allSelected: PropTypes.bool.isRequired,
    markAllNotificationsAsRead: PropTypes.func.isRequired,
    markNotificationsAsRead: PropTypes.func.isRequired,
    markNotificationsAsUnread: PropTypes.func.isRequired,
    onMarkAllAsRead: PropTypes.func,
    onMarkAsRead: PropTypes.func,
    onMarkAsUnread: PropTypes.func,
    onRemove: PropTypes.func,
    removeNotifications: PropTypes.func.isRequired,
    selectedNotifications: PropTypes.object.isRequired,
    theme: PropTypes.object.isRequired,
};

NotificationsTableMenu.defaultProps = {
    onMarkAllAsRead: () => true,
    onMarkAsRead: () => true,
    onMarkAsUnread: () => true,
    onRemove: () => true,
};

function mapDispatchToProps(dispatch) {
    return {
        markAllNotificationsAsRead: () => dispatch(markAllNotificationsAsRead()),
        markNotificationsAsRead: notifications => dispatch(markNotificationsAsRead(notifications)),
        markNotificationsAsUnread: notifications => dispatch(markNotificationsAsUnread(notifications)),
        removeNotifications: notifications => dispatch(removeNotifications(notifications)),
    };
}

export default withTheme()(connect(
    null,
    mapDispatchToProps,
)(NotificationsTableMenu));
