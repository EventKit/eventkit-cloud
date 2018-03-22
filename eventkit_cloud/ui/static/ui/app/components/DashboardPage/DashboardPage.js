import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { AppBar, CircularProgress } from 'material-ui';
import { deleteRuns, getFeaturedRuns, getRuns } from '../../actions/dataPackActions';
import { getViewedJobs } from '../../actions/userActions';
import CustomScrollbar from '../CustomScrollbar';
import { getProviders } from '../../actions/exportsActions';
import { DashboardSection } from './DashboardSection';
import DataPackGridItem from '../DataPackPage/DataPackGridItem';
import DataPackWideItem from './DataPackWideItem';
import NotificationGridItem from './NotificationGridItem';

const backgroundUrl = require('../../../images/ek_topo_pattern.png');

export class DashboardPage extends React.Component {
    constructor(props) {
        super(props);
        this.getNotificationsColumns = this.getNotificationsColumns.bind(this);
        this.getNotificationsRows = this.getNotificationsRows.bind(this);
        this.getGridColumns = this.getGridColumns.bind(this);
        this.getGridWideColumns = this.getGridWideColumns.bind(this);
        this.refreshMyDataPacks = this.refreshMyDataPacks.bind(this);
        this.refreshFeatured = this.refreshFeatured.bind(this);
        this.refreshRecentlyViewed = this.refreshRecentlyViewed.bind(this);
        this.refresh = this.refresh.bind(this);
        this.isLoading = this.isLoading.bind(this);
        this.state = {
            loadingPage: true,
            loadingSections: {
                myDataPacks: true,
                featured: true,
                recentlyViewed: true,
            },
        };
        this.refreshInterval = 10000;
    }

    componentDidMount() {
        this.props.getProviders();
        this.refreshIntervalId = setInterval(this.refresh, this.refreshInterval);
        this.refresh();
    }

    componentWillUnmount() {
        clearInterval(this.refreshIntervalId);
    }

    componentWillReceiveProps(nextProps) {
        const loadingSections = {...this.state.loadingSections};

        // My datapacks.
        if (nextProps.runsList.fetched && !this.props.runsList.fetched) {
            loadingSections.myDataPacks = false;
        }

        // Featured datapacks.
        if (nextProps.featuredRunsList.fetched && !this.props.featuredRunsList.fetched) {
            loadingSections.featured = false;
        }

        // Received viewed datapacks.
        if (nextProps.user.viewedJobs.fetched && !this.props.user.viewedJobs.fetched) {
            loadingSections.recentlyViewed = false;
        }

        // Only show page loading once, before all sections have initially loaded.
        let loadingPage = this.state.loadingPage;
        if (loadingPage) {
            loadingPage = false;
            for (const loadingSection of Object.values(loadingSections)) {
                if (loadingSection) {
                    loadingPage = true;
                    break;
                }
            }
        }

        this.setState({
            loadingPage: loadingPage,
            loadingSections: loadingSections,
        });

        // Deleted datapack.
        if (nextProps.runsDeletion.deleted && !this.props.runsDeletion.deleted) {
            this.refresh();
        }
    }

