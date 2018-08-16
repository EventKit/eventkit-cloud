import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link, browserHistory } from 'react-router';
import Joyride from 'react-joyride';
import Help from '@material-ui/icons/Help';
import { AppBar, CircularProgress, Paper } from 'material-ui';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
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
import { getUsers } from '../../actions/userActions';
import { joyride } from '../../joyride.config';
import background from '../../../images/ek_topo_pattern.png';

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
        this.isLoading = this.isLoading.bind(this);
        this.handleWalkthroughClick = this.handleWalkthroughClick.bind(this);
        this.callback = this.callback.bind(this);
        this.state = {
            loadingPage: true,
            steps: [],
            isRunning: false,
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
        const steps = joyride.DashboardPage;
        this.joyrideAddSteps(steps);
    }

    componentWillReceiveProps(nextProps) {
        // Only show page loading once, before all sections have initially loaded.
        const { loadingPage } = this.state;
        if (loadingPage) {
            this.setState({
                loadingPage: (
                    !nextProps.notifications.fetched ||
                    !nextProps.runsList.fetched ||
                    !nextProps.featuredRunsList.fetched ||
                    !nextProps.userActivity.viewedJobs.fetched ||
                    !nextProps.users.fetched ||
                    !nextProps.groups.fetched
                ),
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

    componentWillUnmount() {
        clearInterval(this.autoRefreshIntervalId);
        this.autoRefreshIntervalId = null;
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
        browserHistory.push(`/exports?collection=${this.props.user.data.user.username}`);
    }

    isLoading() {
        return (
            this.state.loadingPage ||
            this.props.runsDeletion.deleting ||
            this.props.updatePermission.updating
        );
    }

    joyrideAddSteps(steps) {
        let newSteps = steps;

        if (!Array.isArray(newSteps)) {
            newSteps = [newSteps];
        }

        if (!newSteps.length) return;

        this.setState((currentState) => {
            const nextState = { ...currentState };
            nextState.steps = nextState.steps.concat(newSteps);
            return nextState;
        });
    }

    callback(data) {
        const { action, step, type } = data;
        if (action === 'close' || action === 'skip' || type === 'finished') {
            this.setState({ isRunning: false });
            this.joyride.reset(true);
            window.location.hash = '';
        }

        if (step && step.scrollToId) {
            window.location.hash = step.scrollToId;
        }
    }

    handleWalkthroughClick() {
        if (this.state.isRunning) {
            this.setState({ isRunning: false });
            this.joyride.reset(true);
        } else {
            const [...steps] = joyride.DashboardPage;
            this.setState({ isRunning: true, steps: [] });
            if (this.props.featuredRunsList.runs.length === 0) {
                const ix = steps.findIndex(s => s.selector === '.qa-DashboardSection-Featured');
                if (ix > -1) {
                    steps.splice(ix, 1);
                }
            }
            this.joyrideAddSteps(steps);
        }
    }

    render() {
        const mainAppBarHeight = 95;
        const pageAppBarHeight = 35;
        const styles = {
            root: {
                position: 'relative',
                height: window.innerHeight - mainAppBarHeight,
                width: '100%',
                backgroundImage: `url(${background})`,
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
                margin: `0 ${10 + (this.getGridPadding() / 2)}px`,
                padding: '22px',
                fontSize: '18px',
                color: 'rgba(0, 0, 0, 0.54)',
            },
            link: {
                color: '#337ab7',
            },
            tourButton: {
                color: '#4598bf',
                cursor: 'pointer',
                display: 'inline-block',
                marginLeft: '10px',
                fontSize: '16px',
            },
            tourIcon: {
                color: '#4598bf',
                cursor: 'pointer',
                height: '18px',
                width: '18px',
                verticalAlign: 'middle',
                marginRight: '5px',
                marginBottom: '5px',
            },
        };

        const iconElementRight = (
            <EnhancedButton
                onClick={this.handleWalkthroughClick}
                style={styles.tourButton}
            >
                <Help style={styles.tourIcon} />
                Page Tour
            </EnhancedButton>
        );

        return (
            <div style={styles.root}>
                <AppBar
                    id="Dashboard"
                    className="qa-Dashboard-AppBar"
                    style={styles.appBar}
                    title="Dashboard"
                    titleStyle={styles.pageTitle}
                    iconElementLeft={<p />}
                    iconElementRight={iconElementRight}
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
                <CustomScrollbar
                    style={styles.customScrollbar}
                    ref={(instance) => { this.scrollbar = instance; }}
                >
                    <Joyride
                        callback={this.callback}
                        ref={(instance) => { this.joyride = instance; }}
                        steps={this.state.steps}
                        autoStart
                        type="continuous"
                        showSkipButton
                        showStepsProgress
                        locale={{
                            back: (<span>Back</span>),
                            close: (<span>Close</span>),
                            last: (<span>Done</span>),
                            next: (<span>Next</span>),
                            skip: (<span>Skip</span>),
                        }}
                        run={this.state.isRunning}
                        styles={{
                            options: {
                                overlayColor: '#4598bf',
                                backgroundColor: '#4598bf',
                                primaryColor: '#fff',
                            },
                        }}
                    />
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
                                    <Paper
                                        className="qa-DashboardSection-Notifications-NoData"
                                        style={styles.noData}
                                    >
                                        <span>{"You don't have any notifications."}</span>
                                    </Paper>
                                }
                                rowMajor={false}
                            >
                                {this.props.notifications.notificationsSorted.map(notification => (
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
                                    <Paper
                                        className="qa-DashboardSection-RecentlyViewed-NoData"
                                        style={styles.noData}
                                    >
                                        <span>{"You don't have any recently viewed DataPacks."}&nbsp;</span>
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
                                            onRunShare={this.props.updateDataCartPermissions}
                                            providers={this.props.providers}
                                            adminPermission={userIsDataPackAdmin(
                                                this.props.user.data.user,
                                                run.job.permissions, this.props.groups.groups,
                                            )}
                                            gridName="RecentlyViewed"
                                            index={index}
                                            showFeaturedFlag={false}
                                            users={this.props.users.users}
                                            groups={this.props.groups.groups}
                                        />
                                    );
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
                                    <Paper
                                        className="qa-DashboardSection-MyDataPacks-NoData"
                                        style={styles.noData}
                                    >
                                        <span>{"You don't have any DataPacks."}&nbsp;</span>
                                        <Link
                                            to="/create"
                                            href="/create"
                                            style={styles.link}
                                        >
                                            Create DataPack
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
                                        onRunShare={this.props.updateDataCartPermissions}
                                        providers={this.props.providers}
                                        adminPermission={userIsDataPackAdmin(
                                            this.props.user.data.user,
                                            run.job.permissions, this.props.groups.groups,
                                        )}
                                        gridName="MyDataPacks"
                                        index={index}
                                        showFeaturedFlag={false}
                                        users={this.props.users.users}
                                        groups={this.props.groups.groups}
                                    />
                                ))}
                            </DashboardSection>
                        </div>
                    }
                </CustomScrollbar>
            </div>
        );
    }
}

DashboardPage.propTypes = {
    router: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired,
    userActivity: PropTypes.shape({
        viewedJobs: PropTypes.shape({
            fetched: PropTypes.bool,
            viewedJobs: PropTypes.arrayOf(PropTypes.object),
        }),
    }).isRequired,
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
    updateDataCartPermissions: PropTypes.func.isRequired,
    getGroups: PropTypes.func.isRequired,
    getUsers: PropTypes.func.isRequired,
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
        getRuns: args => dispatch(getRuns(args)),
        getFeaturedRuns: args => dispatch(getFeaturedRuns(args)),
        getViewedJobs: args => dispatch(getViewedJobs(args)),
        getProviders: () => dispatch(getProviders()),
        deleteRuns: uid => dispatch(deleteRuns(uid)),
        getNotifications: args => dispatch(getNotifications(args)),
        updateDataCartPermissions: (uid, permissions) => dispatch(updateDataCartPermissions(uid, permissions)),
        getUsers: () => dispatch(getUsers()),
        getGroups: () => dispatch(getGroups()),
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(DashboardPage);
