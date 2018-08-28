import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import Checkbox from '@material-ui/core/Checkbox';
import ButtonBase from '@material-ui/core/ButtonBase';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import FlagIcon from '@material-ui/icons/Flag';
import CloseIcon from '@material-ui/icons/Close';
import moment from 'moment';
import { getNotificationIcon, getNotificationMessage, getNotificationViewPath } from '../../utils/notificationUtils';
import { markNotificationsAsRead, markNotificationsAsUnread, removeNotifications } from '../../actions/notificationsActions';
import NotificationMenu from './NotificationMenu';

export class NotificationsTableItem extends React.Component {
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
            this.props.router.push(path);
            this.props.markNotificationsAsRead([this.props.notification]);
        }
    }

    render() {
        let styles = {
            tableRow: {
                transition: 'background-color 0.25s',
                borderBottom: '1px solid #e0e0e0',
            },
            cell: {
                padding: '0 15px',
                color: 'rgba(0, 0, 0, 0.54)',
                fontSize: '18px',
                height: '48px',
                borderBottom: 'none',
            },
            optionsButtonsContainer: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: (window.innerWidth > 1280) ? 'center' : 'flex-end',
            },
            button: {
                fontSize: '14px',
                color: '#4598bf',
                textTransform: 'uppercase',
            },
            optionButtonLabel: {
                marginRight: '5px',
            },
        };

        let optionsWidth = '60px';
        if (window.innerWidth > 1600) optionsWidth = '600px';
        else if (window.innerWidth > 1280) optionsWidth = '435px';

        styles = {
            ...styles,
            checkboxRowColumn: {
                ...styles.cell,
                width: '54px',
            },
            contentRowColumn: {
                ...styles.cell,
                display: 'flex',
                alignItems: 'center',
            },
            dateRowColumn: {
                ...styles.cell,
                width: (window.innerWidth > 768) ? '200px' : '150px',
            },
            optionsRowColumn: {
                ...styles.cell,
                width: optionsWidth,
            },
        };

        const icon = getNotificationIcon({ notification: this.props.notification });
        const message = getNotificationMessage({ notification: this.props.notification });
        const viewPath = getNotificationViewPath(this.props.notification);

        return (
            <TableRow
                style={{
                    ...styles.tableRow,
                    backgroundColor: (this.props.notification.unread) ? '#d5e6f1' : 'white',
                }}
                selectable={false}
            >
                <TableCell
                    className="qa-NotificationsTableItem-TableCell-Checkbox"
                    style={styles.checkboxRowColumn}
                >
                    <Checkbox
                        className="qa-NotificationsTableItem-Checkbox"
                        color="primary"
                        style={{ width: '24px', height: '24px' }}
                        checked={this.props.isSelected}
                        onChange={(e, isChecked) => this.props.setSelected(this.props.notification, isChecked)}
                    />
                </TableCell>
                <TableCell
                    className="qa-NotificationsTableItem-TableCell-Content"
                    style={styles.contentRowColumn}
                >
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        {icon}
                        {message}
                    </div>
                </TableCell>
                <TableCell
                    className="qa-NotificationsTableItem-TableCell-Date"
                    style={styles.dateRowColumn}
                >
                    <div style={{ display: 'inline-block', width: '75px', textAlign: 'right' }}>
                        {moment(this.props.notification.timestamp).format('M/D/YY')}
                    </div>
                    <div style={{ display: 'inline-block', width: '75px', textAlign: 'right' }}>
                        {moment(this.props.notification.timestamp).format('h:mma')}
                    </div>
                </TableCell>
                <TableCell
                    className="qa-NotificationsTableItem-TableCell-Options"
                    style={styles.optionsRowColumn}
                >
                    <div style={styles.optionsButtonsContainer}>
                        {(window.innerWidth > 1280) ?
                            <div
                                className="qa-NotificationsTableItem-ActionButtons"
                                style={{ display: 'flex', flex: '1' }}
                            >
                                <div style={{
                                    flex: '1', textAlign: 'right', marginRight: '6px', boxSizing: 'border-box',
                                }}
                                >
                                    {viewPath ?
                                        <ButtonBase
                                            className="qa-NotificationsTableItem-ActionButtons-View"
                                            style={styles.button}
                                            onClick={this.handleView}
                                        >
                                            <OpenInNewIcon style={styles.optionButtonLabel} color="primary" />
                                            View
                                        </ButtonBase>
                                        :
                                        null
                                    }
                                </div>
                                <div style={{
                                    flex: '0 1 180px', textAlign: 'center', margin: '0 6px', boxSizing: 'border-box',
                                }}
                                >
                                    {this.props.notification.unread ?
                                        <ButtonBase
                                            className="qa-NotificationsTableItem-ActionButtons-MarkAsRead"
                                            style={styles.button}
                                            onClick={this.handleMarkAsRead}
                                        >
                                            <FlagIcon style={styles.optionButtonLabel} color="primary" />
                                            Mark As Read
                                        </ButtonBase>
                                        :
                                        <ButtonBase
                                            className="qa-NotificationsTableItem-ActionButtons-MarkAsUnread"
                                            style={styles.button}
                                            onClick={this.handleMarkAsUnread}
                                        >
                                            <FlagIcon style={styles.optionButtonLabel} color="primary" />
                                            Mark As Unread
                                        </ButtonBase>
                                    }
                                </div>
                                <div style={{
                                    flex: '1', textAlign: 'left', marginLeft: '6px', boxSizing: 'border-box',
                                }}
                                >
                                    <ButtonBase
                                        className="qa-NotificationsTableItem-ActionButtons-Remove"
                                        style={styles.button}
                                        onClick={this.handleRemove}
                                    >
                                        <CloseIcon style={styles.optionButtonLabel} color="primary" />
                                        Remove
                                    </ButtonBase>
                                </div>
                            </div>
                            :
                            <NotificationMenu
                                className="qa-NotificationsTableItem-ActionMenu"
                                notification={this.props.notification}
                                router={this.props.router}
                                onMarkAsRead={this.props.onMarkAsRead}
                                onMarkAsUnread={this.props.onMarkAsUnread}
                                onRemove={this.props.onRemove}
                                onView={this.props.onView}
                            />
                        }
                    </div>
                </TableCell>
            </TableRow>
        );
    }
}

NotificationsTableItem.propTypes = {
    notification: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
    isSelected: PropTypes.bool.isRequired,
    setSelected: PropTypes.func.isRequired,
    onMarkAsRead: PropTypes.func,
    onMarkAsUnread: PropTypes.func,
    onRemove: PropTypes.func,
    onView: PropTypes.func,
    markNotificationsAsRead: PropTypes.func.isRequired,
    markNotificationsAsUnread: PropTypes.func.isRequired,
    removeNotifications: PropTypes.func.isRequired,
};

NotificationsTableItem.defaultProps = {
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

export default connect(
    null,
    mapDispatchToProps,
)(NotificationsTableItem);
