import * as React from 'react';
import { connect } from 'react-redux';
import * as debounce from 'lodash/debounce';
import { withTheme, Theme } from '@material-ui/core/styles';
import { Link, browserHistory } from 'react-router';
import Joyride from 'react-joyride';
import Help from '@material-ui/icons/Help';
import Paper from '@material-ui/core/Paper';
import ButtonBase from '@material-ui/core/ButtonBase';
import PageHeader from '../common/PageHeader';
import PageLoading from '../common/PageLoading';
import { deleteRun, getFeaturedRuns, getRuns } from '../../actions/datapackActions';
import { getViewedJobs } from '../../actions/userActivityActions';
import { getNotifications } from '../../actions/notificationsActions';
import CustomScrollbar from '../CustomScrollbar';
import { getProviders } from '../../actions/providerActions';
import DashboardSection from './DashboardSection';
import DataPackGridItem from '../DataPackPage/DataPackGridItem';
import DataPackFeaturedItem from './DataPackFeaturedItem';
import NotificationGridItem from '../Notification/NotificationGridItem';
import { updateDataCartPermissions } from '../../actions/datacartActions';
import { joyride } from '../../joyride.config';

export const CUSTOM_BREAKPOINTS = {
    xl: 1920,
    lg: 1600,
    md: 1024,
    sm: 768,
};

interface Props {
    router: object;
    notificationsData: Eventkit.Store.NotificationsData;
    notificationsStatus: Eventkit.Store.NotificationsStatus;
    providers: Eventkit.Provider[];
    runDeletion: Eventkit.Store.RunDeletion;
    ownIds: string[];
    featuredIds: string[];
    viewedIds: string[];
    runsFetched: boolean;
    featuredRunsFetched: boolean;
    viewedRunsFetched: boolean;
    getRuns: (options?: object) => void;
    getFeaturedRuns: (options?: object) => void;
    getViewedJobs: (options?: object) => void;
    getProviders: (options?: object) => void;
    deleteRun: (options?: object) => void;
    getNotifications: (options?: object) => void;
    updatePermission: Eventkit.Store.UpdatePermissions;
    updateDataCartPermissions: () => void;
    theme: Eventkit.Theme;

    userData: any;
}

interface State {
    loadingPage: boolean;
    steps: object[];
    isRunning: boolean;
    width: string;
}

export class DashboardPage extends React.Component<Props, State> {
    private autoRefreshIntervalId: number | undefined = undefined;
    private autoRefreshInterval: number = 10000;
    private onResize: () => void;
    private joyride;

