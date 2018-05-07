import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { Link, browserHistory } from 'react-router';
import { AppBar, CircularProgress, Paper } from 'material-ui';
import { deleteRuns, getFeaturedRuns, getRuns } from '../../actions/dataPackActions';
import { getViewedJobs } from '../../actions/userActivityActions';
import { getNotifications } from '../../actions/notificationsActions';
import CustomScrollbar from '../CustomScrollbar';
import { getProviders } from '../../actions/exportsActions';
import DashboardSection from './DashboardSection';
import DataPackGridItem from '../DataPackPage/DataPackGridItem';
import DataPackFeaturedItem from './DataPackFeaturedItem';
import NotificationGridItem from '../Notification/NotificationGridItem';
import { userIsDataPackAdmin } from '../../utils/generic';
import { updateDataCartPermissions } from '../../actions/statusDownloadActions';
import { getGroups } from '../../actions/userGroupsActions';
import DataPackShareDialog from '../DataPackShareDialog/DataPackShareDialog';
import { getUsers } from '../../actions/userActions';

const backgroundUrl = require('../../../images/ek_topo_pattern.png');

export class DashboardPage extends React.Component {
    constructor(props) {
        super(props);
        this.getGridPadding = this.getGridPadding.bind(this);
        this.getGridColumns = this.getGridColumns.bind(this);
        this.getGridWideColumns = this.getGridWideColumns.bind(this);
        this.getNotificationsColumns = this.getNotificationsColumns.bind(this);
        this.getNotificationsRows = this.getNotificationsRows.bind(this);
        this.refreshMyDataPacks = this.refreshMyDataPacks.bind(this);
        this.refreshFeatured = this.refreshFeatured.bind(this);
        this.refreshRecentlyViewed = this.refreshRecentlyViewed.bind(this);
        this.refresh = this.refresh.bind(this);
        this.autoRefresh = this.autoRefresh.bind(this);
        this.handleNotificationsViewAll = this.handleNotificationsViewAll.bind(this);
        this.handleFeaturedViewAll = this.handleFeaturedViewAll.bind(this);
        this.handleMyDataPacksViewAll = this.handleMyDataPacksViewAll.bind(this);
        this.handleShareOpen = this.handleShareOpen.bind(this);
        this.handleShareClose = this.handleShareClose.bind(this);
        this.handleShareSave = this.handleShareSave.bind(this);
        this.isLoading = this.isLoading.bind(this);
        this.state = {
            loadingPage: true,
            shareOpen: false,
            targetRun: null,
        };
        this.autoRefreshIntervalId = null;
        this.autoRefreshInterval = 10000;
    }

    componentDidMount() {
        this.props.getUsers();
        this.props.getGroups();
        this.props.getProviders();
        this.props.getNotifications({
            pageSize: this.getNotificationsColumns({ getMax: true }) * this.getNotificationsRows() * 3,
        });
        this.refresh();
        this.autoRefreshIntervalId = setInterval(this.autoRefresh, this.autoRefreshInterval);
    }

    componentWillUnmount() {
        clearInterval(this.autoRefreshIntervalId);
        this.autoRefreshIntervalId = null;
    }

    componentWillReceiveProps(nextProps) {
        // Only show page loading once, before all sections have initially loaded.
        let loadingPage = this.state.loadingPage;
        if (loadingPage) {
            this.setState({
                loadingPage: (
                    !nextProps.notifications.fetched ||
                    !nextProps.runsList.fetched ||
                    !nextProps.featuredRunsList.fetched ||
                    !nextProps.userActivity.viewedJobs.fetched ||
                    !nextProps.users.fetched ||
                    !nextProps.groups.fetched
                )
            });
        }

        // Deleted datapack.
        if (nextProps.runsDeletion.deleted && !this.props.runsDeletion.deleted) {
            this.refresh();
        }

        // Updated permissions.
        if (nextProps.updatePermission.updated && !this.props.updatePermission.updated) {
            this.refresh();
        }
    }

    getGridPadding() {
        return window.innerWidth >= 768 ? 6 : 2;
    }

