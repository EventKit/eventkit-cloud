import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { Checkbox, Table, TableBody, TableHeader, TableHeaderColumn, TableRow } from 'material-ui';
import CheckboxIcon from 'material-ui/svg-icons/toggle/check-box';
import IndeterminateCheckboxIcon from '../icons/IndeterminateIcon';
import { markNotificationsAsRead, markNotificationsAsUnread, removeNotifications } from '../../actions/notificationsActions';
import NotificationsTableItem from './NotificationsTableItem';
import NotificationsTableMenu from './NotificationsTableMenu';

export class NotificationsTable extends React.Component {
    constructor(props) {
        super(props);
        this.getSelectedCount = this.getSelectedCount.bind(this);
        this.setSelected = this.setSelected.bind(this);
        this.handleSelectAllCheck = this.handleSelectAllCheck.bind(this);
        this.getSelectAllCheckedIcon = this.getSelectAllCheckedIcon.bind(this);
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
                padding: '0 10px',
                textAlign: 'left',
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
                                        <NotificationsTableMenu
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
                        {this.props.notifications.notificationsSorted.map((notification) => (
                            <NotificationsTableItem
                                key={`NotificationsTableItem-${notification.uid}`}
                                notification={notification}
                                router={this.props.router}
                                isSelected={!!this.state.selected[notification.uid]}
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
    router: PropTypes.object.isRequired,
    onMarkAsRead: PropTypes.func,
    onMarkAsUnread: PropTypes.func,
    onRemove: PropTypes.func,
    onView: PropTypes.func,
    onMultiMarkAsRead: PropTypes.func,
    onMultiMarkAsUnread: PropTypes.func,
    onMultiRemove: PropTypes.func,
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