    constructor(props) {
        super(props);
        this.getWidth = this.getWidth.bind(this);
        this.setScreenSize = this.setScreenSize.bind(this);
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
            loadingPage: this.isLoading(),
            steps: [],
            isRunning: false,
            width: this.getWidth(),
        };
        this.onResize = debounce(this.setScreenSize, 166);
    }

    componentDidMount() {
        this.props.getProviders();
        this.props.getNotifications({
            pageSize: this.getNotificationsColumns({ getMax: true }) * this.getNotificationsRows() * 3,
        });
        this.refresh();
        this.autoRefreshIntervalId = window.setInterval(this.autoRefresh, this.autoRefreshInterval);
        const steps = joyride.DashboardPage;
        this.joyrideAddSteps(steps);
        window.addEventListener('resize', this.onResize);
    }

    shouldComponentUpdate(p, s) {
        const status = p.notificationsStatus;
        const oldStatus = this.props.notificationsStatus;

        // if the status object has changed we need to inspect
        if (status !== oldStatus) {
            // if there is a error change we need to update
            if (status.error !== oldStatus.error) {
                return true;
            }
            // if a fetch has completed AND the data has changed we need to update
            if (status.fetched && p.notificationsData !== this.props.notificationsData) {
                return true;
            }
            // any other status change can be ignored
            return false;
        }

        if (p.runsFetched !== this.props.runsFetched ||
            p.featuredRunsFetched !== this.props.featuredRunsFetched ||
            p.viewedRunsFetched !== this.props.viewedRunsFetched
        ) {
                return this.state.loadingPage;
        }
        // if the status is not the update we can default to true
        return true;
    }

    componentDidUpdate(prevProps) {
        // Only show page loading once, before all sections have initially loaded.
        const { loadingPage } = this.state;
        if (loadingPage && !this.isLoading()) {
            this.setState({ loadingPage: false });
        }

        // Deleted datapack.
        if (this.props.runDeletion.deleted && !prevProps.runDeletion.deleted) {
            this.refresh();
        }

        // Updated permissions.
        if (this.props.updatePermission.updated && !prevProps.updatePermission.updated) {
            this.refresh();
        }
    }

    componentWillUnmount() {
        window.clearInterval(this.autoRefreshIntervalId);
        this.autoRefreshIntervalId = undefined;
        window.removeEventListener('resize', this.onResize);
    }

    private getWidth() {
        const width = window.innerWidth;
        let value = 'xs';
        if (width >= CUSTOM_BREAKPOINTS.xl) {
            value = 'xl';
        } else if (width >= CUSTOM_BREAKPOINTS.lg) {
            value = 'lg';
        } else if (width >= CUSTOM_BREAKPOINTS.md) {
            value = 'md';
        } else if (width >= CUSTOM_BREAKPOINTS.sm) {
            value = 'sm';
        }

        return value;
    }

    private setScreenSize() {
        const width = this.getWidth();

        if (width !== this.state.width) {
            this.setState({ width });
        }
    }

    private getGridPadding() {
        return this.state.width !== 'xs' ? 6 : 2;
    }

    private getGridColumns({ getMax = false } = {}) {
        const { width } = this.state;
        if (width === 'xl' || getMax) {
            return 6;
        } else if (width === 'lg') {
            return 5;
        } else if (width === 'md') {
            return 4;
        } else if (width === 'sm') {
            return 3;
        }

        return 2;
    }

    private getGridWideColumns({ getMax = false } = {}) {
        if (this.state.width === 'lg' || this.state.width === 'xl' || getMax) {
            return 2;
        }

        return 1;
    }

    private getNotificationsColumns({ getMax = false } = {}) {
        if (this.state.width === 'lg' || this.state.width === 'xl' || getMax) {
            return 3;
        } else if (this.state.width === 'md') {
            return 2;
        }

        return 1;
    }

    private getNotificationsRows() {
        return 3;
    }

    private refreshMyDataPacks({ isAuto = false } = {}) {
        this.props.getRuns({
            pageSize: this.getGridColumns({ getMax: true }) * 3,
            ordering: '-started_at',
            ownerFilter: this.props.userData.user.username,
            isAuto,
        });
    }

    private refreshFeatured({ isAuto = false } = {}) {
        this.props.getFeaturedRuns({
            pageSize: this.getGridWideColumns({ getMax: true }) * 3,
            isAuto,
        });
    }

    private refreshRecentlyViewed({ isAuto = false } = {}) {
        this.props.getViewedJobs({
            pageSize: this.getGridColumns({ getMax: true }) * 3,
            isAuto,
        });
    }

    private refresh({ isAuto = false } = {}) {
        this.refreshMyDataPacks({ isAuto });
        this.refreshFeatured({ isAuto });
        this.refreshRecentlyViewed({ isAuto });
    }

    private autoRefresh() {
        this.refresh({ isAuto: true });
    }

    private handleNotificationsViewAll() {
        browserHistory.push('/notifications');
    }

    private handleFeaturedViewAll() {
        browserHistory.push('/exports');
    }

    private handleMyDataPacksViewAll() {
        browserHistory.push(`/exports?collection=${this.props.userData.user.username}`);
    }

    private isLoading() {
        return (
            this.props.notificationsStatus === null ||
            this.props.runsFetched === null ||
            this.props.featuredRunsFetched === null ||
            this.props.viewedRunsFetched === null ||
            this.props.runDeletion.deleting ||
            this.props.updatePermission.updating
        );
    }

    private joyrideAddSteps(steps) {
        let newSteps = steps;

        if (!Array.isArray(newSteps)) {
            newSteps = [newSteps];
        }

        if (!newSteps.length) { return; }

        this.setState(currentState => {
            const nextState = { ...currentState };
            nextState.steps = nextState.steps.concat(newSteps);
            return nextState;
        });
    }

    private callback(data) {
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

    private handleWalkthroughClick() {
        if (this.state.isRunning) {
            this.setState({ isRunning: false });
            this.joyride.reset(true);
        } else {
            const [...steps] = joyride.DashboardPage;
            this.setState({ isRunning: true, steps: [] });
            if (this.props.featuredIds.length === 0) {
                const ix = steps.findIndex(s => s.selector === '.qa-DashboardSection-Featured');
                if (ix > -1) {
                    steps.splice(ix, 1);
                }
            }
            this.joyrideAddSteps(steps);
        }
    }

    render() {
        const { colors, images } = this.props.theme.eventkit;

        const mainAppBarHeight = 95;
        const pageAppBarHeight = 35;
        const styles = {
            root: {
                position: 'relative' as 'relative',
                height: `calc(100vh - ${mainAppBarHeight}px)`,
                width: '100%',
                backgroundImage: `url(${images.topo_dark})`,
            },
            customScrollbar: {
                height: `calc(100vh - ${mainAppBarHeight + pageAppBarHeight}px)`,
            },
            loadingOverlay: {
                position: 'absolute' as 'absolute',
                height: '100%',
                width: '100%',
                background: colors.backdrop,
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
                color: colors.grey,
            },
            link: {
                color: colors.primary,
            },
            tourButton: {
                color: colors.primary,
                cursor: 'pointer',
                display: 'inline-block',
                marginLeft: '10px',
                fontSize: '14px',
                height: '30px',
                lineHeight: '30px',
            },
            tourIcon: {
                color: colors.primary,
                cursor: 'pointer',
                height: '18px',
                width: '18px',
                verticalAlign: 'middle',
                marginRight: '5px',
                marginBottom: '5px',
            },
        };

        const iconElementRight = (
            <ButtonBase
                onClick={this.handleWalkthroughClick}
                style={styles.tourButton}
            >
                <Help style={styles.tourIcon} />
                Page Tour
            </ButtonBase>
        );

        return (
            <div style={styles.root}>
                <PageHeader
                    id="Dashboard"
                    className="qa-Dashboard-PageHeader"
                    title="Dashboard"
                >
                    {iconElementRight}
                </PageHeader>
                {this.isLoading() ?
                    <PageLoading background="transparent" />
                    : null
                }
                <CustomScrollbar
                    style={styles.customScrollbar}
                >
                    <Joyride
                        callback={this.callback}
                        ref={instance => { this.joyride = instance; }}
                        // @ts-ignore
                        steps={this.state.steps}
                        autoStart
                        type="continuous"
                        showSkipButton
                        showStepsProgress
                        locale={{
                            // @ts-ignore
                            back: (<span>Back</span>),
                            // @ts-ignore
                            close: (<span>Close</span>),
                            // @ts-ignore
                            last: (<span>Done</span>),
                            // @ts-ignore
                            next: (<span>Next</span>),
                            // @ts-ignore
                            skip: (<span>Skip</span>),
                        }}
                        run={this.state.isRunning}
                        styles={{
                            options: {
                                overlayColor: colors.primary,
                                backgroundColor: colors.primary,
                                primaryColor: colors.white,
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
                                {this.props.notificationsData.notificationsSorted.map(notification => (
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
                                {this.props.viewedIds.map((id, index) => {
                                    return (
                                        <DataPackGridItem
                                            className="qa-DashboardSection-RecentlyViewedGrid-Item"
                                            runId={id}
                                            userData={this.props.userData}
                                            key={`RecentlyViewedDataPack-${id}`}
                                            onRunDelete={this.props.deleteRun}
                                            onRunShare={this.props.updateDataCartPermissions}
                                            providers={this.props.providers}
                                            gridName="RecentlyViewed"
                                            index={index}
                                            showFeaturedFlag={false}
                                        />
                                    );
                                })}
                            </DashboardSection>

                            {/* Featured */}
                            {this.props.featuredIds.length === 0 ?
                                null
                                :
                                <DashboardSection
                                    className="qa-DashboardSection-Featured"
                                    title="Featured"
                                    name="Featured"
                                    columns={this.getGridWideColumns()}
                                    gridPadding={this.getGridPadding()}
                                    cellHeight={this.state.width !== 'xs' ? 335 : 435}
                                    onViewAll={this.handleFeaturedViewAll}
                                >
                                    {this.props.featuredIds.map((id, index) => (
                                        <DataPackFeaturedItem
                                            className="qa-DashboardSection-FeaturedGrid-WideItem"
                                            runId={id}
                                            key={`FeaturedDataPack-${id}`}
                                            gridName="Featured"
                                            index={index}
                                            height={this.state.width !== 'xs' ? '335px' : '435px'}
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
                                {this.props.ownIds.map((id, index) => (
                                    <DataPackGridItem
                                        className="qa-DashboardSection-MyDataPacksGrid-Item"
                                        runId={id}
                                        userData={this.props.userData}
                                        key={`MyDataPacksDataPack-${id}`}
                                        onRunDelete={this.props.deleteRun}
                                        onRunShare={this.props.updateDataCartPermissions}
                                        providers={this.props.providers}
                                        gridName="MyDataPacks"
                                        index={index}
                                        showFeaturedFlag={false}
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

function mapStateToProps(state) {
    return {
        userData: state.user.data,
        notificationsData: state.notifications.data,
        notificationsStatus: state.notifications.status,
        providers: state.providers,
        runDeletion: state.runDeletion,
        ownIds: state.exports.ownInfo.ids,
        featuredIds: state.exports.featuredInfo.ids,
        viewedIds: state.exports.viewedInfo.ids,
        runsFetched: state.exports.allInfo.status.fetched,
        featuredRunsFetched: state.exports.featuredInfo.status.fetched,
        viewedRunsFetched: state.exports.viewedInfo.status.fetched,
        updatePermission: state.updatePermission,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getRuns: args => dispatch(getRuns(args)),
        getFeaturedRuns: args => dispatch(getFeaturedRuns(args)),
        getViewedJobs: args => dispatch(getViewedJobs(args)),
        getProviders: () => dispatch(getProviders()),
        deleteRun: uid => dispatch(deleteRun(uid)),
        getNotifications: args => dispatch(getNotifications(args)),
        updateDataCartPermissions: (uid, permissions) => dispatch(updateDataCartPermissions(uid, permissions)),
    };
}

export default withTheme()<any>(connect(mapStateToProps, mapDispatchToProps)(DashboardPage));
