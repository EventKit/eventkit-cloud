import PropTypes from 'prop-types';
import React from 'react';
import { withTheme } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import Checkbox from '@material-ui/core/Checkbox';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
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

    componentDidUpdate(prevProps, prevState) {
        if (this.props.notificationsData !== prevProps.notificationsData) {
            // Make sure to deselect any notifications that have been removed. Handle it here instead of
            // the standard callback in case it was removed by the notifications dropdown.
            const selected = { ...prevState.selected };

            Object.keys(selected).forEach((uid) => {
                if (!this.props.notificationsData.notifications[uid]) {
                    delete selected[uid];
                }
            });
            // Lint check is disabled here, but we should reconsider these things.
            this.setState({ selected }); // eslint-disable-line
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
        this.setState((prevState) => {
            const selected = { ...prevState.selected };
            if (isSelected) {
                selected[notification.id] = notification;
            } else {
                delete selected[notification.id];
            }
            return { selected };
        });
    }

    isSelected(notification) {
        return !!this.state.selected[notification.id];
    }

    handleSelectAllCheck() {
        this.setState((prevState) => {
            let selected = { ...prevState.selected };
            if (this.getSelectedCount() === 0) {
                this.props.notificationsArray.forEach((notification) => {
                    selected[notification.id] = notification;
                });
            } else {
                selected = {};
            }
            return { selected };
        });
    }

    render() {
        const { colors } = this.props.theme.eventkit;
        const { width } = this.props;

        const spacing = isWidthUp('sm') ? '10px' : '2px';
        let styles = {
            cell: {
                color: colors.text_primary,
                padding: '0 15px',
                textAlign: 'left',
            },
            contentHeaderColumnWrapper: {
                alignItems: 'center',
                display: 'flex',
                height: '100%',
            },
            root: {
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginLeft: spacing,
                marginRight: spacing,
                paddingBottom: spacing,
            },
            tableHeader: {
                backgroundColor: colors.white,
                height: '50px',
            },
        };

        let optionsWidth = '60px';
        if (isWidthUp('xl', width)) {optionsWidth = '435px'};

        styles = {
            ...styles,
            checkboxHeaderColumn: {
                ...styles.cell,
                width: '54px',
            },
            contentHeaderColumn: {
                ...styles.cell,
                fontWeight: 'bold',
            },
            dateHeaderColumn: {
                ...styles.cell,
                textAlign: 'center',
                width: isWidthUp('md', width) ? '200px' : '150px',
            },
            optionsHeaderColumn: {
                ...styles.cell,
                padding: '0 15px 0 0',
                textAlign: isWidthUp('xl', width) ? 'center' : 'right',
                width: optionsWidth,
            },
        };

        const selectedCount = this.getSelectedCount();

        return (
            <div style={styles.root}>
                <Table style={{ tableLayout: 'fixed' }}>
                    <TableBody
                        style={styles.tableHeader}
                    >
                        <TableRow>
                            <TableCell
                                className="qa-NotificationsTable-TableCell-Checkbox"
                                style={styles.checkboxHeaderColumn}
                            >
                                <Checkbox
                                    color="primary"
                                    className="qa-NotificationsTable-SelectAllCheckbox"
                                    checked={selectedCount > 0}
                                    checkedIcon={this.getSelectAllCheckedIcon()}
                                    onChange={this.handleSelectAllCheck}
                                />
                            </TableCell>
                            <TableCell
                                className="qa-NotificationsTable-TableCell-Content"
                                style={styles.contentHeaderColumn}
                            >
                                <div style={styles.contentHeaderColumnWrapper}>
                                    <span>
                                        {selectedCount}
                                        {' '}
Selected
                                    </span>
                                    <NotificationsTableMenu
                                        allSelected={selectedCount === this.props.notificationsArray.length}
                                        selectedNotifications={this.state.selected}
                                        onMarkAsRead={this.props.onMarkAsRead}
                                        onMarkAsUnread={this.props.onMarkAsUnread}
                                        onRemove={this.props.onRemove}
                                        onMarkAllAsRead={this.props.onMarkAllAsRead}
                                    />
                                </div>
                            </TableCell>
                            <TableCell
                                className="qa-NotificationsTable-TableCell-Date"
                                style={styles.dateHeaderColumn}
                            >
                                Date
                            </TableCell>
                            <TableCell
                                className="qa-NotificationsTable-TableCell-Options"
                                style={styles.optionsHeaderColumn}
                            >
                                Options
                            </TableCell>
                        </TableRow>
                    </TableBody>
                    <TableBody>
                        {this.props.notificationsArray.map(notification => (
                            <NotificationsTableItem
                                key={`NotificationsTableItem-${notification.id}`}
                                notification={notification}
                                history={this.props.history}
                                isSelected={this.isSelected(notification)}
                                setSelected={this.setSelected}
                                onMarkAsRead={this.props.onMarkAsRead}
                                onMarkAsUnread={this.props.onMarkAsUnread}
                                onRemove={this.props.onRemove}
                                onView={this.props.onView}
                                fullSize={isWidthUp('xl', width)} // trigger component update on resize
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }
}

NotificationsTable.propTypes = {
    history: PropTypes.object.isRequired,
    notificationsArray: PropTypes.arrayOf(PropTypes.object).isRequired,
    notificationsData: PropTypes.object.isRequired,
    onMarkAllAsRead: PropTypes.func,
    onMarkAsRead: PropTypes.func,
    onMarkAsUnread: PropTypes.func,
    onRemove: PropTypes.func,
    onView: PropTypes.func,
    theme: PropTypes.object.isRequired,
    width: PropTypes.string.isRequired,
};

NotificationsTable.defaultProps = {
    onMarkAllAsRead: undefined,
    onMarkAsRead: undefined,
    onMarkAsUnread: undefined,
    onRemove: undefined,
    onView: undefined,
};

export default
@withWidth()
@withTheme()
class Default extends NotificationsTable {}
