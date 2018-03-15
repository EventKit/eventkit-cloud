import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { AppBar, CircularProgress, GridList, Tab, Tabs } from 'material-ui';
import { deleteRuns, getFeaturedRuns, getRuns } from '../../actions/dataPackActions';
import { getViewedJobs } from '../../actions/userActions';
import CustomScrollbar from '../CustomScrollbar';
import DataPackGridItem from '../DataPackPage/DataPackGridItem';
import { getProviders } from '../../actions/exportsActions';
import DataPackWideItem from './DataPackWideItem';
import SwipeableViews from 'react-swipeable-views';

const backgroundUrl = require('../../../images/ek_topo_pattern.png');

export class DashboardPage extends React.Component {
    constructor(props) {
        super(props);
        this.getGridColumns = this.getGridColumns.bind(this);
        this.getGridWideColumns = this.getGridWideColumns.bind(this);
        this.getGridPadding = this.getGridPadding.bind(this);
        this.refreshMyDataPacks = this.refreshMyDataPacks.bind(this);
        this.refreshFeatured = this.refreshFeatured.bind(this);
        this.refreshRecentlyViewed = this.refreshRecentlyViewed.bind(this);
        this.refresh = this.refresh.bind(this);
        this.isLoading = this.isLoading.bind(this);
        this.handleRecentlyViewedPageChange = this.handleRecentlyViewedPageChange.bind(this);
        this.handleFeaturedPageChange = this.handleFeaturedPageChange.bind(this);
        this.handleMyDataPacksPageChange = this.handleMyDataPacksPageChange.bind(this);
        this.state = {
            loadingPage: true,
            loadingSections: {
                myDataPacks: true,
                featured: true,
                recentlyViewed: true,
            },
            recentlyViewedPageIndex: 0,
            featuredPageIndex: 0,
            myDataPacksPageIndex: 0,
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

    getGridPadding() {
        return window.innerWidth >= 768 ? 7 : 2;
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

    handleRecentlyViewedPageChange(index) {
        this.setState({
            recentlyViewedPageIndex: index,
        });
    }

    handleFeaturedPageChange(index) {
        this.setState({
            featuredPageIndex: index,
        });
    }

    handleMyDataPacksPageChange(index) {
        this.setState({
            myDataPacksPageIndex: index,
        });
    }

    render() {
        const spacing = window.innerWidth > 575 ? '10px' : '2px';
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
            sectionHeader: {
                margin: '12px 0 13px',
                paddingLeft: '13px',
                fontSize: '27px',
                fontWeight: 'bold',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
            },
            tabButtonsContainer: {
                position: 'absolute',
                height: '35px',
                top: '-46px',
                right: '-50px',
                width: '200px',
                backgroundColor: 'rgba(0, 0, 0, 0)',
            },
            tabButton: {
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                backgroundColor: 'white',
                border: '3px solid rgb(68, 152, 192)',
                margin: '0',
                transition: 'border 0.25s',
            },
            tab: {
                width: 'auto',
                margin: '0 4px',
                padding: '0 4px',
            },
            tabContent: {
                marginLeft: spacing,
                marginRight: spacing,
                paddingBottom: spacing,
            },
            swipeableViews: {
                width: '100%',
            },
            gridList: {
                border: '1px',
                width: '100%',
                height: 'auto',
                margin: '0',
                paddingLeft: spacing,
                paddingRight: spacing,
            },
        };

        // Inherited styles.
        styles = {
            ...styles,
            tabDisabled: {
                ...styles.tab,
                pointerEvents: 'none',
            },
            tabButtonDisabled: {
                ...styles.tabButton,
                backgroundColor: 'lightgray',
                border: '3px solid gray',
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

        const tabButtonBorderStyle = (selected) => {
            return selected ? '8px solid rgb(68, 152, 192)' : '3px solid rgb(68, 152, 192)';
        };

        // Split datapacks into pages based on the screen width.
        const viewedJobsPages = buildPagedArray(this.props.user.viewedJobs.jobs, this.getGridColumns());
        const featuredDataPacksPages = buildPagedArray(this.props.featuredRunsList.runs, this.getGridWideColumns());
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
                            {/* Recently Viewed */}
                            <div
                                className="qa-Dashboard-RecentlyViewedHeader"
                                style={styles.sectionHeader}
                            >
                                Recently Viewed
                            </div>
                            <div style={{marginBottom: '35px'}}>
                                {viewedJobsPages.length > 0 ?
                                    <div>
                                        <Tabs
                                            style={{position: 'relative', width: '100%'}}
                                            tabItemContainerStyle={styles.tabButtonsContainer}
                                            inkBarStyle={{display: 'none'}}
                                            onChange={this.handleRecentlyViewedPageChange}
                                            value={this.state.recentlyViewedPageIndex}
                                        >
                                            {[...Array(3)].map((nothing, pageIndex) => (
                                                <Tab
                                                    key={`RecentlyViewedTab${pageIndex}`}
                                                    value={pageIndex}
                                                    style={(pageIndex < viewedJobsPages.length) ? styles.tab : styles.tabDisabled}
                                                    disableTouchRipple={true}
                                                    buttonStyle={(pageIndex < viewedJobsPages.length) ?
                                                        {
                                                            ...styles.tabButton,
                                                            border: tabButtonBorderStyle(pageIndex === this.state.recentlyViewedPageIndex)
                                                        }
                                                        :
                                                        styles.tabButtonDisabled
                                                    }
                                                >
                                                </Tab>
                                            ))}
                                        </Tabs>
                                        <SwipeableViews
                                            style={styles.swipeableViews}
                                            index={this.state.recentlyViewedPageIndex}
                                            onChangeIndex={this.handleRecentlyViewedPageChange}
                                        >
                                            {viewedJobsPages.map((viewedJobsPage, pageIndex) => (
                                                <GridList
                                                    key={`RecentlyViewedGridList${pageIndex}`}
                                                    className="qa-Dashboard-RecentlyViewedGrid"
                                                    cellHeight="auto"
                                                    style={styles.gridList}
                                                    padding={this.getGridPadding()}
                                                    cols={this.getGridColumns()}
                                                >
                                                    {viewedJobsPage.map((viewedJob, index) => (
                                                        <DataPackGridItem
                                                            className="qa-Dashboard-RecentlyViewedGrid-Item"
                                                            run={viewedJob.last_export_run}
                                                            user={this.props.user}
                                                            key={viewedJob.created_at}
                                                            onRunDelete={this.props.deleteRuns}
                                                            providers={this.props.providers}
                                                            gridName="RecentlyViewed"
                                                            index={index}
                                                            showFeaturedFlag={false}
                                                        />
                                                    ))}
                                                </GridList>
                                            ))}
                                        </SwipeableViews>
                                    </div>
                                    :
                                    <div className="qa-Dashboard-RecentlyViewed-NoData">{"You haven't viewed any DataPacks yet..."}</div>
                                }
                            </div>

                            {/* Featured */}
                            {featuredDataPacksPages.length > 0 ?
                                <div>
                                    <div
                                        className="qa-Dashboard-FeaturedHeader"
                                        style={styles.sectionHeader}
                                    >
                                        Featured
                                    </div>
                                    <div style={{marginBottom: '35px'}}>
                                        <Tabs
                                            style={{position: 'relative', width: '100%'}}
                                            tabItemContainerStyle={styles.tabButtonsContainer}
                                            inkBarStyle={{display: 'none'}}
                                            onChange={this.handleFeaturedPageChange}
                                            value={this.state.featuredPageIndex}
                                        >
                                            {[...Array(3)].map((nothing, pageIndex) => (
                                                <Tab
                                                    key={`FeaturedTab${pageIndex}`}
                                                    value={pageIndex}
                                                    style={(pageIndex < featuredDataPacksPages.length) ? styles.tab : styles.tabDisabled}
                                                    disableTouchRipple={true}
                                                    buttonStyle={(pageIndex < featuredDataPacksPages.length) ?
                                                        {
                                                            ...styles.tabButton,
                                                            border: tabButtonBorderStyle(pageIndex === this.state.featuredPageIndex)
                                                        }
                                                        :
                                                        styles.tabButtonDisabled
                                                    }
                                                >
                                                </Tab>
                                            ))}
                                        </Tabs>
                                        <SwipeableViews
                                            style={styles.swipeableViews}
                                            index={this.state.featuredPageIndex}
                                            onChangeIndex={this.handleFeaturedPageChange}
                                        >
                                            {featuredDataPacksPages.map((featuredDataPacksPage, pageIndex) => (
                                                <GridList
                                                    key={`FeaturedGridList${pageIndex}`}
                                                    className="qa-Dashboard-FeaturedGrid"
                                                    cellHeight={335}
                                                    style={styles.gridList}
                                                    padding={this.getGridPadding()}
                                                    cols={this.getGridWideColumns()}
                                                >
                                                    {featuredDataPacksPage.map((run, index) => (
                                                        <DataPackWideItem
                                                            className="qa-Dashboard-FeaturedGrid-Item"
                                                            run={run}
                                                            user={this.props.user}
                                                            key={run.created_at}
                                                            providers={this.props.providers}
                                                            gridName="Featured"
                                                            index={index}
                                                            height={'335px'}
                                                        />
                                                    ))}
                                                </GridList>
                                            ))}
                                        </SwipeableViews>
                                    </div>
                                </div>
                                :
                                null
                            }

                            {/* My DataPacks */}
                            <div
                                className="qa-Dashboard-MyDataPacksHeader"
                                style={styles.sectionHeader}
                            >
                                My DataPacks
                            </div>
                            <div>
                                {myDataPacksPages.length > 0 ?
                                    <div>
                                        <Tabs
                                            style={{position: 'relative', width: '100%'}}
                                            tabItemContainerStyle={styles.tabButtonsContainer}
                                            inkBarStyle={{display: 'none'}}
                                            onChange={this.handleMyDataPacksPageChange}
                                            value={this.state.myDataPacksPageIndex}
                                        >
                                            {[...Array(3)].map((nothing, pageIndex) => (
                                                <Tab
                                                    key={`MyDataPacksTab${pageIndex}`}
                                                    value={pageIndex}
                                                    style={(pageIndex < myDataPacksPages.length) ? styles.tab : styles.tabDisabled}
                                                    disableTouchRipple={true}
                                                    buttonStyle={(pageIndex < myDataPacksPages.length) ?
                                                        {
                                                            ...styles.tabButton,
                                                            border: tabButtonBorderStyle(pageIndex === this.state.myDataPacksPageIndex)
                                                        }
                                                        :
                                                        styles.tabButtonDisabled
                                                    }
                                                >
                                                </Tab>
                                            ))}
                                        </Tabs>
                                        <SwipeableViews
                                            style={styles.swipeableViews}
                                            index={this.state.myDataPacksPageIndex}
                                            onChangeIndex={this.handleMyDataPacksPageChange}
                                        >
                                            {myDataPacksPages.map((myDataPacksPage, pageIndex) => (
                                                <GridList
                                                    key={`MyDataPacksGridList${pageIndex}`}
                                                    className="qa-Dashboard-MyDataPacksGrid"
                                                    cellHeight="auto"
                                                    style={styles.gridList}
                                                    padding={this.getGridPadding()}
                                                    cols={this.getGridColumns()}
                                                >
                                                    {myDataPacksPage.map((run, index) => (
                                                        <DataPackGridItem
                                                            className="qa-Dashboard-MyDataPacksGrid-Item"
                                                            run={run}
                                                            user={this.props.user}
                                                            key={run.created_at}
                                                            onRunDelete={this.props.deleteRuns}
                                                            providers={this.props.providers}
                                                            gridName="MyDataPacks"
                                                            index={index}
                                                            showFeaturedFlag={false}
                                                        />
                                                    ))}
                                                </GridList>
                                            ))}
                                        </SwipeableViews>
                                    </div>
                                    :
                                    <div className="qa-Dashboard-MyDataPacks-NoData">{"You haven't created any DataPacks yet..."}</div>
                                }
                            </div>
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
