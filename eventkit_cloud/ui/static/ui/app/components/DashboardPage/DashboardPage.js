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
        this.refresh();
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

    getGridPadding() {
        return window.innerWidth >= 768 ? 7 : 2;
    }

    refresh() {
        this.props.getRuns({
            pageSize: 10,
            ordering: '-started_at',
            ownerFilter: this.props.user.data.user.username,
        });
        this.props.getFeaturedRuns({
            pageSize: 10,
        });
        this.props.getViewedJobs();

        // Reset all loading flags.
        const loadingSections = {...this.state.loadingSections};
        for (const key of Object.keys(loadingSections)) {
            loadingSections[key] = true
        }

        this.setState({
            loadingSections: loadingSections
        });
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
        const styles = {
            root: {
                position: 'relative',
                height: window.innerHeight - 95,
                width: '100%',
                backgroundImage: `url(${backgroundUrl})`,
                color: 'white',
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
            section: {
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginLeft: spacing,
                marginRight: spacing,
                paddingBottom: spacing,
            },
            appBar: {
                backgroundColor: '#161e2e',
                height: '35px',
                color: 'white',
                fontSize: '14px',
                zIndex: '0',
            },
            pageTitle: {
                fontSize: '18px',
                lineHeight: '35px',
                height: '35px',
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
                <CustomScrollbar>
                    {!this.state.loadingPage ?
                        <div>
                            <AppBar
                                className="qa-Dashboard-MyDataPacksHeader"
                                style={styles.appBar}
                                title="My DataPacks"
                                titleStyle={styles.pageTitle}
                                iconElementLeft={<p/>}
                            />
                            <div style={styles.section}>
                                {this.props.runsList.runs.length > 0 ?
                                    <GridList
                                        className="qa-Dashboard-MyDataPacksHeaderGrid"
                                        cellHeight="auto"
                                        style={styles.gridList}
                                        padding={this.getGridPadding()}
                                        cols={this.getGridColumns()}
                                    >
                                        {this.props.runsList.runs.map((run, index) => (
                                            <DataPackGridItem
                                                className="qa-Dashboard-MyDataPacksHeaderGrid-Item"
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
                                    <div>You haven&#39;t created any DataPacks yet...</div>
                                }
                            </div>

                            {this.props.featuredRunsList.runs.length > 0 ?
                                <div>
                                    <AppBar
                                        className="qa-Dashboard-FeaturedDataPacksHeader"
                                        style={styles.appBar}
                                        title="Featured DataPacks"
                                        titleStyle={styles.pageTitle}
                                        iconElementLeft={<p/>}
                                    />
                                    <div style={styles.section}>
                                        <GridList
                                            className="qa-Dashboard-FeaturedDataPacksHeaderGrid"
                                            cellHeight="auto"
                                            style={styles.gridList}
                                            padding={this.getGridPadding()}
                                            cols={this.getGridColumns()}
                                        >
                                            {this.props.featuredRunsList.runs.map((run, index) => (
                                                <DataPackGridItem
                                                    className="qa-Dashboard-FeaturedDataPacksHeaderGrid-Item"
                                                    run={run}
                                                    user={this.props.user}
                                                    key={run.created_at}
                                                    onRunDelete={this.props.deleteRuns}
                                                    providers={this.props.providers}
                                                    index={index}
                                                    gridName="FeaturedDataPacks"
                                                />
                                            ))}
                                        </GridList>
                                    </div>
                                </div>
                                :
                                null
                            }

                            <AppBar
                                className="qa-Dashboard-ViewedDataPacksHeader"
                                style={styles.appBar}
                                title="Recently Viewed DataPacks"
                                titleStyle={styles.pageTitle}
                                iconElementLeft={<p/>}
                            />
                            <div style={styles.section}>
                                {viewedJobs.length > 0 ?
                                    <GridList
                                        className="qa-Dashboard-RecentlyViewedDataPacksGrid"
                                        cellHeight="auto"
                                        style={styles.gridList}
                                        padding={this.getGridPadding()}
                                        cols={this.getGridColumns()}
                                    >
                                        {viewedJobs.map((viewedJob, index) => (
                                            <DataPackGridItem
                                                className="qa-Dashboard-RecentlyViewedDataPacksGrid-Item"
                                                run={viewedJob.last_export_run}
                                                user={this.props.user}
                                                key={viewedJob.created_at}
                                                onRunDelete={this.props.deleteRuns}
                                                providers={this.props.providers}
                                                gridName="RecentlyViewedDataPacks"
                                                index={index}
                                                showFeaturedFlag={false}
                                            />
                                        ))}
                                    </GridList>
                                    :
                                    <div>You haven&#39;t viewed any DataPacks yet...</div>
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
        getViewedJobs: () => dispatch(getViewedJobs()),
        getProviders: () => dispatch(getProviders()),
        deleteRuns: (uid) => dispatch(deleteRuns(uid)),
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(DashboardPage);
