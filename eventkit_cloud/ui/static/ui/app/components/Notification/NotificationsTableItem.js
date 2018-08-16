import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Checkbox, FlatButton, TableRow, TableRowColumn } from 'material-ui';
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
            },
            tableRowColumn: {
                padding: '0 15px',
                color: 'rgba(0, 0, 0, 0.54)',
                fontSize: '18px',
            },
            optionsButtonsContainer: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: (window.innerWidth > 1280) ? 'center' : 'flex-end',
            },
            optionButtonLabel: {
                position: 'relative',
                top: '-2px',
                color: 'rgb(69, 152, 191)',
                fill: 'rgb(69, 152, 191)',
            },
            menuButton: {
                padding: '0',
                width: '20px',
                verticalAlign: 'middle',
            },
            menuButtonIcon: {
                color: '#4598bf',
            },
        };

        let optionsWidth = '60px';
        if (window.innerWidth > 1600) optionsWidth = '600px';
        else if (window.innerWidth > 1280) optionsWidth = '435px';

        styles = {
            ...styles,
            checkboxRowColumn: {
                ...styles.tableRowColumn,
                width: '45px',
            },
            contentRowColumn: {
                ...styles.tableRowColumn,
                display: 'flex',
                alignItems: 'center',
            },
            dateRowColumn: {
                ...styles.tableRowColumn,
                width: (window.innerWidth > 768) ? '200px' : '150px',
            },
            optionsRowColumn: {
                ...styles.tableRowColumn,
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
                <TableRowColumn
                    className="qa-NotificationsTableItem-TableRowColumn-Checkbox"
                    style={styles.checkboxRowColumn}
                >
                    <Checkbox
                        className="qa-NotificationsTableItem-Checkbox"
                        checked={this.props.isSelected}
                        onCheck={(e, isChecked) => this.props.setSelected(this.props.notification, isChecked)}
                        disableTouchRipple
                    />
                </TableRowColumn>
                <TableRowColumn
                    className="qa-NotificationsTableItem-TableRowColumn-Content"
                    style={styles.contentRowColumn}
                >
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        {icon}
                        {message}
                    </div>
                </TableRowColumn>
                <TableRowColumn
                    className="qa-NotificationsTableItem-TableRowColumn-Date"
                    style={styles.dateRowColumn}
                >
                    <div style={{ display: 'inline-block', width: '75px', textAlign: 'right' }}>
                        {moment(this.props.notification.timestamp).format('M/D/YY')}
                    </div>
                    <div style={{ display: 'inline-block', width: '75px', textAlign: 'right' }}>
                        {moment(this.props.notification.timestamp).format('h:mma')}
                    </div>
                </TableRowColumn>
                <TableRowColumn
                    className="qa-NotificationsTableItem-TableRowColumn-Options"
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
                                        <FlatButton
                                            className="qa-NotificationsTableItem-ActionButtons-View"
                                            label="View"
                                            labelStyle={styles.optionButtonLabel}
                                            icon={<OpenInNewIcon style={styles.optionButtonLabel} />}
                                            hoverColor="rgba(0, 0, 0, 0)"
                                            disableTouchRipple
                                            onClick={this.handleView}
                                        />
                                        :
                                        null
                                    }
                                </div>
                                <div style={{
                                    flex: '0 1 180px', textAlign: 'center', margin: '0 6px', boxSizing: 'border-box',
                                }}
                                >
                                    {this.props.notification.unread ?
                                        <FlatButton
                                            className="qa-NotificationsTableItem-ActionButtons-MarkAsRead"
                                            label="Mark As Read"
                                            labelStyle={styles.optionButtonLabel}
                                            icon={<FlagIcon style={styles.optionButtonLabel} />}
                                            hoverColor="rgba(0, 0, 0, 0)"
                                            disableTouchRipple
                                            onClick={this.handleMarkAsRead}
                                        />
                                        :
                                        <FlatButton
                                            className="qa-NotificationsTableItem-ActionButtons-MarkAsUnread"
                                            label="Mark As Unread"
                                            labelStyle={styles.optionButtonLabel}
                                            icon={<FlagIcon style={styles.optionButtonLabel} />}
                                            hoverColor="rgba(0, 0, 0, 0)"
                                            disableTouchRipple
                                            onClick={this.handleMarkAsUnread}
                                        />
                                    }
                                </div>
                                <div style={{
                                    flex: '1', textAlign: 'left', marginLeft: '6px', boxSizing: 'border-box',
                                }}
                                >
                                    <FlatButton
                                        className="qa-NotificationsTableItem-ActionButtons-Remove"
                                        label="Remove"
                                        labelStyle={styles.optionButtonLabel}
                                        icon={<CloseIcon style={styles.optionButtonLabel} />}
                                        hoverColor="rgba(0, 0, 0, 0)"
                                        disableTouchRipple
                                        onClick={this.handleRemove}
                                    />
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
                </TableRowColumn>
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
