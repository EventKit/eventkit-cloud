import PropTypes from 'prop-types';
import { Component } from 'react';
import withTheme from '@mui/styles/withTheme';
import Checkbox from '@mui/material/Checkbox';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import CheckboxIcon from '@mui/icons-material/CheckBox';
import IndeterminateCheckboxIcon from '../icons/IndeterminateIcon';
import NotificationsTableItem from './NotificationsTableItem';
import NotificationsTableMenu from './NotificationsTableMenu';
import useMediaQuery from '@mui/material/useMediaQuery';

// FIXME checkout https://mui.com/components/use-media-query/#migrating-from-withwidth
const withWidth = () => (WrappedComponent) => (props) => <WrappedComponent {...props} width="xs" />;

export class NotificationsTable extends Component {
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
                backgroundColor: colors.white,
            },
            cell: {
                padding: '0 15px',
                textAlign: 'left',
                color: colors.text_primary,
            },
            contentHeaderColumnWrapper: {
                display: 'flex',
                alignItems: 'center',
                height: '100%',
            },
        };

        let optionsWidth = '60px';
        if (useMediaQuery(this.props.theme.breakpoints.up('xl'))) optionsWidth = '435px';

        styles = {
            ...styles,
            checkboxHeaderColumn: {
                ...styles.cell,
                width: '54px',
            },
            selectAllCheckbox: {
                color: colors.primary,
            },
            contentHeaderColumn: {
                ...styles.cell,
                fontWeight: 'bold',
            },
            dateHeaderColumn: {
                ...styles.cell,
                textAlign: 'center',
                width: useMediaQuery(this.props.theme.breakpoints.up('md')) ? '200px' : '150px',
            },
            optionsHeaderColumn: {
                ...styles.cell,
                textAlign: useMediaQuery(this.props.theme.breakpoints.up('xl')) ? 'center' : 'right',
                width: optionsWidth,
                padding: '0 15px 0 0',
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
                                    style={styles.selectAllCheckbox}
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
                        {this.props.notificationsArray.map((notification) => (
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
                                fullSize={useMediaQuery(this.props.theme.breakpoints.up('xl'))} // trigger component update on resize
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }
}

NotificationsTable.propTypes = {
    notificationsArray: PropTypes.arrayOf(PropTypes.object).isRequired,
    notificationsData: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    onMarkAsRead: PropTypes.func,
    onMarkAsUnread: PropTypes.func,
    onRemove: PropTypes.func,
    onMarkAllAsRead: PropTypes.func,
    onView: PropTypes.func,
    theme: PropTypes.object.isRequired,
    width: PropTypes.string.isRequired,
};

NotificationsTable.defaultProps = {
    onMarkAsRead: undefined,
    onMarkAsUnread: undefined,
    onRemove: undefined,
    onMarkAllAsRead: undefined,
    onView: undefined,
};

export default withWidth()(withTheme(NotificationsTable));
