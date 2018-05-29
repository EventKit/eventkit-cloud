import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { CircularProgress, GridList, Paper } from 'material-ui';
import NotificationGridItem from './NotificationGridItem';
import { markAllNotificationsAsRead, } from '../../actions/notificationsActions';

export class NotificationsDropdown extends React.Component {
    constructor(props) {
        super(props);
        this.handleViewAll = this.handleViewAll.bind(this);
        this.state = {
            showLoading: true,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.notifications.fetched && !this.props.notifications.fetched) {
            this.setState({ showLoading: false });
        }
    }

    handleViewAll() {
        if (this.props.onNavigate('/notifications')) {
            this.props.router.push('/notifications');
        }
    }

    render() {
        const styles = {
            root: {
                position: 'absolute',
                top: '80px',
                left: (window.innerWidth > 768) ? '-2px' : '-67px',
                width: (window.innerWidth > 768) ? 'auto' : `${window.innerWidth - 6}px`,
                zIndex: '100',
                transition: 'transform 0.25s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
                transformOrigin: (window.innerWidth > 768) ? '37px -21px' : '101px -21px',
                ...this.props.style,
            },
            pointer: {
                position: 'absolute',
                top: '-12px',
                left: (window.innerWidth > 768) ? '25px' : '89px',
                width: '25px',
                height: '25px',
                background: 'white',
                transform: 'rotate(-60deg) skewX(-30deg) scale(1,.866)',
                borderTopRightRadius: '3px',
            },
            paper: {
                width: (window.innerWidth > 768) ? '633px' : '100%',
                paddingBottom: (window.innerWidth > 768) ? '24px' : '18px',
            },
            header: {
                display: 'flex',
                alignItems: 'center',
                padding: (window.innerWidth > 768) ? '28px 28px 20px' : '18px 18px 18px',
            },
            headerTitle: {
                fontSize: '22px',
                textTransform: 'uppercase',
                flex: '1',
            },
            headerLink: {
                fontSize: '14px',
                color: '#337ab7',
                cursor: 'pointer',
            },
            gridList: {
                width: '100%',
                padding: (window.innerWidth > 768) ? '0 18px' : '0 4px',
            },
            gridItem: {
                padding: '10px',
                boxShadow: 'none',
                borderBottom: '1px solid rgb(224, 224, 224)',
                borderRadius: '0',
            },
            noData: {
                textAlign: 'center',
                fontSize: '18px',
                color: 'rgba(0, 0, 0, 0.54)',
            },
            viewAllContainer: {
                marginTop: (window.innerWidth > 768) ? '24px' : '18px',
                textAlign: 'center'
            },
            viewAll: {
                color: '#337ab7',
                fontSize: (window.innerWidth > 768) ? '22px' : '18px',
                textTransform: 'uppercase',
                cursor: 'pointer',
            },
        };

        const maxNotifications = (window.innerHeight > 768) ? 10 : 8;
        const notifications = this.props.notifications.notificationsSorted.slice(0, maxNotifications);

        return (
            <div style={styles.root}>
                <div
                    className={'qa-NotificationsDropdown-Pointer'}
                    style={styles.pointer}
                />
                <Paper style={styles.paper}>
                    <div
                        className={'qa-NotificationsDropdown-Header'}
                        style={styles.header}
                    >
                        <span
                            className={'qa-NotificationsDropdown-Header-Title'}
                            style={styles.headerTitle}
                        >
                            Notifications
                        </span>
                        <a
                            className={'qa-NotificationsDropdown-Header-MarkAllAsRead'}
                            style={styles.headerLink}
                            onClick={this.props.markAllNotificationsAsRead}
                        >
                            Mark All As Read
                        </a>
                    </div>
                    {this.state.showLoading ?
                        <div style={{ textAlign: 'center' }}>
                            <CircularProgress
                                color="#4598bf"
                                size={35}
                            />
                        </div>
                        :
                        (notifications.length === 0) ?
                            <div
                                className="qa-NotificationsDropdown-NoData"
                                style={styles.noData}
                            >
                                {"You don't have any notifications."}
                            </div>
                            :
                            <GridList
                                className="qa-NotificationsDropdown-Grid"
                                cellHeight="auto"
                                style={styles.gridList}
                                padding={0}
                                cols={1}
                            >
                                {notifications.map((notification, index) => (
                                    <NotificationGridItem
                                        key={`Notification-${notification.id}`}
                                        style={{
                                            ...styles.gridItem,
                                            borderTop: (index === 0) ? '1px solid rgb(224, 224, 224)' : '',
                                        }}
                                        notification={notification}
                                        onView={this.props.onNavigate}
                                        router={this.props.router}
                                    />
                                ))}
                            </GridList>
                    }
                    <div style={styles.viewAllContainer}>
                        <Link
                            className={'qa-NotificationsDropdown-ViewAll'}
                            style={styles.viewAll}
                            onClick={this.handleViewAll}
                        >
                            View All
                        </Link>
                    </div>
                </Paper>
            </div>
        );
    }
}

NotificationsDropdown.propTypes = {
    style: PropTypes.object,
    notifications: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired,
    onNavigate: PropTypes.func,
};

NotificationsDropdown.defaultProps = {
    style: {},
    onNavigate: () => { return true; },
};

function mapDispatchToProps(dispatch) {
    return {
        markAllNotificationsAsRead: () => dispatch(markAllNotificationsAsRead()),
    };
}

export default connect(
    null,
    mapDispatchToProps,
)(NotificationsDropdown);
