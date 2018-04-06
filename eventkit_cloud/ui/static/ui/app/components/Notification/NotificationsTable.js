import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import {
    Checkbox, FlatButton, Table, TableBody, TableHeader, TableHeaderColumn, TableRow,
    TableRowColumn
} from 'material-ui';
import OpenInNewIcon from 'material-ui/svg-icons/action/open-in-new';
import FlagIcon from 'material-ui/svg-icons/content/flag';
import CloseIcon from 'material-ui/svg-icons/navigation/close';
import CheckboxIcon from 'material-ui/svg-icons/toggle/check-box';
import moment from 'moment';
import IndeterminateCheckboxIcon from '../icons/IndeterminateIcon';
import { getNotificationIcon, getNotificationMessage, getNotificationViewPath } from '../../utils/notificationUtils';
import { markNotificationsAsRead, markNotificationsAsUnread, removeNotifications } from '../../actions/notificationsActions';
import NotificationMenu from './NotificationMenu';
import NotificationMultiMenu from './NotificationMultiMenu';

export class NotificationsTable extends React.Component {
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
        this.state = {
            selected: {},
        };
    }

    componentWillReceiveProps(nextProps) {
        if(nextProps.notifications !== this.props.notifications) {
            // Make sure to deselect any notifications that have been removed. Handle it here instead of
            // the standard callback in case it was removed by the notifications dropdown.
            const selected = { ...this.state.selected };
            for (let uid of Object.keys(selected)) {
                if (!nextProps.notifications.notifications[uid]) {
                    delete selected[uid];
                }
            }

            this.setState({ selected });
        }
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
            this.props.notifications.notificationsSorted.map((notification) => {
                selected[notification.uid] = notification;
            });
        } else {
            selected = {};
        }

        this.setState({ selected });
    }

    getSelectAllCheckedIcon() {
        if (this.getSelectedCount() === this.props.notifications.notificationsSorted.length) {
            return <CheckboxIcon />;
        } else {
            return <IndeterminateCheckboxIcon />;
        }
    }

    handleMarkAsRead(notification) {
        this.props.markNotificationsAsRead([notification]);
        this.props.onMarkAsRead(notification);
    }

    handleMarkAsUnread(notification) {
        this.props.markNotificationsAsUnread([notification]);
        this.props.onMarkAsUnread(notification);
    }

    handleRemove(notification) {
        this.props.removeNotifications([notification]);
        this.props.onRemove(notification);
    }

    handleView(notification) {
        const path = getNotificationViewPath(notification);
        if (this.props.onView(path, notification)) {
            this.props.router.push(path);
            this.props.markNotificationsAsRead([notification]);
        }
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
                                className="qa-NotificationsTable-TableHeaderColumn-Checkbox"
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
                                className="qa-NotificationsTable-TableHeaderColumn-Content"
                                style={styles.contentHeaderColumn}
                            >
                                <div style={styles.contentHeaderColumnWrapper}>
                                    <span>{this.getSelectedCount()} Selected</span>
                                    {this.getSelectedCount() > 0 ?
                                        <NotificationMultiMenu
                                            style={styles.multiMenu}
                                            selectedNotifications={this.state.selected}
                                            onMarkAsRead={this.props.onMultiMarkAsRead}
                                            onMarkAsUnread={this.props.onMultiMarkAsUnread}
                                            onRemove={this.props.onMultiRemove}
                                        />
                                        :
                                        null
                                    }
                                </div>
                            </TableHeaderColumn>
                            <TableHeaderColumn
                                className="qa-NotificationsTable-TableHeaderColumn-Date"
                                style={styles.dateHeaderColumn}
                            >
                                <span style={{ marginRight: '40px' }}>
                                    Date
                                </span>
                            </TableHeaderColumn>
                            <TableHeaderColumn
                                className="qa-NotificationsTable-TableHeaderColumn-Options"
                                style={styles.optionsHeaderColumn}
                            >
                                Options
                            </TableHeaderColumn>
                        </TableRow>
                    </TableHeader>
                    <TableBody displayRowCheckbox={false}>
                        {this.props.notifications.notificationsSorted.map((notification) => {
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
                                        className="qa-NotificationsTable-Checkbox"
                                        style={styles.checkboxRowColumn}
                                    >
                                        <Checkbox
                                            checked={!!this.state.selected[notification.uid]}
                                            onCheck={(e, isChecked) => this.setSelected(notification, isChecked)}
                                            disableTouchRipple={true}
                                        />
                                    </TableRowColumn>
                                    <TableRowColumn
                                        className="qa-NotificationsTable-Content"
                                        style={styles.contentRowColumn}
                                    >
                                        <div style={{display: 'flex', alignItems: 'center', width: '100%'}}>
                                            {icon}
                                            {message}
                                        </div>
                                    </TableRowColumn>
                                    <TableRowColumn
                                        className="qa-NotificationsTable-Date"
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
                                        className="qa-NotificationsTable-TableRowColumn-Options"
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
                                                    notification={notification}
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
                        })}
                    </TableBody>
                </Table>
            </div>
        );
    }
}

NotificationsTable.propTypes = {
    notifications: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
    onMarkAsRead: PropTypes.func,
    onMarkAsUnread: PropTypes.func,
    onRemove: PropTypes.func,
    onView: PropTypes.func,
    onMultiMarkAsRead: PropTypes.func,
    onMultiMarkAsUnread: PropTypes.func,
    onMultiRemove: PropTypes.func,
};

NotificationsTable.defaultProps = {
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
)(NotificationsTable);
