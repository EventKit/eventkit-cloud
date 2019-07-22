import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { withTheme } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import Checkbox from '@material-ui/core/Checkbox';
import ButtonBase from '@material-ui/core/ButtonBase';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import FlagIcon from '@material-ui/icons/Flag';
import CloseIcon from '@material-ui/icons/Close';
import moment from 'moment';
import { getNotificationViewPath } from '../../utils/notificationUtils';
import { markNotificationsAsRead, markNotificationsAsUnread, removeNotifications } from '../../actions/notificationsActions';
import NotificationMenu from './NotificationMenu';
import NotificationIcon from './NotificationIcon';
import NotificationMessage from './NotificationMessage';

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
            this.props.history.push(path);
            this.props.markNotificationsAsRead([this.props.notification]);
        }
    }

    render() {
        const { colors } = this.props.theme.eventkit;
        const { width } = this.props;

        let styles = {
            tableRow: {
                transition: 'background-color 0.25s',
                borderBottom: `1px solid ${colors.secondary_dark}`,
            },
            cell: {
                padding: '0 15px',
                color: colors.text_primary,
                fontSize: '16px',
                height: '48px',
                borderBottom: 'none',
            },
            optionsButtonsContainer: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: isWidthUp('xl', width) ? 'center' : 'flex-end',
            },
            button: {
                fontSize: '14px',
                color: colors.primary,
                textTransform: 'uppercase',
            },
            optionButtonLabel: {
                marginRight: '5px',
            },
        };

        let optionsWidth = '60px';
        if (isWidthUp('xl', width)) optionsWidth = '435px';

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
                width: isWidthUp('md') ? '200px' : '150px',
            },
            optionsRowColumn: {
                ...styles.cell,
                width: optionsWidth,
            },
        };

        const viewPath = getNotificationViewPath(this.props.notification);

        return (
            <TableRow
                style={{
                    ...styles.tableRow,
                    backgroundColor: (this.props.notification.unread) ? colors.selected_primary : colors.white,
                }}
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
                        <NotificationIcon notification={this.props.notification} />
                        <NotificationMessage notification={this.props.notification} />
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
                        {(isWidthUp('xl', width))
                            ? (
                                <div
                                    className="qa-NotificationsTableItem-ActionButtons"
                                    style={{ display: 'flex', flex: '1' }}
                                >
                                    <div style={{
                                        flex: '1', textAlign: 'right', marginRight: '6px', boxSizing: 'border-box',
                                    }}
                                    >
                                        {viewPath
                                            ? (
                                                <ButtonBase
                                                    className="qa-NotificationsTableItem-ActionButtons-View"
                                                    style={styles.button}
                                                    onClick={this.handleView}
                                                >
                                                    <OpenInNewIcon style={styles.optionButtonLabel} color="primary" />
                                            View
                                                </ButtonBase>
                                            )
                                            : null
                                        }
                                    </div>
                                    <div style={{
                                        flex: '0 1 180px', textAlign: 'center', margin: '0 6px', boxSizing: 'border-box',
                                    }}
                                    >
                                        {this.props.notification.unread
                                            ? (
                                                <ButtonBase
                                                    className="qa-NotificationsTableItem-ActionButtons-MarkAsRead"
                                                    style={styles.button}
                                                    onClick={this.handleMarkAsRead}
                                                >
                                                    <FlagIcon style={styles.optionButtonLabel} color="primary" />
                                            Mark As Read
                                                </ButtonBase>
                                            )
                                            : (
                                                <ButtonBase
                                                    className="qa-NotificationsTableItem-ActionButtons-MarkAsUnread"
                                                    style={styles.button}
                                                    onClick={this.handleMarkAsUnread}
                                                >
                                                    <FlagIcon style={styles.optionButtonLabel} color="primary" />
                                            Mark As Unread
                                                </ButtonBase>
                                            )
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
                            )
                            : (
                                <NotificationMenu
                                    className="qa-NotificationsTableItem-ActionMenu"
                                    notification={this.props.notification}
                                    history={this.props.history}
                                    onMarkAsRead={this.props.onMarkAsRead}
                                    onMarkAsUnread={this.props.onMarkAsUnread}
                                    onRemove={this.props.onRemove}
                                    onView={this.props.onView}
                                />
                            )
                        }
                    </div>
                </TableCell>
            </TableRow>
        );
    }
}

NotificationsTableItem.propTypes = {
    notification: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    isSelected: PropTypes.bool.isRequired,
    setSelected: PropTypes.func.isRequired,
    onMarkAsRead: PropTypes.func,
    onMarkAsUnread: PropTypes.func,
    onRemove: PropTypes.func,
    onView: PropTypes.func,
    markNotificationsAsRead: PropTypes.func.isRequired,
    markNotificationsAsUnread: PropTypes.func.isRequired,
    removeNotifications: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired,
    width: PropTypes.string.isRequired,
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

export default
@withWidth()
@withTheme()
@connect(null, mapDispatchToProps)
class Default extends NotificationsTableItem {}
