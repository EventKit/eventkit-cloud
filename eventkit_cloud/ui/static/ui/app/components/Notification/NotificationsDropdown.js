import React, { PropTypes } from 'react';
import { CircularProgress, GridList, Paper } from 'material-ui';
import NotificationGridItem from './NotificationGridItem';
import { Link } from 'react-router';

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
                left: '-2px',
                zIndex: '100',
                ...this.props.style,
            },
            pointer: {
                position: 'absolute',
                top: '-12px',
                left: '25px',
                width: '25px',
                height: '25px',
                background: 'white',
                transform: 'rotate(-60deg) skewX(-30deg) scale(1,.866)',
                borderTopRightRadius: '3px',
            },
            paper: {
                width: '633px',
                padding: '28px 28px 24px',
            },
            header: {
                fontSize: '22px',
                textTransform: 'uppercase',
                marginBottom: '20px',
            },
            gridList: {
                width: '100%',
                padding: '0',
            },
            gridItem: {
                padding: '10px',
                boxShadow: 'none',
                borderBottom: '1px solid lightgray',
                borderRadius: '0',
            },
            noData: {
                textAlign: 'center',
                fontSize: '18px',
                color: 'rgba(0, 0, 0, 0.54)',
            },
            viewAll: {
                color: '#337ab7',
                fontSize: '22px',
                textTransform: 'uppercase',
                cursor: 'pointer',
            },
        };

        const notifications = this.props.notifications.notificationsSorted.slice(0, 10);

        return (
            <div style={styles.root}>
                <div style={styles.pointer}></div>
                <Paper style={styles.paper}>
                    <div style={styles.header}>Notifications</div>
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
                                        key={`Notification-${notification.uid}`}
                                        style={{
                                            ...styles.gridItem,
                                            borderTop: (index === 0) ? '1px solid lightgray' : '',
                                        }}
                                        notification={notification}
                                        onView={this.props.onNavigate}
                                        router={this.props.router}
                                    />
                                ))}
                            </GridList>
                    }
                    <div style={{ marginTop: '25px', textAlign: 'center' }}>
                        <Link
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

export default NotificationsDropdown;
