import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import { withTheme } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import CircularProgress from '@material-ui/core/CircularProgress';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import ImageList from '@material-ui/core/ImageList';
import Paper from '@material-ui/core/Paper';
import NotificationGridItem from './NotificationGridItem';
import { markAllNotificationsAsRead } from '../../actions/notificationsActions';

export class NotificationsDropdown extends Component {
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
            root: {
                position: 'absolute',
                top: '80px',
                left: isWidthUp('md', width) ? '-2px' : '-67px',
                width: isWidthUp('md', width) ? 'auto' : 'calc(100vw - 6px)',
                zIndex: '100',
                transition: 'transform 0.25s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
                transformOrigin: isWidthUp('md', width) ? '37px -21px' : '101px -21px',
                ...this.props.style,
            },
            pointer: {
                position: 'absolute',
                top: '-12px',
                left: isWidthUp('md', width) ? '25px' : '89px',
                width: '25px',
                height: '25px',
                background: colors.white,
                transform: 'rotate(-60deg) skewX(-30deg) scale(1,.866)',
                borderTopRightRadius: '3px',
            },
            paper: {
                width: isWidthUp('md', width) ? '633px' : '100%',
                paddingBottom: isWidthUp('md', width) ? '24px' : '18px',
                color: colors.black,
            },
            header: {
                display: 'flex',
                alignItems: 'center',
                padding: isWidthUp('md', width) ? '28px 28px 20px' : '18px 18px 18px',
            },
            headerTitle: {
                fontSize: '22px',
                textTransform: 'uppercase',
                flex: '1',
            },
            headerLink: {
                fontSize: '14px',
                color: colors.primary,
                cursor: 'pointer',
            },
            gridList: {
                width: '100%',
                padding: isWidthUp('md', width) ? '0 18px' : '0 4px',
            },
            gridItem: {
                padding: '10px',
                boxShadow: 'none',
                borderBottom: `1px solid ${colors.secondary}`,
                borderRadius: '0',
            },
            noData: {
                textAlign: 'center',
                fontSize: '18px',
                color: colors.text_primary,
            },
            viewAllContainer: {
                marginTop: isWidthUp('md', width) ? '24px' : '18px',
                textAlign: 'center',
            },
            viewAll: {
                color: colors.primary,
                fontSize: isWidthUp('md', width) ? '22px' : '18px',
                textTransform: 'uppercase',
                cursor: 'pointer',
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
                <ImageList
                    className="qa-NotificationsDropdown-Grid"
                    rowHeight="auto"
                    style={styles.gridList}
                    gap={0}
                    cols={1}
                >
                    {notifications.map((notification, index) => (
                        <NotificationGridItem
                            key={`Notification-${notification.id}`}
                            paperStyle={{
                                ...styles.gridItem,
                                borderTop: (index === 0) ? `1px solid ${colors.secondary}` : '',
                            }}
                            notification={notification}
                            history={this.props.history}
                            onView={this.props.onNavigate}
                        />
                    ))}
                </ImageList>
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
                                role="button"
                                tabIndex={0}
                                className="qa-NotificationsDropdown-Header-MarkAllAsRead"
                                style={styles.headerLink}
                                onClick={this.props.markAllNotificationsAsRead}
                                onKeyPress={this.props.markAllNotificationsAsRead}
                            >
                                Mark All As Read
                            </span>
                        </div>
                        {body}
                        <div style={styles.viewAllContainer}>
                            <span
                                role="button"
                                tabIndex={0}
                                className="qa-NotificationsDropdown-ViewAll"
                                style={styles.viewAll}
                                onClick={this.handleViewAll}
                                onKeyPress={this.handleViewAll}
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
    style: PropTypes.object,
    notifications: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    onNavigate: PropTypes.func,
    loading: PropTypes.bool.isRequired,
    markAllNotificationsAsRead: PropTypes.func.isRequired,
    onClickAway: PropTypes.func.isRequired,
    theme: PropTypes.object.isRequired,
    width: PropTypes.string.isRequired,
};

NotificationsDropdown.defaultProps = {
    style: {},
    onNavigate: () => true,
};

function mapDispatchToProps(dispatch) {
    return {
        markAllNotificationsAsRead: () => dispatch(markAllNotificationsAsRead()),
    };
}

export default withWidth()(withTheme(connect(null, mapDispatchToProps)(NotificationsDropdown)));
