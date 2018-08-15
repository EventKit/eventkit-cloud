import PropTypes from 'prop-types';
import React from 'react';
import { Checkbox, Table, TableBody, TableHeader, TableHeaderColumn, TableRow } from 'material-ui';
import CheckboxIcon from '@material-ui/icons/CheckBox';
import IndeterminateCheckboxIcon from '../icons/IndeterminateIcon';
import NotificationsTableItem from './NotificationsTableItem';
import NotificationsTableMenu from './NotificationsTableMenu';

export class NotificationsTable extends React.Component {
    constructor(props) {
        super(props);
        this.getSelectedCount = this.getSelectedCount.bind(this);
        this.isSelected = this.isSelected.bind(this);
        this.setSelected = this.setSelected.bind(this);
        this.handleSelectAllCheck = this.handleSelectAllCheck.bind(this);
        this.getSelectAllCheckedIcon = this.getSelectAllCheckedIcon.bind(this);
        this.state = {
            selected: {},
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.notifications !== this.props.notifications) {
            // Make sure to deselect any notifications that have been removed. Handle it here instead of
            // the standard callback in case it was removed by the notifications dropdown.
            const selected = { ...this.state.selected };

            Object.keys(selected).forEach((uid) => {
                if (!nextProps.notifications.notifications[uid]) {
                    delete selected[uid];
                }
            });

            this.setState({ selected });
        }
    }

    getSelectedCount() {
        return Object.keys(this.state.selected).length;
    }

    getSelectAllCheckedIcon() {
        if (this.getSelectedCount() === this.props.notificationsArray.length) {
            return <CheckboxIcon />;
        }
        return <IndeterminateCheckboxIcon />;
    }

    setSelected(notification, isSelected) {
        const selected = { ...this.state.selected };
        if (isSelected) {
            selected[notification.id] = notification;
        } else {
            delete selected[notification.id];
        }

        this.setState({ selected });
    }

    isSelected(notification) {
        return !!this.state.selected[notification.id];
    }

    handleSelectAllCheck() {
        let selected = { ...this.state.selected };
        if (this.getSelectedCount() === 0) {
            this.props.notificationsArray.forEach((notification) => {
                selected[notification.id] = notification;
            });
        } else {
            selected = {};
        }
        this.setState({ selected });
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
            tableHeaderColumn: {
                padding: '0 15px',
                textAlign: 'left',
            },
            contentHeaderColumnWrapper: {
                display: 'flex',
                alignItems: 'center',
                height: '100%',
            },
            multiMenu: {
                marginLeft: '6px',
                position: 'relative',
                top: '1px',
            },
        };

        let optionsWidth = '60px';
        if (window.innerWidth > 1600) optionsWidth = '600px';
        else if (window.innerWidth > 1280) optionsWidth = '435px';

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
                width: optionsWidth,
                padding: '0 15px 0 0',
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
                                    className="qa-NotificationsTable-SelectAllCheckbox"
                                    checked={this.getSelectedCount() > 0}
                                    checkedIcon={this.getSelectAllCheckedIcon()}
                                    onCheck={this.handleSelectAllCheck}
                                    disableTouchRipple
                                />
                            </TableHeaderColumn>
                            <TableHeaderColumn
                                className="qa-NotificationsTable-TableHeaderColumn-Content"
                                style={styles.contentHeaderColumn}
                            >
                                <div style={styles.contentHeaderColumnWrapper}>
                                    <span>{this.getSelectedCount()} Selected</span>
                                    <NotificationsTableMenu
                                        style={styles.multiMenu}
                                        selectedNotifications={this.state.selected}
                                        onMarkAsRead={this.props.onMarkAsRead}
                                        onMarkAsUnread={this.props.onMarkAsUnread}
                                        onRemove={this.props.onRemove}
                                        onMarkAllAsRead={this.props.onMarkAllAsRead}
                                    />
                                </div>
                            </TableHeaderColumn>
                            <TableHeaderColumn
                                className="qa-NotificationsTable-TableHeaderColumn-Date"
                                style={styles.dateHeaderColumn}
                            >
                                Date
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
                        {this.props.notificationsArray.map(notification => (
                            <NotificationsTableItem
                                key={`NotificationsTableItem-${notification.id}`}
                                notification={notification}
                                router={this.props.router}
                                isSelected={this.isSelected(notification)}
                                setSelected={this.setSelected}
                                onMarkAsRead={this.props.onMarkAsRead}
                                onMarkAsUnread={this.props.onMarkAsUnread}
                                onRemove={this.props.onRemove}
                                onView={this.props.onView}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }
}

NotificationsTable.propTypes = {
    notifications: PropTypes.object.isRequired,
    notificationsArray: PropTypes.arrayOf(PropTypes.object).isRequired,
    router: PropTypes.object.isRequired,
    onMarkAsRead: PropTypes.func,
    onMarkAsUnread: PropTypes.func,
    onRemove: PropTypes.func,
    onMarkAllAsRead: PropTypes.func,
    onView: PropTypes.func,
};

NotificationsTable.defaultProps = {
    onMarkAsRead: undefined,
    onMarkAsUnread: undefined,
    onRemove: undefined,
    onMarkAllAsRead: undefined,
    onView: undefined,
};

export default NotificationsTable;
