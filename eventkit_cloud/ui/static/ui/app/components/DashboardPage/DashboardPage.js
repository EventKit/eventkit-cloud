import React, {PropTypes} from 'react';
import {deleteRuns} from "../../actions/DataPackPageActions";
import {connect} from "react-redux";
import {getViewedJobs} from "../../actions/userActions";
import CustomScrollbar from "../CustomScrollbar";
import {AppBar, GridList} from "material-ui";
import DataPackGridItem from "../DataPackPage/DataPackGridItem";
import {getProviders} from "../../actions/exportsActions";

export class DashboardPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pageLoading: true,
        }
    }

    componentDidMount() {
        this.props.getProviders();
        this.refresh();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.user.viewedJobs.fetched !== this.props.user.viewedJobs.fetched) {
            if (nextProps.user.viewedJobs.fetched) {
                if (this.state.pageLoading) {
                    this.setState({pageLoading: false});
                }
            }
        }
    }

    refresh() {
        this.props.getViewedJobs();
    }

    getColumns() {
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

    render() {
        const spacing = window.innerWidth > 575 ? '10px' : '2px';
        const styles = {
            root: {
                height: window.innerHeight - 95,
                width: '100%',
                backgroundImage: 'url('+require('../../../images/ek_topo_pattern.png')+')',
                color: 'white',
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

        const viewedJobs = this.props.user.viewedJobs.jobs.slice(0, this.getColumns());

        return (
            <CustomScrollbar style={styles.root}>
                <AppBar
                    className={'qa-DataPackPage-AppBar'}
                    style={styles.appBar}
                    title={'Recently Viewed'}
                    titleStyle={styles.pageTitle}
                    iconElementLeft={<p></p>}
                >
                </AppBar>
                <div style={styles.section}>
                    {this.state.pageLoading ?
                        <div>Loading...</div>
                        :
                        <GridList
                            className={'qa-Dashboard-ViewedDataPackGrid'}
                            cellHeight={'auto'}
                            style={styles.gridList}
                            padding={window.innerWidth >= 768 ? 7: 2}
                            cols={this.getColumns()}
                        >
                            {viewedJobs.length > 0 ?
                                viewedJobs.map((viewedJob) => (
                                    <DataPackGridItem
                                        className={'qa-DataPackGrid-GridListItem'}
                                        run={viewedJob.last_export_run}
                                        user={this.props.user}
                                        key={viewedJob.created_at}
                                        onRunDelete={this.props.deleteRuns}
                                        providers={this.props.providers}/>
                                ))
                                :
                                <div>You haven't viewed any DataPacks yet...</div>
                            }
                        </GridList>
                    }
                </div>
            </CustomScrollbar>
        );
    }
}

DashboardPage.propTypes = {
    getViewedJobs: PropTypes.func.isRequired,
    user: PropTypes.object.isRequired,
    getProviders: PropTypes.func.isRequired,
    deleteRuns: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
    return {
        user: state.user,
        providers: state.providers,
    };
}

function mapDispatchToProps(dispatch) {
    return {
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