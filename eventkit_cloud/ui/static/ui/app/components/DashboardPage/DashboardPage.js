import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { AppBar, CircularProgress } from 'material-ui';
import { deleteRuns, getFeaturedRuns, getRuns } from '../../actions/dataPackActions';
import { getViewedJobs } from '../../actions/userActions';
import CustomScrollbar from '../CustomScrollbar';
import { getProviders } from '../../actions/exportsActions';
import { DashboardSection } from './DashboardSection';

const backgroundUrl = require('../../../images/ek_topo_pattern.png');

export class DashboardPage extends React.Component {
    constructor(props) {
        super(props);
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
        } else if (window.innerWidth > 1400) {
            return 5;
        } else if (window.innerWidth > 1024) {
            return 4;
        }

        return 3;
    }

    getGridWideColumns() {
        if (window.innerWidth > 1500) {
            return 2;
        }

        return 1;
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
        };

        const buildPagedArray = (array, itemsPerPage, maxPages = 3) => {
            const pagedArray = [];
            for (let i = 0; i < array.length; i += itemsPerPage) {
                pagedArray.push(array.slice(i, i + itemsPerPage));
                if (pagedArray.length === maxPages) {
                    break;
                }
            }

            return pagedArray;
        };

        // Split datapacks into pages based on the screen width.
        const viewedJobsRuns = this.props.user.viewedJobs.jobs.map((job) => job.last_export_run);
        const recentlyViewedPages = buildPagedArray(viewedJobsRuns, this.getGridColumns());
        const featuredPages = buildPagedArray(this.props.featuredRunsList.runs, this.getGridWideColumns());
        const myDataPacksPages = buildPagedArray(this.props.runsList.runs, this.getGridColumns());

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
                    {!this.state.loadingPage ?
                        <div style={{marginBottom: '12px'}}>
                            <DashboardSection
                                style={{marginBottom: '35px'}}
                                title="Recently Viewed"
                                name="RecentlyViewed"
                                user={this.props.user}
                                providers={this.props.providers}
                                dataPackPages={recentlyViewedPages}
                                deleteRuns={this.props.deleteRuns}
                                noDataMessage="You haven't viewed any DataPacks yet..."
                                columns={this.getGridColumns()}
                            />

                            {featuredPages.length > 0 ?
                                <DashboardSection
                                    style={{marginBottom: '35px'}}
                                    title="Featured"
                                    name="Featured"
                                    user={this.props.user}
                                    providers={this.props.providers}
                                    dataPackPages={featuredPages}
                                    wide={true}
                                    itemHeight={335}
                                    columns={this.getGridWideColumns()}
                                />
                                :
                                null
                            }

                            <DashboardSection
                                title="My DataPacks"
                                name="MyDataPacks"
                                user={this.props.user}
                                providers={this.props.providers}
                                dataPackPages={myDataPacksPages}
                                deleteRuns={this.props.deleteRuns}
                                noDataMessage="You haven't created any DataPacks yet..."
                                columns={this.getGridColumns()}
                            />
                        </div>
                        :
                        null
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
