import * as PropTypes from 'prop-types';
import { Component } from 'react';
import {connect} from 'react-redux';
import {Theme, withTheme} from '@material-ui/core/styles';
import withWidth, {isWidthUp} from '@material-ui/core/withWidth';
import ImageList from '@material-ui/core/ImageList';
import Paper from '@material-ui/core/Paper';
import PageHeader from '../common/PageHeader';
import PageLoading from '../common/PageLoading';
import CustomScrollbar from '../common/CustomScrollbar';
import NotificationsTable from '../Notification/NotificationsTable';
import NotificationGridItem from '../Notification/NotificationGridItem';
import LoadButtons from '../common/LoadButtons';
import {clearNotifications, getNotifications} from '../../actions/notificationsActions';
import {Breakpoint} from "@material-ui/core/styles/createBreakpoints";

export interface Props {
    history: any;
    notificationsData: Eventkit.Store.NotificationsData;
    notificationsStatus: Eventkit.Store.NotificationsStatus;
    getNotifications: (args: object) => void;
    clearNotifications: () => void;
    theme: Eventkit.Theme & Theme;
    width: Breakpoint;
}

export interface State {
    loading: boolean;
    loadingPage: boolean;
    pageSize: number;
    notifications: Eventkit.Store.Notifications;
}

export class NotificationsPage extends Component<Props, State> {
    private itemsPerPage: number;

    static contextTypes = {
        config: PropTypes.shape({
            NOTIFICATIONS_PAGE_SIZE: PropTypes.string,
        }),
    };

    constructor(props: Props) {
        super(props);
        this.refresh = this.refresh.bind(this);
        this.getGridPadding = this.getGridPadding.bind(this);
        this.getRange = this.getRange.bind(this);
        this.handleLoadMore = this.handleLoadMore.bind(this);
        this.state = {
            loadingPage: true,
            loading: true,
            pageSize: this.itemsPerPage,
            notifications: null,
        };
    }

    async componentWillMount() {
        await this.props.clearNotifications();
        this.itemsPerPage = Number(this.context.config.NOTIFICATIONS_PAGE_SIZE) || 10;
    }

    componentDidMount() {
        this.refresh();
    }

    componentDidUpdate(prevProps: Props) {
        if (this.props.notificationsStatus.fetched && !prevProps.notificationsStatus.fetched) {
            // reconsider setting state in componentDidUpdate in the future
            this.setState({  // eslint-disable-line
                loadingPage: false,
                loading: false,
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
                this.setState({pageSize: this.itemsPerPage}, this.refresh); // eslint-disable-line
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

    async refresh() {
        this.setState({loading: true});
        await this.props.getNotifications({pageSize: this.state.pageSize});
    }

    handleLoadMore() {
        if (this.props.notificationsData.nextPage) {
            this.setState(prevState => ({
                    pageSize: prevState.pageSize + this.itemsPerPage,
                }), this.refresh
            );
        }
    }

    render() {
        const {colors, images} = this.props.theme.eventkit;

        const mainAppBarHeight = 95;
        const pageAppBarHeight = 35;
        const spacing = isWidthUp('sm', this.props.width as Breakpoint) ? '10px' : '2px';
        const styles = {
            root: {
                position: 'relative' as 'relative',
                height: `calc(100vh - ${mainAppBarHeight}px)`,
                width: '100%',
                backgroundImage: `url(${images.topo_dark})`,
                color: colors.text_primary,
            },
            customScrollbar: {
                height: `calc(100vh - ${mainAppBarHeight + pageAppBarHeight}px)`,
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
                color: colors.text_primary,
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
                    ? <PageLoading background="transparent" style={{zIndex: 10}}/>
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
                                                    <ImageList
                                                        className="qa-NotificationsPage-Content-Notifications-Grid"
                                                        rowHeight="auto"
                                                        style={styles.gridList}
                                                        gap={2}
                                                        cols={1}
                                                    >
                                                        {notifications.map(notification => (
                                                            <NotificationGridItem
                                                                key={`Notification-${notification.id}`}
                                                                notification={notification}
                                                                history={this.props.history}
                                                            />
                                                        ))}
                                                    </ImageList>
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

function mapStateToProps(state: State): Pick<Props, 'notificationsStatus' | 'notificationsData'> {
    return {
        notificationsStatus: state.notifications.status,
        notificationsData: state.notifications.data,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getNotifications: args => dispatch(getNotifications(args)),
        clearNotifications: () => dispatch(clearNotifications()),
    };
}

export default withWidth()(withTheme(connect(mapStateToProps, mapDispatchToProps)(NotificationsPage)));