    getGridColumns({ getMax = false } = {}) {
        if (window.innerWidth > 1920 || getMax) {
            return 6;
        } else if (window.innerWidth > 1600) {
            return 5;
        } else if (window.innerWidth > 1024) {
            return 4;
        } else if (window.innerWidth > 768) {
            return 3;
        }

        return 2;
    }

    getGridWideColumns({ getMax = false } = {}) {
        if (window.innerWidth > 1600 || getMax) {
            return 2;
        }

        return 1;
    }

    getNotificationsColumns({ getMax = false } = {}) {
        if (window.innerWidth > 1600 || getMax) {
            return 3;
        } else if (window.innerWidth > 1024) {
            return 2;
        }

        return 1;
    }

    getNotificationsRows() {
        return 3;
    }

    refreshMyDataPacks({ isAuto = false } = {}) {
        this.props.getRuns({
            pageSize: this.getGridColumns({ getMax: true }) * 3,
            ordering: '-started_at',
            ownerFilter: this.props.user.data.user.username,
            isAuto,
        });
    }

    refreshFeatured({ isAuto = false } = {}) {
        this.props.getFeaturedRuns({
            pageSize: this.getGridWideColumns({ getMax: true }) * 3,
            isAuto,
        });
    }

    refreshRecentlyViewed({ isAuto = false } = {}) {
        this.props.getViewedJobs({
            pageSize: this.getGridColumns({ getMax: true }) * 3,
            isAuto,
        });
    }

    refresh({ isAuto = false } = {}) {
        this.refreshMyDataPacks({ isAuto });
        this.refreshFeatured({ isAuto });
        this.refreshRecentlyViewed({ isAuto });
    }

    autoRefresh() {
        this.refresh({ isAuto: true });
    }

    handleNotificationsViewAll() {
        browserHistory.push('/notifications');
    }

    handleFeaturedViewAll() {
        browserHistory.push('/exports');
    }

    handleMyDataPacksViewAll() {
        browserHistory.push('/exports?collection=myDataPacks');
    }

    handleShareOpen(run) {
        this.setState({ shareOpen: true, targetRun: run });
    }

    handleShareClose() {
        this.setState({ shareOpen: false, targetRun: null });
    }

    handleShareSave(perms) {
        this.handleShareClose();
        const permissions = { ...perms };
        this.props.updateDataCartPermissions(this.state.targetRun.job.uid, permissions);
    }

    isLoading() {
        return (
            this.state.loadingPage ||
            this.props.runsDeletion.deleting ||
            this.props.updatePermission.updating
        );
    }

