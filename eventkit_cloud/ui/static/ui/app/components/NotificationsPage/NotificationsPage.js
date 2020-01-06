import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { withTheme } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import GridList from '@material-ui/core/GridList';
import Paper from '@material-ui/core/Paper';
import PageHeader from '../common/PageHeader';
import PageLoading from '../common/PageLoading';
import CustomScrollbar from '../CustomScrollbar';
import NotificationsTable from '../Notification/NotificationsTable';
import NotificationGridItem from '../Notification/NotificationGridItem';
import LoadButtons from '../common/LoadButtons';
import { getNotifications } from '../../actions/notificationsActions';

export class NotificationsPage extends React.Component {
    constructor(props, context) {
        super(props);
        this.refresh = this.refresh.bind(this);
        this.getGridPadding = this.getGridPadding.bind(this);
        this.getRange = this.getRange.bind(this);
        this.handleLoadMore = this.handleLoadMore.bind(this);
        this.itemsPerPage = Number(context.config.NOTIFICATIONS_PAGE_SIZE) || 10;
        this.state = {
            loading: true,
            loadingPage: true,
            pageSize: this.itemsPerPage,
        };
    }

    componentDidMount() {
        this.refresh();
    }

    componentDidUpdate(prevProps) {
        if (this.props.notificationsStatus.fetched && !prevProps.notificationsStatus.fetched) {
            // reconsider setting state in componentDidUpdate in the future
            this.setState({  // eslint-disable-line
                loading: false,
                loadingPage: false,
            });
        }

        if (this.props.notificationsStatus.deleted && !prevProps.notificationsStatus.deleted) {
            this.refresh();
        }

        // In some rare cases the config is not loaded when this page mounts so we need to watch for an update
        if (Number(this.context.config.NOTIFICATIONS_PAGE_SIZE) !== this.itemsPerPage) {
            if (this.context.config.NOTIFICATIONS_PAGE_SIZE) {
                this.itemsPerPage = Number(this.context.config.NOTIFICATIONS_PAGE_SIZE);
                // reconsider setting state in componentDidUpdate in the future
                this.setState({ pageSize: this.itemsPerPage }, this.refresh); // eslint-disable-line
            }
        }
    }

    getGridPadding() {
        return isWidthUp('md', this.props.width) ? 7 : 2;
    }

    getRange(notifications) {
        if (this.props.notificationsData.range) {
            const rangeParts = this.props.notificationsData.range.split('/');
            if (rangeParts.length !== 2) {
                return '';
            }

            return `${notifications.length}/${rangeParts[1]}`;
        }

        return '';
    }

    refresh() {
        this.setState({ loading: true });
        this.props.getNotifications({ pageSize: this.state.pageSize });
    }

    handleLoadMore() {
        if (this.props.notificationsData.nextPage) {
            this.setState(prevState => ({
                pageSize: prevState.pageSize + this.itemsPerPage,
            }), this.refresh);
        }
    }

    render() {
        const { colors, images } = this.props.theme.eventkit;

        const mainAppBarHeight = 95;
        const pageAppBarHeight = 35;
        const spacing = isWidthUp('sm') ? '10px' : '2px';
        const styles = {
            clickable: {
                cursor: 'pointer',
                width: 'min-content',
            },
            content: {
                margin: 'auto',
                marginBottom: '12px',
                maxWidth: '1920px',
            },
            customScrollbar: {
                height: `calc(100vh - ${mainAppBarHeight + pageAppBarHeight}px)`,
            },
            gridList: {
                height: 'auto',
                margin: '0',
                paddingLeft: spacing,
                paddingRight: spacing,
                width: '100%',
            },
            noData: {
                color: colors.text_primary,
                fontSize: '18px',
                margin: `0 ${10 + (this.getGridPadding() / 2)}px`,
                padding: '22px',
            },
            root: {
                backgroundImage: `url(${images.topo_dark})`,
                color: colors.text_primary,
                height: `calc(100vh - ${mainAppBarHeight}px)`,
                position: 'relative',
                width: '100%',
            },
            tableRow: {
                height: '50px',
                marginLeft: '12px',
                paddingRight: '6px',
            },
        };

        const notifications = this.props.notificationsData.notificationsSorted.slice(0, this.state.pageSize);

        return (
            <div style={styles.root}>
                <PageHeader
                    className="qa-Notifications-PageHeader"
                    title="Notifications"
                />
                {this.state.loading
                    ? <PageLoading background="transparent" style={{ zIndex: 10 }} />
                    : null
                }
                <CustomScrollbar style={styles.customScrollbar}>
                    {this.state.loadingPage
                        ? null
                        : (
                            <div
                                className="qa-NotificationsPage-Content"
                                style={styles.content}
                            >
                                {(notifications.length === 0)
                                    ? (
                                        <Paper
                                            className="qa-NotificationsPage-Content-NoData"
                                            style={styles.noData}
                                        >
                                            {"You don't have any notifications."}
                                        </Paper>
                                    )
                                    : (
                                        <div className="qa-NotificationsPage-Content-Notifications">
                                            {isWidthUp('md', this.props.width)
                                                ? (
                                                    <NotificationsTable
                                                        notificationsData={this.props.notificationsData}
                                                        notificationsArray={notifications}
                                                        history={this.props.history}
                                                    />
                                                )
                                                : (
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
                                                                history={this.props.history}
                                                            />
                                                        ))}
                                                    </GridList>
                                                )
                                            }
                                            <LoadButtons
                                                range={this.getRange(notifications)}
                                                handleLoadMore={this.handleLoadMore}
                                                loadMoreDisabled={!this.props.notificationsData.nextPage}
                                            />
                                        </div>
                                    )
                                }
                            </div>
                        )
                    }
                </CustomScrollbar>
            </div>
        );
    }
}

NotificationsPage.contextTypes = {
    config: PropTypes.shape({
        NOTIFICATIONS_PAGE_SIZE: PropTypes.string,
    }),
};

NotificationsPage.propTypes = {
    getNotifications: PropTypes.func.isRequired,
    history: PropTypes.object.isRequired,
    notificationsData: PropTypes.object.isRequired,
    notificationsStatus: PropTypes.object.isRequired,
    theme: PropTypes.object.isRequired,
    width: PropTypes.string.isRequired,
};

function mapStateToProps(state) {
    return {
        notificationsData: state.notifications.data,
        notificationsStatus: state.notifications.status,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getNotifications: args => dispatch(getNotifications(args)),
    };
}

export default
@withWidth()
@withTheme()
@connect(mapStateToProps, mapDispatchToProps)
class Default extends NotificationsPage {}
