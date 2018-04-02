import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import {
    Checkbox, FlatButton, Table, TableBody, TableHeader, TableHeaderColumn, TableRow,
    TableRowColumn
} from 'material-ui';
import OpenInNewIcon from 'material-ui/svg-icons/action/open-in-new';
import FlagIcon from 'material-ui/svg-icons/content/flag';
import CloseIcon from 'material-ui/svg-icons/navigation/close';
import MoreHorizIcon from 'material-ui/svg-icons/navigation/more-horiz'
import IndeterminateCheckboxIcon from '../icons/IndeterminateIcon';
import CheckboxIcon from 'material-ui/svg-icons/toggle/check-box';
import values from 'lodash/values';
import { getNotificationIcon, getNotificationMessage, getNotificationViewUrl } from '../../utils/notificationUtils';
import moment from 'moment';
import { NotificationMenu } from './NotificationMenu';
import { markNotificationsAsRead, markNotificationsAsUnread, removeNotifications } from '../../actions/notificationsActions';

export class NotificationTable extends React.Component {
    constructor(props) {
        super(props);
        this.getSelectedCount = this.getSelectedCount.bind(this);
        this.setSelected = this.setSelected.bind(this);
        this.handleSelectAllCheck = this.handleSelectAllCheck.bind(this);
        this.getSelectAllCheckedIcon = this.getSelectAllCheckedIcon.bind(this);
        this.handleMarkAsRead = this.handleMarkAsRead.bind(this);
        this.handleMarkAsUnread = this.handleMarkAsUnread.bind(this);
        this.handleRemove = this.handleRemove.bind(this);
        this.handleView = this.handleView.bind(this);
        this.handleMultiMarkAsRead = this.handleMultiMarkAsRead.bind(this);
        this.handleMultiMarkAsUnread = this.handleMultiMarkAsUnread.bind(this);
        this.getMultiMarkAsReadFunc = this.getMultiMarkAsReadFunc.bind(this);
        this.getMultiMarkAsUnreadFunc = this.getMultiMarkAsUnreadFunc.bind(this);
        this.state = {
            selected: {},
        };
    }

    isSameOrderType(unknown, known) {
        return unknown.replace(/-/, '') === known.replace(/-/, '');
    }

    getHeaderStyle(isActive) {
        return isActive ? {color: '#000', fontWeight: 'bold'} : {color: 'inherit'};
    }

    getSelectedCount() {
        return Object.keys(this.state.selected).length;
    }

    setSelected(notification, isSelected) {
        const selected = { ...this.state.selected };
        if (isSelected) {
            selected[notification.uid] = notification;
        } else {
            delete selected[notification.uid];
        }

        this.setState({ selected });
    }

    handleSelectAllCheck() {
        let selected = { ...this.state.selected };
        if (this.getSelectedCount() === 0) {
            this.props.notifications.notifications.map((notification) => {
                selected[notification.uid] = notification;
            });
        } else {
            selected = {};
        }

        this.setState({ selected });
    }

    getSelectAllCheckedIcon() {
        if (this.getSelectedCount() === this.props.notifications.notifications.length) {
            return <CheckboxIcon />;
        } else {
            return <IndeterminateCheckboxIcon />;
        }
    }

    handleMarkAsRead(notification) {
        this.props.markNotificationsAsRead([notification]);
        this.props.onMarkAsRead([notification]);
    }

    handleMarkAsUnread(notification) {
        this.props.markNotificationsAsUnread([notification]);
        this.props.onMarkAsUnread([notification]);
    }

    handleRemove(notification) {
        this.props.removeNotifications([notification]);
        this.props.onRemove([notification]);
    }

    handleView(notification) {
        // Allow the parent component the opportunity to stop or handle navigation.
        if (this.props.onView(notification)) {
            this.props.router.push(getNotificationViewUrl(notification));
        }
    }

    handleMultiMarkAsRead() {
        const notifications = values(this.state.selected);
        this.props.markNotificationsAsRead(notifications);
        this.props.onMarkAsRead(notifications);
    }

    handleMultiMarkAsUnread() {
        const notifications = values(this.state.selected);
        this.props.markNotificationsAsUnread(notifications);
        this.props.onMarkAsUnread(notifications);
    }

    getMultiMarkAsReadFunc() {
        for (let uid of Object.keys(this.state.selected)) {
            const notification = this.state.selected[uid];
            if (!notification.read) {
                return this.handleMultiMarkAsRead;
            }
        }

        return null;
    }

