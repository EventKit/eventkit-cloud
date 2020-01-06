import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { withTheme } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import CircularProgress from '@material-ui/core/CircularProgress';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import GridList from '@material-ui/core/GridList';
import Paper from '@material-ui/core/Paper';
import NotificationGridItem from './NotificationGridItem';
import { markAllNotificationsAsRead } from '../../actions/notificationsActions';

export class NotificationsDropdown extends React.Component {
    constructor(props) {
        super(props);
        this.handleViewAll = this.handleViewAll.bind(this);
    }

    handleViewAll() {
        if (this.props.onNavigate('/notifications')) {
            this.props.history.push('/notifications');
        }
    }

    render() {
        const { colors } = this.props.theme.eventkit;
        const { width } = this.props;

        const styles = {
            gridItem: {
                borderBottom: `1px solid ${colors.secondary}`,
                borderRadius: '0',
                boxShadow: 'none',
                padding: '10px',
            },
            gridList: {
                padding: isWidthUp('md', width) ? '0 18px' : '0 4px',
                width: '100%',
            },
            header: {
                alignItems: 'center',
                display: 'flex',
                padding: isWidthUp('md', width) ? '28px 28px 20px' : '18px 18px 18px',
            },
            headerLink: {
                color: colors.primary,
                cursor: 'pointer',
                fontSize: '14px',
            },
            headerTitle: {
                flex: '1',
                fontSize: '22px',
                textTransform: 'uppercase',
            },
            noData: {
                color: colors.text_primary,
                fontSize: '18px',
                textAlign: 'center',
            },
            paper: {
                color: colors.black,
                paddingBottom: isWidthUp('md', width) ? '24px' : '18px',
                width: isWidthUp('md', width) ? '633px' : '100%',
            },
            pointer: {
                background: colors.white,
                borderTopRightRadius: '3px',
                height: '25px',
                left: isWidthUp('md', width) ? '25px' : '89px',
                position: 'absolute',
                top: '-12px',
                transform: 'rotate(-60deg) skewX(-30deg) scale(1,.866)',
                width: '25px',
            },
            root: {
                left: isWidthUp('md', width) ? '-2px' : '-67px',
                position: 'absolute',
                top: '80px',
                transformOrigin: isWidthUp('md', width) ? '37px -21px' : '101px -21px',
                transition: 'transform 0.25s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
                width: isWidthUp('md', width) ? 'auto' : 'calc(100vw - 6px)',
                zIndex: '100',
                ...this.props.style,
            },
            viewAll: {
                color: colors.primary,
                cursor: 'pointer',
                fontSize: isWidthUp('md', width) ? '22px' : '18px',
                textTransform: 'uppercase',
            },
            viewAllContainer: {
                marginTop: isWidthUp('md', width) ? '24px' : '18px',
                textAlign: 'center',
            },
        };

        const maxNotifications = isWidthUp('md', width) ? 10 : 8;
        const notifications = this.props.notifications.notificationsSorted.slice(0, maxNotifications);

        let body = (
            <div
                className="qa-NotificationsDropdown-NoData"
                style={styles.noData}
            >
                {"You don't have any notifications."}
            </div>
        );
        if (this.props.loading) {
            body = (
                <div style={{ textAlign: 'center' }}>
                    <CircularProgress
                        color="primary"
                        size={35}
                    />
                </div>
            );
        } else if (notifications.length > 0) {
            body = (
                <GridList
                    cellHeight="auto"
                    className="qa-NotificationsDropdown-Grid"
                    cols={1}
                    spacing={0}
                    style={styles.gridList}
                >
                    {notifications.map((notification, index) => (
                        <NotificationGridItem
                            history={this.props.history}
                            key={`Notification-${notification.id}`}
                            notification={notification}
                            onView={this.props.onNavigate}
                            paperStyle={{
                                ...styles.gridItem,
                                borderTop: (index === 0) ? `1px solid ${colors.secondary}` : '',
                            }}
                        />
                    ))}
                </GridList>
            );
        }

        return (
            <div style={styles.root}>
                <div
                    className="qa-NotificationsDropdown-Pointer"
                    style={styles.pointer}
                />
                <ClickAwayListener onClickAway={this.props.onClickAway}>
                    <Paper style={styles.paper}>
                        <div
                            className="qa-NotificationsDropdown-Header"
                            style={styles.header}
                        >
                            <span
                                className="qa-NotificationsDropdown-Header-Title"
                                style={styles.headerTitle}
                            >
                                Notifications
                            </span>
                            <span
                                className="qa-NotificationsDropdown-Header-MarkAllAsRead"
                                onClick={this.props.markAllNotificationsAsRead}
                                onKeyPress={this.props.markAllNotificationsAsRead}
                                role="button"
                                style={styles.headerLink}
                                tabIndex={0}
                            >
                                Mark All As Read
                            </span>
                        </div>
                        {body}
                        <div style={styles.viewAllContainer}>
                            <span
                                className="qa-NotificationsDropdown-ViewAll"
                                onClick={this.handleViewAll}
                                onKeyPress={this.handleViewAll}
                                role="button"
                                style={styles.viewAll}
                                tabIndex={0}
                            >
                                View All
                            </span>
                        </div>
                    </Paper>
                </ClickAwayListener>
            </div>
        );
    }
}

NotificationsDropdown.propTypes = {
    history: PropTypes.object.isRequired,
    loading: PropTypes.bool.isRequired,
    markAllNotificationsAsRead: PropTypes.func.isRequired,
    notifications: PropTypes.object.isRequired,
    onClickAway: PropTypes.func.isRequired,
    onNavigate: PropTypes.func,
    style: PropTypes.object,
    theme: PropTypes.object.isRequired,
    width: PropTypes.string.isRequired,
};

NotificationsDropdown.defaultProps = {
    onNavigate: () => true,
    style: {},
};

function mapDispatchToProps(dispatch) {
    return {
        markAllNotificationsAsRead: () => dispatch(markAllNotificationsAsRead()),
    };
}

export default
@withWidth()
@withTheme()
@connect(null, mapDispatchToProps)
class Default extends NotificationsDropdown {}
