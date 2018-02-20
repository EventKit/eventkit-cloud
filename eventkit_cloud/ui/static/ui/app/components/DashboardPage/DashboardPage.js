import React, {PropTypes} from 'react';
import {deleteRuns, getRuns} from "../../actions/dataPackActions";
import {connect} from "react-redux";
import {getViewedJobs} from "../../actions/userActions";
import CustomScrollbar from "../CustomScrollbar";
import {AppBar, CircularProgress, GridList} from "material-ui";
import DataPackGridItem from "../DataPackPage/DataPackGridItem";
import {getProviders} from "../../actions/exportsActions";

export class DashboardPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loadingMyDataPacks: true,
            loadingViewedDataPacks: true,
        }
    }

    componentDidMount() {
        this.props.getProviders();
        this.refresh();
    }

    componentWillReceiveProps(nextProps) {
        // My datapacks.
        if (nextProps.runsList.fetched && !this.props.runsList.fetched) {
            this.setState({
                loadingMyDataPacks: false,
            });
        }

        // Received viewed datapacks.
        if (nextProps.user.viewedJobs.fetched && !this.props.user.viewedJobs.fetched) {
            this.setState({
                loadingViewedDataPacks: false,
            });
        }

        // Deleted datapack.
        if (nextProps.runsDeletion.deleted && !this.props.runsDeletion.deleted) {
            this.refresh();
        }
    }

    pageLoading() {
        return (
            this.state.loadingMyDataPacks ||
            this.state.loadingViewedDataPacks
        )
    }

    refresh() {
        this.props.getRuns({
            pageSize: 10,
            ordering: '-started_at',
            ownerFilter: this.props.user.data.username,
        });
        this.props.getViewedJobs();
        this.setState({
            loadingMyDataPacks: true,
            loadingViewedDataPacks: true,
        });
    }

    getGridColumns() {
        if (window.innerWidth > 1920) {
            return 6;
        } else if (window.innerWidth > 1400) {
            return 5;
        } else if (window.innerWidth > 1024) {
            return 4;
        } else {
            return 3;
        }
    }

    getGridPadding() {
        return window.innerWidth >= 768 ? 7: 2;
    }

    render() {
        const spacing = window.innerWidth > 575 ? '10px' : '2px';
        const styles = {
            root: {
                height: window.innerHeight - 95,
                width: '100%',
                backgroundImage: 'url('+require('../../../images/ek_topo_pattern.png')+')',
                color: 'white',
            },
            pageLoading: {
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
            },
            pageTitle: {
                fontSize: '18px',
                lineHeight: '35px',
                height: '35px'
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
            <CustomScrollbar style={styles.root}>
                {this.pageLoading() ?
                    <CircularProgress
                        style={styles.pageLoading}
                        color={'#4598bf'}
                        size={50}
                    />
                    :
                    <div>
                        <AppBar
                            className={'qa-Dashboard-MyDataPacksHeader'}
                            style={styles.appBar}
                            title={'My DataPacks'}
                            titleStyle={styles.pageTitle}
                            iconElementLeft={<p></p>}
                        >
                        </AppBar>
                        <div style={styles.section}>
                            <GridList
                                className={'qa-Dashboard-MyDataPacksHeaderGrid'}
                                cellHeight={'auto'}
                                style={styles.gridList}
                                padding={this.getGridPadding()}
                                cols={this.getGridColumns()}
                            >
                                {this.props.runsList.runs.length > 0 ?
                                    this.props.runsList.runs.map((run, index) => (
                                        <DataPackGridItem
                                            className={'qa-Dashboard-MyDataPacksHeaderGrid-Item'}
                                            run={run}
                                            user={this.props.user}
                                            key={run.created_at}
                                            onRunDelete={this.props.deleteRuns}
                                            providers={this.props.providers}
                                            index={index}
                                            gridName={'MyDataPacks'}
                                        />
                                    ))
                                    :
                                    <div>You haven't created any DataPacks yet...</div>
                                }
                            </GridList>
                        </div>

                        <AppBar
                            className={'qa-Dashboard-ViewedDataPacksHeader'}
                            style={styles.appBar}
                            title={'Recently Viewed DataPacks'}
                            titleStyle={styles.pageTitle}
                            iconElementLeft={<p></p>}
                        >
                        </AppBar>
                        <div style={styles.section}>
                            <GridList
                                className={'qa-Dashboard-RecentlyViewedDataPacksGrid'}
                                cellHeight={'auto'}
                                style={styles.gridList}
                                padding={this.getGridPadding()}
                                cols={this.getGridColumns()}
                            >
                                {viewedJobs.length > 0 ?
                                    viewedJobs.map((viewedJob, index) => (
                                        <DataPackGridItem
                                            className={'qa-Dashboard-RecentlyViewedDataPacksGrid-Item'}
                                            run={viewedJob.last_export_run}
                                            user={this.props.user}
                                            key={viewedJob.created_at}
                                            onRunDelete={this.props.deleteRuns}
                                            providers={this.props.providers}
                                            gridName={'RecentlyViewedDataPacks'}
                                            index={index}
                                        />
                                    ))
                                    :
                                    <div>You haven't viewed any DataPacks yet...</div>
                                }
                            </GridList>
                        </div>
                    </div>
                }
            </CustomScrollbar>
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
};

function mapStateToProps(state) {
    return {
        user: state.user,
        providers: state.providers,
        runsDeletion: state.runsDeletion,
        runsList: state.runsList,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getRuns: (args) => (
            dispatch(getRuns(args))
        ),
        getViewedJobs: () => {
            return dispatch(getViewedJobs());
        },
        getProviders: () => {
            dispatch(getProviders())
        },
        deleteRuns: (uid) => {
            dispatch(deleteRuns(uid));
        },
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DashboardPage);