    render() {
        const mainAppBarHeight = 95;
        const pageAppBarHeight = 35;
        let styles = {
            root: {
                position: 'relative',
                height: window.innerHeight - mainAppBarHeight,
                width: '100%',
                backgroundImage: `url(${backgroundUrl})`,
                color: 'white',
            },
            appBar: {
                backgroundColor: '#161e2e',
                height: '35px',
                color: 'white',
                fontSize: '14px',
                zIndex: '0',
            },
            customScrollbar: {
                height: window.innerHeight - mainAppBarHeight - pageAppBarHeight,
            },
            pageTitle: {
                fontSize: '18px',
                lineHeight: '35px',
                paddingLeft: '10px',
                height: '35px',
            },
            loadingOverlay: {
                position: 'absolute',
                height: '100%',
                width: '100%',
                background: 'rgba(0,0,0,0.5)',
                zIndex: '100',
            },
            loadingPage: {
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
            },
            content: {
                marginBottom: '12px',
                maxWidth: '1920px',
                margin: 'auto',
            },
            noData: {
                margin: `0 ${10 + this.getGridPadding()/2}px`,
                padding: '22px',
                fontSize: '18px',
                color: 'rgba(0, 0, 0, 0.54)',
            },
            link: {
                color: '#337ab7',
            }
        };

        return (
            <div style={styles.root}>
                <AppBar
                    className="qa-Dashboard-AppBar"
                    style={styles.appBar}
                    title="Dashboard"
                    titleStyle={styles.pageTitle}
                    iconElementLeft={<p />}
                />
                {this.isLoading() ?
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
                                color="#4598bf"
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
                        <div style={styles.content}>
                            {/* Notifications */}
                            <DashboardSection
                                className="qa-DashboardSection-Notifications"
                                title="Notifications"
                                name="Notifications"
                                columns={this.getNotificationsColumns()}
                                rows={this.getNotificationsRows()}
                                gridPadding={this.getGridPadding()}
                                providers={this.props.providers}
                                onViewAll={this.handleNotificationsViewAll}
                                noDataElement={
                                    <Paper style={styles.noData}>
                                        {"You don't have any notifications."}
                                    </Paper>
                                }
                                rowMajor={false}
                            >
                                {this.props.notifications.notificationsSorted.map((notification) => (
                                    <NotificationGridItem
                                        key={`Notification-${notification.id}`}
                                        notification={notification}
                                        router={this.props.router}
                                    />
                                ))}
                            </DashboardSection>

                            {/* Recently Viewed */}
                            <DashboardSection
                                className="qa-DashboardSection-RecentlyViewed"
                                title="Recently Viewed"
                                name="RecentlyViewed"
                                columns={this.getGridColumns()}
                                gridPadding={this.getGridPadding()}
                                providers={this.props.providers}
                                noDataElement={
                                    <Paper style={styles.noData}>
                                        {"You don't have any recently viewed DataPacks."}&nbsp;
                                        <Link
                                            to="/exports"
                                            href="/exports"
                                            style={styles.link}
                                        >
                                            View DataPack Library
                                        </Link>
                                    </Paper>
                                }
                            >
                                {this.props.userActivity.viewedJobs.viewedJobs.map((viewedJob, index) => {
                                    const run = viewedJob.last_export_run;
                                    return (
                                        <DataPackGridItem
                                            className="qa-DashboardSection-RecentlyViewedGrid-Item"
                                            run={run}
                                            user={this.props.user}
                                            key={`RecentlyViewedDataPack-${viewedJob.created_at}`}
                                            onRunDelete={this.props.deleteRuns}
                                            providers={this.props.providers}
                                            adminPermission={userIsDataPackAdmin(this.props.user.data.user, run.job.permissions, this.props.groups.groups)}
                                            openShare={this.handleShareOpen}
                                            gridName="RecentlyViewed"
                                            index={index}
                                            showFeaturedFlag={false}
                                        />
                                    )
                                })}
                            </DashboardSection>

                            {/* Featured */}
                            {this.props.featuredRunsList.runs.length === 0 ?
                                null
                                :
                                <DashboardSection
                                    className="qa-DashboardSection-Featured"
                                    title="Featured"
                                    name="Featured"
                                    columns={this.getGridWideColumns()}
                                    gridPadding={this.getGridPadding()}
                                    cellHeight={(window.innerWidth > 768) ? 335 : 435}
                                    providers={this.props.providers}
                                    onViewAll={this.handleFeaturedViewAll}
                                >
                                    {this.props.featuredRunsList.runs.map((run, index) => (
                                        <DataPackFeaturedItem
                                            className="qa-DashboardSection-FeaturedGrid-WideItem"
                                            run={run}
                                            key={`FeaturedDataPack-${run.created_at}`}
                                            gridName="Featured"
                                            index={index}
                                            height={(window.innerWidth > 768) ? '335px' : '435px'}
                                        />
                                    ))}
                                </DashboardSection>
                            }

                            {/* My DataPacks */}
                            <DashboardSection
                                className="qa-DashboardSection-MyDataPacks"
                                title="My DataPacks"
                                name="MyDataPacks"
                                columns={this.getGridColumns()}
                                gridPadding={this.getGridPadding()}
                                providers={this.props.providers}
                                onViewAll={this.handleMyDataPacksViewAll}
                                noDataElement={
                                    <Paper style={styles.noData}>
                                        {"You don't have any DataPacks."}&nbsp;
                                        <Link
                                            to="/exports"
                                            href="/exports"
                                            style={styles.link}
                                        >
                                            View DataPack Library
                                        </Link>
                                    </Paper>
                                }
                            >
                                {this.props.runsList.runs.map((run, index) => (
                                    <DataPackGridItem
                                        className="qa-DashboardSection-MyDataPacksGrid-Item"
                                        run={run}
                                        user={this.props.user}
                                        key={`MyDataPacksDataPack-${run.created_at}`}
                                        onRunDelete={this.props.deleteRuns}
                                        providers={this.props.providers}
                                        adminPermission={userIsDataPackAdmin(this.props.user.data.user, run.job.permissions, this.props.groups.groups)}
                                        openShare={this.handleShareOpen}
                                        gridName="MyDataPacks"
                                        index={index}
                                        showFeaturedFlag={false}
                                    />
                                ))}
                            </DashboardSection>
                        </div>
                    }
                </CustomScrollbar>
                {this.state.shareOpen && this.state.targetRun ?
                    <DataPackShareDialog
                        show
                        onClose={this.handleShareClose}
                        onSave={this.handleShareSave}
                        user={this.props.user.data}
                        groups={this.props.groups.groups}
                        members={this.props.users.users}
                        permissions={this.state.targetRun.job.permissions}
                        groupsText="You may share view and edit rights with groups exclusively. Group sharing is managed separately from member sharing."
                        membersText="You may share view and edit rights with members exclusively. Member sharing is managed separately from group sharing."
                        canUpdateAdmin
                        warnPublic
                    />
                    :
                    null
                }
            </div>
        );
    }
}