    getGridColumns() {
        if (window.innerWidth > 1920) {
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

    getGridWideColumns() {
        if (window.innerWidth > 1600) {
            return 2;
        }

        return 1;
    }

    getNotificationsColumns() {
        if (window.innerWidth > 1600) {
            return 3;
        } else if (window.innerWidth > 1024) {
            return 2;
        }

        return 1;
    }

    getNotificationsRows() {
        return 3;
    }

    refreshMyDataPacks({ showLoading = true } = {}) {
        this.props.getRuns({
            pageSize: 6,
            ordering: '-started_at',
            ownerFilter: this.props.user.data.user.username,
        });

        if (showLoading) {
            const loadingSections = {...this.state.loadingSections};
            loadingSections.myDataPacks = true;
            this.setState({ loadingSection: loadingSections });
        }
    }

    refreshFeatured({ showLoading = true } = {}) {
        this.props.getFeaturedRuns({ pageSize: 6 });

        if (showLoading) {
            const loadingSections = {...this.state.loadingSections};
            loadingSections.featured = true;
            this.setState({ loadingSection: loadingSections });
        }
    }

    refreshRecentlyViewed({ showLoading = true } = {}) {
        this.props.getViewedJobs({ pageSize: 6 });

        if (showLoading) {
            const loadingSections = {...this.state.loadingSections};
            loadingSections.recentlyViewed = true;
            this.setState({ loadingSection: loadingSections });
        }
    }

    refresh({ showLoading = true } = {}) {
        this.refreshMyDataPacks({ showLoading: showLoading });
        this.refreshFeatured({ showLoading: showLoading });
        this.refreshRecentlyViewed({ showLoading: showLoading });
    }

    isLoading() {
        if (this.state.loadingPage) {
            return true;
        }

        for (const loadingSection of Object.values(this.state.loadingSections)) {
            if (loadingSection) {
                return true;
            }
        }

        return false;
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
        };

        const now = new Date();
        const mockNotifications = [
            {
                uid: 3,
                read: false,
                type: 'license-update',
                date: new Date().setMinutes(now.getMinutes() - 5),
            },
            {
                uid: 2,
                read: true,
                type: 'datapack-complete-error',
                date: new Date().setHours(now.getHours() - 5),
                data: {
                    run: {
                        uid: 2,
                        job: {
                            uid: 2,
                            name: 'B',
                        },
                        expiration: new Date(2018, 5, 1),
                    },
                },
            },
            {
                uid: 1,
                read: true,
                type: 'datapack-complete-success',
                date: new Date().setDate(now.getDate() - 5),
                data: {
                    run: {
                        uid: 1,
                        job: {
                            uid: 1,
                            name: 'A',
                        },
                        expiration: new Date(2018, 5, 1),
                    },
                },
            },
        ];

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
                    <div style={styles.loadingOverlay}>
                        <CircularProgress
                            style={styles.loadingPage}
                            color="#4598bf"
                            size={50}
                        />
                    </div>
                    :
                    null
                }
                <CustomScrollbar style={styles.customScrollbar}>
                    {this.state.loadingPage ?
                        null
                        :
                        <div style={styles.content}>
                            {/* Notifications */}
                            <DashboardSection
                                className="qa-DashboardSection-Notifications"
                                style={{marginBottom: '35px'}}
                                title="Notifications"
                                name="Notifications"
                                columns={this.getNotificationsColumns()}
                                rows={this.getNotificationsRows()}
                                user={this.props.user}
                                providers={this.props.providers}
                            >
                                {mockNotifications.map((notification, index) => (
                                    <NotificationGridItem
                                        key={`Notification-${index}`}
                                        notification={notification}
                                    />
                                ))}
                            </DashboardSection>

                            {/* Recently Viewed */}
                            <DashboardSection
                                className="qa-DashboardSection-RecentlyViewed"
                                style={{marginBottom: '35px'}}
                                title="Recently Viewed"
                                name="RecentlyViewed"
                                columns={this.getGridColumns()}
                                user={this.props.user}
                                providers={this.props.providers}
                            >
                                {this.props.user.viewedJobs.jobs.length === 0 ?
                                    <div className="qa-DashboardSection-RecentlyViewed-NoData">
                                        {"You haven't viewed any DataPacks yet..."}
                                    </div>
                                    :
                                    this.props.user.viewedJobs.jobs.map((job, index) => (
                                        <DataPackGridItem
                                            className={`qa-DashboardSection-RecentlyViewedGrid-Item`}
                                            run={job.last_export_run}
                                            user={this.props.user}
                                            key={`RecentlyViewedDataPack-${job.created_at}`}
                                            onRunDelete={this.props.deleteRuns}
                                            providers={this.props.providers}
                                            gridName="RecentlyViewed"
                                            index={index}
                                            showFeaturedFlag={false}
                                        />
                                    ))
                                }
                            </DashboardSection>

                            {/* Featured */}
                            {this.props.featuredRunsList.runs.length === 0 ?
                                null
                                :
                                <DashboardSection
                                    style={{marginBottom: '35px'}}
                                    title="Featured"
                                    name="Featured"
                                    columns={this.getGridWideColumns()}
                                    cellHeight={335}
                                    user={this.props.user}
                                    providers={this.props.providers}
                                >
                                    {this.props.featuredRunsList.runs.map((run, index) => (
                                        <DataPackWideItem
                                            className={`qa-DashboardSection-${this.props.name}Grid-WideItem`}
                                            run={run}
                                            user={this.props.user}
                                            key={`RecentlyViewedDataPack-${run.created_at}`}
                                            providers={this.props.providers}
                                            gridName="Featured"
                                            index={index}
                                            height={'335px'}
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
                                user={this.props.user}
                                providers={this.props.providers}
                            >
                                {this.props.runsList.runs.length === 0 ?
                                    <div className="qa-DashboardSection-MyDataPacks-NoData">
                                        {"You haven't created any DataPacks yet..."}
                                    </div>
                                    :
                                    this.props.runsList.runs.map((run, index) => (
                                        <DataPackGridItem
                                            className={`qa-DashboardSection-MyDataPacksGrid-Item`}
                                            run={run}
                                            user={this.props.user}
                                            key={`MyDataPacksDataPack-${run.created_at}`}
                                            onRunDelete={this.props.deleteRuns}
                                            providers={this.props.providers}
                                            gridName="MyDataPacks"
                                            index={index}
                                            showFeaturedFlag={false}
                                        />
                                    ))
                                }
                            </DashboardSection>
                        </div>
                    }
                </CustomScrollbar>
            </div>
        );
    }
}

DashboardPage.propTypes = {
    getViewedJobs: PropTypes.func.isRequired,
    user: PropTypes.object.isRequired,
    getProviders: PropTypes.func.isRequired,
    deleteRuns: PropTypes.func.isRequired,
    runsDeletion: PropTypes.object.isRequired,
    getRuns: PropTypes.func.isRequired,
    getFeaturedRuns: PropTypes.func.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
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
};

function mapStateToProps(state) {
    return {
        user: state.user,
        providers: state.providers,
        runsDeletion: state.runsDeletion,
        runsList: state.runsList,
        featuredRunsList: state.featuredRunsList,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getRuns: (args) => dispatch(getRuns(args)),
        getFeaturedRuns: (args) => dispatch(getFeaturedRuns(args)),
        getViewedJobs: (args) => dispatch(getViewedJobs(args)),
        getProviders: () => dispatch(getProviders()),
        deleteRuns: (uid) => dispatch(deleteRuns(uid)),
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(DashboardPage);
