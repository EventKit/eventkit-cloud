import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import CircularProgress from '@material-ui/core/CircularProgress';
import GridList from '@material-ui/core/GridList';
import Paper from '@material-ui/core/Paper';
import PageHeader from '../common/PageHeader';
import CustomScrollbar from '../CustomScrollbar';
import NotificationsTable from '../Notification/NotificationsTable';
import NotificationGridItem from '../Notification/NotificationGridItem';
import LoadButtons from '../DataPackPage/LoadButtons';
import { getNotifications } from '../../actions/notificationsActions';
import background from '../../../images/ek_topo_pattern.png';

export class NotificationsPage extends React.Component {
    constructor(props) {
        super(props);
        this.refresh = this.refresh.bind(this);
        this.getGridPadding = this.getGridPadding.bind(this);
        this.getRange = this.getRange.bind(this);
        this.handleLoadMore = this.handleLoadMore.bind(this);
        this.itemsPerPage = 12;
        this.state = {
            loadingPage: true,
            loading: true,
            pageSize: this.itemsPerPage,
        };
    }

    componentDidMount() {
        this.refresh();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.notifications.fetched && !this.props.notifications.fetched) {
            this.setState({
                loadingPage: false,
                loading: false,
            });
        }
    }

    getGridPadding() {
        return window.innerWidth >= 768 ? 7 : 2;
    }

    getRange(notifications) {
        if (this.props.notifications.range) {
            const rangeParts = this.props.notifications.range.split('/');
            if (rangeParts.length !== 2) {
                return '';
            }

            return `${notifications.length}/${rangeParts[1]}`;
        }

        return '';
    }

    refresh() {
        this.props.getNotifications({ pageSize: this.state.pageSize });
        this.setState({ loading: true });
    }

    handleLoadMore() {
        if (this.props.notifications.nextPage) {
            this.setState({
                pageSize: this.state.pageSize + this.itemsPerPage,
            }, this.refresh);
        }
    }

    render() {
        const mainAppBarHeight = 95;
        const pageAppBarHeight = 35;
        const spacing = window.innerWidth > 575 ? '10px' : '2px';
        const styles = {
            root: {
                position: 'relative',
                height: window.innerHeight - mainAppBarHeight,
                width: '100%',
                backgroundImage: `url(${background})`,
                color: 'rgba(0, 0, 0, 0.54)',
            },
            customScrollbar: {
                height: window.innerHeight - mainAppBarHeight - pageAppBarHeight,
            },
            content: {
                marginBottom: '12px',
                maxWidth: '1920px',
                margin: 'auto',
            },
            tableRow: {
                marginLeft: '12px',
                paddingRight: '6px',
                height: '50px',
            },
            clickable: {
                cursor: 'pointer',
                width: 'min-content',
            },
            gridList: {
                width: '100%',
                height: 'auto',
                margin: '0',
                paddingLeft: spacing,
                paddingRight: spacing,
            },
            noData: {
                margin: `0 ${10 + (this.getGridPadding() / 2)}px`,
                padding: '22px',
                fontSize: '18px',
                color: 'rgba(0, 0, 0, 0.54)',
            },
        };

        const notifications = this.props.notifications.notificationsSorted.slice(0, this.state.pageSize);

        return (
            <div style={styles.root}>
                <PageHeader
                    className="qa-Notifications-PageHeader"
                    title="Notifications"
                />
                {this.state.loading ?
                    <div
                        style={{
                            zIndex: 10,
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(0,0,0,0.2)',
                        }}
                    >
                        <div style={{ width: '100%', height: '100%', display: 'inline-flex' }}>
                            <CircularProgress
                                style={{ margin: 'auto', display: 'block' }}
                                color="primary"
                                size={50}
                            />
                        </div>
                    </div>
                    : null
                }
                <CustomScrollbar style={styles.customScrollbar}>
                    {this.state.loadingPage ?
                        null
                        :
                        <div
                            className="qa-NotificationsPage-Content"
                            style={styles.content}
                        >
                            {(notifications.length === 0) ?
                                <Paper
                                    className="qa-NotificationsPage-Content-NoData"
                                    style={styles.noData}
                                >
                                    {"You don't have any notifications."}
                                </Paper>
                                :
                                <div className="qa-NotificationsPage-Content-Notifications">
                                    {(window.innerWidth > 768) ?
                                        <NotificationsTable
                                            notifications={this.props.notifications}
                                            notificationsArray={notifications}
                                            router={this.props.router}
                                        />
                                        :
                                        <GridList
                                            className="qa-NotificationsPage-Content-Notifications-Grid"
                                            cellHeight="auto"
                                            style={styles.gridList}
                                            spacing={2}
                                            cols={1}
                                        >
                                            {notifications.map(notification => (
                                                <NotificationGridItem
                                                    key={`Notification-${notification.id}`}
                                                    notification={notification}
                                                    router={this.props.router}
                                                />
                                            ))}
                                        </GridList>
                                    }
                                    <LoadButtons
                                        range={this.getRange(notifications)}
                                        handleLoadMore={this.handleLoadMore}
                                        loadMoreDisabled={!this.props.notifications.nextPage}
                                    />
                                </div>
                            }
                        </div>
                    }
                </CustomScrollbar>
            </div>
        );
    }
}

NotificationsPage.propTypes = {
    router: PropTypes.object.isRequired,
    notifications: PropTypes.object.isRequired,
    getNotifications: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
    return {
        notifications: state.notifications,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getNotifications: args => dispatch(getNotifications(args)),
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(NotificationsPage);