DashboardPage.propTypes = {
    router: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    notifications: PropTypes.object.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
    runsDeletion: PropTypes.object.isRequired,
    runsList: PropTypes.shape({
        cancelSource: PropTypes.object,
        error: PropTypes.string,
        fetched: PropTypes.bool,
        fetching: PropTypes.bool,
        nextPage: PropTypes.bool,
        order: PropTypes.string,
        range: PropTypes.string,
        runs: PropTypes.arrayOf(PropTypes.object),
        view: PropTypes.string,
    }).isRequired,
    featuredRunsList: PropTypes.shape({
        cancelSource: PropTypes.object,
        error: PropTypes.string,
        fetched: PropTypes.bool,
        fetching: PropTypes.bool,
        nextPage: PropTypes.bool,
        range: PropTypes.string,
        runs: PropTypes.arrayOf(PropTypes.object),
    }).isRequired,
    getRuns: PropTypes.func.isRequired,
    getFeaturedRuns: PropTypes.func.isRequired,
    getViewedJobs: PropTypes.func.isRequired,
    getProviders: PropTypes.func.isRequired,
    deleteRuns: PropTypes.func.isRequired,
    getNotifications: PropTypes.func.isRequired,
    updatePermission: PropTypes.shape({
        updating: PropTypes.bool,
        updated: PropTypes.bool,
        error: PropTypes.array,
    }).isRequired,
    users: PropTypes.object.isRequired,
    groups: PropTypes.object.isRequired,
};

function mapStateToProps(state) {
    return {
        user: state.user,
        userActivity: state.userActivity,
        notifications: state.notifications,
        providers: state.providers,
        runsDeletion: state.runsDeletion,
        runsList: state.runsList,
        featuredRunsList: state.featuredRunsList,
        updatePermission: state.updatePermission,
        users: state.users,
        groups: state.groups,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getRuns: (args) => dispatch(getRuns(args)),
        getFeaturedRuns: (args) => dispatch(getFeaturedRuns(args)),
        getViewedJobs: (args) => dispatch(getViewedJobs(args)),
        getProviders: () => dispatch(getProviders()),
        deleteRuns: (uid) => dispatch(deleteRuns(uid)),
        getNotifications: (args) => dispatch(getNotifications(args)),
        updateDataCartPermissions: (uid, permissions) => dispatch(updateDataCartPermissions(uid, permissions)),
        getUsers: () => dispatch(getUsers()),
        getGroups: () => dispatch(getGroups()),
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(DashboardPage);