    getMultiMarkAsUnreadFunc() {
        for (let uid of Object.keys(this.state.selected)) {
            const notification = this.state.selected[uid];
            if (notification.read) {
                return this.handleMultiMarkAsUnread;
            }
        }

        return null;
    }

    render() {
        const spacing = window.innerWidth > 575 ? '10px' : '2px';
        let styles = {
            root: {
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginLeft: spacing,
                marginRight: spacing,
                paddingBottom: spacing,
            },
            tableHeader: {
                height: '50px',
            },
            tableRow: {
                transition: 'background-color 0.25s',
            },
            tableHeaderColumn: {
                padding: '0 10px',
                textAlign: 'left',
            },
            tableRowColumn: {
                padding: '0 10px',
                color: 'rgba(0, 0, 0, 0.54)',
                fontSize: '18px',
            },
            contentHeaderColumnWrapper: {
                display: 'flex',
                alignItems: 'center',
                height: '100%'
            },
            multiMenu: {
                marginLeft: '6px',
                position: 'relative',
                top: '1px',
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
            clickable: {
                cursor: 'pointer',
                width: 'min-content',
            },
            unread: {
                backgroundColor: '#D5E6F1',
            },
        };

        styles = {
            ...styles,
            checkboxHeaderColumn: {
                ...styles.tableHeaderColumn,
                width: '45px',
            },
            contentHeaderColumn: {
                ...styles.tableHeaderColumn,
                fontWeight: 'bold',
            },
            dateHeaderColumn: {
                ...styles.tableHeaderColumn,
                textAlign: 'center',
                width: (window.innerWidth > 768) ? '200px' : '150px',
            },
            optionsHeaderColumn: {
                ...styles.tableHeaderColumn,
                textAlign: (window.innerWidth > 1280) ? 'center' : 'right',
                width: (window.innerWidth > 1600) ? '600px' :
                       (window.innerWidth > 1280) ? '435px' : '60px',
            },
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
                width: (window.innerWidth > 1600) ? '600px' :
                       (window.innerWidth > 1280) ? '435px' : '60px',
            },
        };

        return (
            <div style={styles.root}>
                <Table selectable={false}>
                    <TableHeader
                        style={styles.tableHeader}
                        displaySelectAll={false}
                        adjustForCheckbox={false}
                    >
                        <TableRow>
                            <TableHeaderColumn
                                className="qa-NotificationTable-TableHeaderColumn-Checkbox"
                                style={styles.checkboxHeaderColumn}
                            >
                                <Checkbox
                                    checked={this.getSelectedCount() > 0}
                                    checkedIcon={this.getSelectAllCheckedIcon()}
                                    onCheck={this.handleSelectAllCheck}
                                    disableTouchRipple={true}
                                />
                            </TableHeaderColumn>
                            <TableHeaderColumn
                                className="qa-NotificationTable-TableHeaderColumn-Content"
                                style={styles.contentHeaderColumn}
                            >
                                <div style={styles.contentHeaderColumnWrapper}>
                                    <span>{this.getSelectedCount()} Selected</span>
                                    {this.getSelectedCount() > 0 ?
                                        <NotificationMenu
                                            style={styles.multiMenu}
                                            onMarkAsRead={this.getMultiMarkAsReadFunc()}
                                            onMarkAsUnread={this.getMultiMarkAsUnreadFunc()}
                                            onRemove={this.handleRemove}
                                            icon={<MoreHorizIcon />}
                                            anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
                                            targetOrigin={{ horizontal: 'left', vertical: 'top' }}
                                        />
                                        :
                                        null
                                    }
                                </div>
                            </TableHeaderColumn>
                            <TableHeaderColumn
                                className="qa-NotificationTable-TableHeaderColumn-Date"
                                style={styles.dateHeaderColumn}
                            >
                                <span
                                    style={{
                                        ...styles.clickable,
                                        ...this.getHeaderStyle(this.isSameOrderType(this.props.order, 'notification__date')),
                                        marginRight: '40px',
                                    }}
                                >
                                    Date
                                </span>
                            </TableHeaderColumn>
                            <TableHeaderColumn
                                className="qa-NotificationTable-TableHeaderColumn-Options"
                                style={styles.optionsHeaderColumn}
                            >
                                Options
                            </TableHeaderColumn>
                        </TableRow>
                    </TableHeader>
                    <TableBody displayRowCheckbox={false}>
                        {this.props.notifications.notifications.map((notification) => {
                            const icon = getNotificationIcon({ notification });
                            const message = getNotificationMessage({ notification });
                            return (
                                <TableRow
                                    key={`${notification.uid}-TableRow`}
                                    style={{
                                        ...styles.tableRow,
                                        backgroundColor: (notification.read) ? 'white' : '#d5e6f1',
                                    }}
                                >
                                    <TableRowColumn
                                        className="qa-NotificationTable-Checkbox"
                                        style={styles.checkboxRowColumn}
                                    >
                                        <Checkbox
                                            checked={!!this.state.selected[notification.uid]}
                                            onCheck={(e, isChecked) => this.setSelected(notification, isChecked)}
                                            disableTouchRipple={true}
                                        />
                                    </TableRowColumn>
                                    <TableRowColumn
                                        className="qa-NotificationTable-Content"
                                        style={styles.contentRowColumn}
                                    >
                                        <div style={{display: 'flex', alignItems: 'center', width: '100%'}}>
                                            {icon}
                                            {message}
                                        </div>
                                    </TableRowColumn>
                                    <TableRowColumn
                                        className="qa-NotificationTable-Date"
                                        style={styles.dateRowColumn}
                                    >
                                        <div style={{ display: 'inline-block', width: '75px', textAlign: 'right' }}>
                                            {moment(notification.date).format('M/D/YY')}
                                        </div>
                                        <div style={{ display: 'inline-block', width: '75px', textAlign: 'right' }}>
                                            {moment(notification.date).format('h:mma')}
                                        </div>
                                    </TableRowColumn>
                                    <TableRowColumn
                                        className="qa-NotificationTable-TableRowColumn-Options"
                                        style={styles.optionsRowColumn}
                                    >
                                        <div style={styles.optionsButtonsContainer}>
                                            {(window.innerWidth > 1280) ?
                                                <div style={{ display: 'flex', flex: '1' }}>
                                                    <div style={{ flex: '1', textAlign: 'right', marginRight: '6px', boxSizing: 'border-box' }}>
                                                        <FlatButton
                                                            label="View"
                                                            labelStyle={styles.optionButtonLabel}
                                                            icon={<OpenInNewIcon style={styles.optionButtonLabel} />}
                                                            hoverColor="rgba(0, 0, 0, 0)"
                                                            disableTouchRipple={true}
                                                            onClick={() => this.handleView(notification)}
                                                        />
                                                    </div>
                                                    <div style={{ flex: '0 1 180px', textAlign: 'center', margin: '0 6px', boxSizing: 'border-box' }}>
                                                        {notification.read ?
                                                            <FlatButton
                                                                label="Mark As Unread"
                                                                labelStyle={styles.optionButtonLabel}
                                                                icon={<FlagIcon style={styles.optionButtonLabel} />}
                                                                hoverColor="rgba(0, 0, 0, 0)"
                                                                disableTouchRipple={true}
                                                                onClick={() => this.handleMarkAsUnread(notification)}
                                                            />
                                                            :
                                                            <FlatButton
                                                                label="Mark As Read"
                                                                labelStyle={styles.optionButtonLabel}
                                                                icon={<FlagIcon style={styles.optionButtonLabel} />}
                                                                hoverColor="rgba(0, 0, 0, 0)"
                                                                disableTouchRipple={true}
                                                                onClick={() => this.handleMarkAsRead(notification)}
                                                            />
                                                        }
                                                    </div>
                                                    <div style={{ flex: '1', textAlign: 'left', marginLeft: '6px', boxSizing: 'border-box' }}>
                                                        <FlatButton
                                                            label="Remove"
                                                            labelStyle={styles.optionButtonLabel}
                                                            icon={<CloseIcon style={styles.optionButtonLabel} />}
                                                            hoverColor="rgba(0, 0, 0, 0)"
                                                            disableTouchRipple={true}
                                                            onClick={() => this.handleRemove(notification)}
                                                        />
                                                    </div>
                                                </div>
                                                :
                                                <NotificationMenu
                                                    onMarkAsRead={notification.read ? null : this.handleMarkAsRead}
                                                    onMarkAsUnread={notification.read ? this.handleMarkAsUnread : null}
                                                    onRemove={this.handleRemove}
                                                    onView={this.handleView}
                                                />
                                            }
                                        </div>
                                    </TableRowColumn>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        );
    }
}

NotificationTable.propTypes = {
    notifications: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
    onMarkAsRead: PropTypes.func,
    onMarkAsUnread: PropTypes.func,
    onRemove: PropTypes.func,
    onView: PropTypes.func,
};

NotificationTable.defaultProps = {
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
)(NotificationTable);
