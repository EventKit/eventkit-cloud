import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { AppBar, CircularProgress, GridList } from 'material-ui';
import { deleteRuns, getFeaturedRuns, getRuns } from '../../actions/dataPackActions';
import { getViewedJobs } from '../../actions/userActions';
import CustomScrollbar from '../CustomScrollbar';
import DataPackGridItem from '../DataPackPage/DataPackGridItem';
import { getProviders } from '../../actions/exportsActions';

const backgroundUrl = require('../../../images/ek_topo_pattern.png');

export class DashboardPage extends React.Component {
    constructor(props) {
        super(props);
        this.refresh = this.refresh.bind(this);
        this.state = {
            loadingPage: true,
            loadingSections: {
                myDataPacks: true,
                featuredDataPacks: true,
                viewedDataPacks: true,
            },
        };
    }

    componentDidMount() {
        this.props.getProviders();
        this.refreshIntervalId = setInterval(this.refresh, 10000);
        this.refresh({ showLoading: true });
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
            loadingSections.featuredDataPacks = false;
        }

        // Received viewed datapacks.
        if (nextProps.user.viewedJobs.fetched && !this.props.user.viewedJobs.fetched) {
            loadingSections.viewedDataPacks = false;
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
            this.refresh({ showLoading: true });
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

    getGridPadding() {
        return window.innerWidth >= 768 ? 7 : 2;
    }

    refresh({ showLoading = false } = {}) {
        this.props.getRuns({
            pageSize: 6,
            ordering: '-started_at',
            ownerFilter: this.props.user.data.user.username,
        });
        this.props.getFeaturedRuns({
            pageSize: 6,
        });
        this.props.getViewedJobs({
            pageSize: 6,
        });

        if (showLoading) {
            // Reset all loading flags.
            const loadingSections = {...this.state.loadingSections};
            for (const key of Object.keys(loadingSections)) {
                loadingSections[key] = true
            }

            this.setState({
                loadingSections: loadingSections
            });
        }
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
        const spacing = window.innerWidth > 575 ? '10px' : '2px';
        const mainAppBarHeight = 95;
        const pageAppBarHeight = 35;
        const styles = {
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
                margin: '12px 0 4px',
                paddingLeft: '14px',
                fontSize: '24px',
                fontWeight: 'bold',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
            },
            section: {
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginLeft: spacing,
                marginRight: spacing,
                paddingBottom: spacing,
            },
            gridList: {
                border: '1px',
                width: '100%',
                margin: '0px',
                height: 'auto',
            },
        };

        // Only show as many items as we have columns.
        const viewedJobs = this.props.user.viewedJobs.jobs.slice(0, this.getGridColumns());

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
                        <div>
                            <div
                                className="qa-Dashboard-RecentlyViewedHeader"
                                style={styles.sectionHeader}
                            >
                                Recently Viewed
                            </div>
                            <div style={styles.section}>
                                {viewedJobs.length > 0 ?
                                    <GridList
                                        className="qa-Dashboard-RecentlyViewedGrid"
                                        cellHeight="auto"
                                        style={styles.gridList}
                                        padding={this.getGridPadding()}
                                        cols={this.getGridColumns()}
                                    >
                                        {viewedJobs.map((viewedJob, index) => (
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
                                    :
                                    <div className="qa-Dashboard-RecentlyViewed-NoData">{"You haven't viewed any DataPacks yet..."}</div>
                                }
                            </div>

                            {this.props.featuredRunsList.runs.length > 0 ?
                                <div>
                                    <div
                                        className="qa-Dashboard-FeaturedHeader"
                                        style={styles.sectionHeader}
                                    >
                                        Featured
                                    </div>
                                    <div style={styles.section}>
                                        <GridList
                                            className="qa-Dashboard-FeaturedHeaderGrid"
                                            cellHeight="auto"
                                            style={styles.gridList}
                                            padding={this.getGridPadding()}
                                            cols={this.getGridColumns()}
                                        >
                                            {this.props.featuredRunsList.runs.map((run, index) => (
                                                <DataPackGridItem
                                                    className="qa-Dashboard-FeaturedHeaderGrid-Item"
                                                    run={run}
                                                    user={this.props.user}
                                                    key={run.created_at}
                                                    onRunDelete={this.props.deleteRuns}
                                                    providers={this.props.providers}
                                                    index={index}
                                                    gridName="Featured"
                                                />
                                            ))}
                                        </GridList>
                                    </div>
                                </div>
                                :
                                null
                            }

                            <div
                                className="qa-Dashboard-MyDataPacksHeader"
                                style={styles.sectionHeader}
                            >
                                My DataPacks
                            </div>
                            <div style={styles.section}>
                                {this.props.runsList.runs.length > 0 ?
                                    <GridList
                                        className="qa-Dashboard-MyDataPacksGrid"
                                        cellHeight="auto"
                                        style={styles.gridList}
                                        padding={this.getGridPadding()}
                                        cols={this.getGridColumns()}
                                    >
                                        {this.props.runsList.runs.map((run, index) => (
                                            <DataPackGridItem
                                                className="qa-Dashboard-MyDataPacksGrid-Item"
                                                run={run}
                                                user={this.props.user}
                                                key={run.created_at}
                                                onRunDelete={this.props.deleteRuns}
                                                providers={this.props.providers}
                                                index={index}
                                                gridName="MyDataPacks"
                                                showFeaturedFlag={false}
                                            />
                                        ))}
                                    </GridList>
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
