import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import Joyride from 'react-joyride';
import AppBar from 'material-ui/AppBar';
import CircularProgress from 'material-ui/CircularProgress';
import Help from 'material-ui/svg-icons/action/help';
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import DataPackGrid from './DataPackGrid';
import DataPackList from './DataPackList';
import MapView from './MapView';
import DataPackSearchbar from './DataPackSearchbar';
import DataPackViewButtons from './DataPackViewButtons';
import DataPackSortDropDown from './DataPackSortDropDown';
import DataPackFilterButton from './DataPackFilterButton';
import DataPackOwnerSort from './DataPackOwnerSort';
import DataPackLinkButton from './DataPackLinkButton';
import FilterDrawer from './FilterDrawer';
import DataPackShareDialog from '../DataPackShareDialog/DataPackShareDialog';
import { getRuns, deleteRuns, setPageOrder, setPageView } from '../../actions/dataPackActions';
import { getProviders } from '../../actions/exportsActions';
import { getGeocode } from '../../actions/searchToolbarActions';
import { processGeoJSONFile, resetGeoJSONFile } from '../../actions/mapToolActions';
import { getGroups } from '../../actions/userGroupsActions';
import { getUsers } from '../../actions/userActions';
import { updateDataCartPermissions } from '../../actions/statusDownloadActions';
import { flattenFeatureCollection } from '../../utils/mapUtils';
import { isViewportL } from '../../utils/viewport';
import { joyride } from '../../joyride.config';
import background from '../../../images/ek_topo_pattern.png';

export class DataPackPage extends React.Component {
    constructor(props) {
        super(props);
        this.getViewRef = this.getViewRef.bind(this);
        this.handleToggle = this.handleToggle.bind(this);
        this.onSearch = this.onSearch.bind(this);
        this.checkForEmptySearch = this.checkForEmptySearch.bind(this);
        this.handleOwnerFilter = this.handleOwnerFilter.bind(this);
        this.handleFilterApply = this.handleFilterApply.bind(this);
        this.handleFilterClear = this.handleFilterClear.bind(this);
        this.changeView = this.changeView.bind(this);
        this.autoRunRequest = this.autoRunRequest.bind(this);
        this.makeRunRequest = this.makeRunRequest.bind(this);
        this.loadMore = this.loadMore.bind(this);
        this.loadLess = this.loadLess.bind(this);
        this.getView = this.getView.bind(this);
        this.callback = this.callback.bind(this);
        this.handleSpatialFilter = this.handleSpatialFilter.bind(this);
        this.handleShareOpen = this.handleShareOpen.bind(this);
        this.handleShareClose = this.handleShareClose.bind(this);
        this.handleShareSave = this.handleShareSave.bind(this);
        this.handleSortChange = this.handleSortChange.bind(this);
        this.handleJoyride = this.handleJoyride.bind(this);
        this.state = {
            open: window.innerWidth >= 1200,
            search: '',
            permissions: {
                value: '',
                groups: {},
                members: {},
            },
            minDate: null,
            maxDate: null,
            status: {
                completed: false,
                submitted: false,
                incomplete: false,
            },
            providers: {},
            view: props.runsList.view || 'map',
            pageLoading: true,
            order: props.runsList.order || '-job__featured',
            ownerFilter: '',
            pageSize: 12,
            loading: false,
            geojson_geometry: null,
            steps: [],
            isRunning: false,
            shareOpen: false,
            targetRun: null,
        };

        if (props.location.query.collection === 'myDataPacks') {
            this.state.ownerFilter = props.user.data.user.username;
        }
    }

    componentDidMount() {
        this.props.getGroups();
        this.props.getUsers();
        this.props.getProviders();
        this.makeRunRequest();
        this.fetch = setInterval(this.autoRunRequest, 10000);
        // make sure no geojson upload is in the state
        this.props.resetGeoJSONFile();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.runsList.fetched && !this.props.runsList.fetched) {
            if (this.state.pageLoading) {
                this.setState({ pageLoading: false });
            }
            if (this.state.loading) {
                this.setState({ loading: false });
            }
        }
        if (nextProps.runsDeletion.deleted && !this.props.runsDeletion.deleted) {
            this.setState({ loading: true }, this.makeRunRequest);
        }
        if (nextProps.updatePermissions.updated && !this.props.updatePermissions.updated) {
            this.setState({ loading: true }, this.makeRunRequest);
        }
    }

    componentWillUnmount() {
        clearInterval(this.fetch);
        // save view and order to redux state so it can be set next time the page is visited
        if (this.props.runsList.order !== this.state.order) {
            this.props.setOrder(this.state.order);
        }
        if (this.props.runsList.view !== this.state.view) {
            this.props.setView(this.state.view);
        }
    }

    onSearch(searchText) {
        this.setState({ search: searchText, loading: true }, this.makeRunRequest);
    }

    getViewRef(instance) {
        this.view = instance;
    }

    getJoyRideSteps() {
        switch (this.state.view) {
            case 'map':
                return joyride.DataPackPage.map;
            case 'grid':
                return joyride.DataPackPage.grid;
            case 'list':
                return joyride.DataPackPage.list;
            default: return null;
        }
    }

    getView(view) {
        const commonProps = {
            runs: this.props.runsList.runs,
            user: this.props.user,
            onRunDelete: this.props.deleteRuns,
            range: this.props.runsList.range,
            handleLoadLess: this.loadLess,
            handleLoadMore: this.loadMore,
            loadLessDisabled: this.props.runsList.runs.length <= 12,
            loadMoreDisabled: !this.props.runsList.nextPage,
            providers: this.props.providers,
            openShare: this.handleShareOpen,
            groups: this.props.groups,
            ref: this.getViewRef,
        };
        switch (view) {
            case 'list':
                return (
                    <DataPackList
                        {...commonProps}
                        onSort={this.handleSortChange}
                        order={this.state.order}
                    />
                );
            case 'grid':
                return (
                    <DataPackGrid
                        {...commonProps}
                        name="DataPackLibrary"
                    />
                );
            case 'map':
                return (
                    <MapView
                        {...commonProps}
                        geocode={this.props.geocode}
                        getGeocode={this.props.getGeocode}
                        importGeom={this.props.importGeom}
                        processGeoJSONFile={this.props.processGeoJSONFile}
                        resetGeoJSONFile={this.props.resetGeoJSONFile}
                        onMapFilter={this.handleSpatialFilter}
                    />
                );
            default: return null;
        }
    }

    checkForEmptySearch(searchText) {
        if (searchText === '' && this.state.search) {
            this.setState({ search: '', loading: true }, this.makeRunRequest);
        }
    }

    handleSortChange(value) {
        this.setState({ order: value, loading: true }, this.makeRunRequest);
    }

    autoRunRequest() {
        // Call make run request and pass true to indicate this is an auto run request
        // The auto run request will not have the power to cancel any current requests
        this.makeRunRequest(true);
    }

    makeRunRequest(isAuto = false) {
        return this.props.getRuns({
            pageSize: this.state.pageSize,
            ordering: this.state.order,
            ownerFilter: this.state.ownerFilter,
            status: this.state.status,
            minDate: this.state.minDate,
            maxDate: this.state.maxDate,
            search: this.state.search,
            providers: this.state.providers,
            geojson: this.state.geojson_geometry,
            permissions: this.state.permissions,
            isAuto,
        });
    }

    handleOwnerFilter(event, index, value) {
        this.setState({ ownerFilter: value, loading: true }, this.makeRunRequest);
    }

    handleFilterApply(state) {
        this.setState({ ...this.state, ...state, loading: true }, this.makeRunRequest);
        if (window.innerWidth < 1200) {
            this.setState({ open: false });
        }
    }

    handleFilterClear() {
        this.setState({
            permissions: {
                value: '',
                groups: {},
                members: {},
            },
            minDate: null,
            maxDate: null,
            status: {
                completed: false,
                incomplete: false,
                submitted: false,
            },
            providers: {},
            loading: true,
        }, this.makeRunRequest);
        if (window.innerWidth < 1200) {
            this.setState({ open: false });
        }
    }

    handleSpatialFilter(geojson) {
        let geom = null;
        if (geojson) {
            geom = flattenFeatureCollection(geojson).features[0].geometry;
        }
        this.setState({ geojson_geometry: geom, loading: true }, this.makeRunRequest);
    }

    changeView(view) {
        const sharedViewOrders = ['started_at', '-started_at', 'job__name', '-job__name', '-job__featured', 'job__featured'];
        if (sharedViewOrders.indexOf(this.state.order) < 0) {
            this.setState({ order: '-started_at', loading: true }, () => {
                const promise = this.makeRunRequest();
                promise.then(() => this.setState({ view }));
            });
        } else {
            this.setState(
                { view },
                () => {
                    const steps = this.getJoyRideSteps();
                    this.joyrideAddSteps(steps);
                },
            );
        }
    }

    handleToggle() {
        this.setState({ open: !this.state.open });
    }

    loadMore() {
        if (this.props.runsList.nextPage) {
            this.setState(
                { pageSize: this.state.pageSize + 12, loading: true },
                this.makeRunRequest,
            );
        }
    }

    loadLess() {
        if (this.state.pageSize > 12) {
            this.setState(
                { pageSize: this.state.pageSize - 12, loading: true },
                this.makeRunRequest,
            );
        }
    }

    joyrideAddSteps(steps) {
        let newSteps = steps;

        if (!Array.isArray(newSteps)) {
            newSteps = [newSteps];
        }

        if (!newSteps.length) return;

        this.setState({ steps: newSteps });
    }

    callback(data) {
        if (data.action === 'close' || data.action === 'skip' || data.type === 'finished') {
            // This explicitly stops the tour (otherwise it displays a "beacon" to resume the tour)
            this.setState({ isRunning: false, steps: [] });
            this.joyride.reset(true);
        }
        if (data.step) {
            if (data.step.title === 'Filters' && data.type === 'step:before') {
                if (this.state.open === false) {
                    this.setState({ open: true });
                }
            }
            if (data.step.title === 'Filters' && data.type === 'step:after' && isViewportL()) {
                this.setState({ open: false });
            }
            if (data.step.title === 'Featured DataPacks' && data.type === 'step:before' && isViewportL()) {
                this.setState({ open: false });
            }
            if (data.step.title === 'Menu Options'
                && data.type === 'step:before'
                && this.state.view === 'list'
                && isViewportL()
            ) {
                this.setState({ open: false });
            }
        }
    }

    handleJoyride() {
        if (this.state.isRunning === true) {
            this.setState({ isRunning: false });
            this.joyride.reset(true);
        } else {
            this.view.getScrollbar().scrollToTop();
            this.setState({ isRunning: true, steps: [] });
            const steps = this.getJoyRideSteps();

            const hasFeatured = this.props.runsList.runs.some(run => run.job.featured);
            const stepsIncludeFeatured = steps.find(step => step.title === 'Featured DataPacks');

            const newStep = {
                title: 'Featured DataPacks',
                text: 'Popular or sought after DataPacks can be tagged as “Featured” and will be prominently displayed in each view',
                selector: '.tour-datapack-featured',
                style: {
                    backgroundColor: 'white',
                    borderRadius: '0',
                    color: 'black',
                    mainColor: '#ff4456',
                    textAlign: 'left',
                    header: {
                        textAlign: 'left',
                        fontSize: '20px',
                        borderColor: '#4598bf',
                    },
                    main: {
                        paddingTop: '20px',
                        paddingBottom: '20px',
                    },
                    button: {
                        color: 'white',
                        backgroundColor: '#4598bf',
                    },
                    skip: {
                        display: 'none',
                    },
                    back: {
                        color: '#8b9396',
                    },
                    hole: {
                        backgroundColor: 'rgba(226,226,226, 0.2)',
                    },
                },
                position: 'top',
            };

            if (hasFeatured && !stepsIncludeFeatured) {
                steps.splice(2, 0, newStep);
            }

            this.joyrideAddSteps(steps);
        }
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
    render() {
        const { steps, isRunning } = this.state;
        const pageTitle = <div style={{ display: 'inline-block', paddingRight: '10px' }}>DataPack Library</div>;

        const styles = {
            wholeDiv: {
                height: window.innerWidth > 575 ?
                    window.innerHeight - 231
                    :
                    window.innerHeight - 223,
                backgroundRepeat: 'repeat repeat',
                marginRight: this.state.open && window.innerWidth >= 1200 ? '250px' : '0px',
                marginTop: window.innerWidth > 575 ? '10px' : '2px',
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
                paddingLeft: '10px',
                height: '35px',
            },
            toolbarSearch: {
                backgroundColor: '#253447',
            },
            toolbarSort: {
                backgroundColor: '#253447',
                height: '35px',
                display: 'inline-block',
                width: '100%',
            },
            containerStyle: {
                backgroundColor: '#fff',
                top: '221px',
                height: window.innerHeight - 221,
                overflowY: 'hidden',
                overflowX: 'hidden',
            },
            backgroundStyle: {
                backgroundImage: `url(${background})`,
            },
            range: window.innerWidth < 768 ?
                { color: '#a59c9c', lineHeight: '36px', fontSize: '12px' }
                :
                {
                    display: 'inline-block',
                    position: 'absolute',
                    color: '#a59c9c',
                    lineHeight: '36px',
                    right: '10px',
                    fontSize: '12px',
                },
            tourButton: {
                color: '#4598bf',
                cursor: 'pointer',
                display: 'inline-block',
                marginRight: '30px',
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
                onClick={this.handleJoyride}
                style={styles.tourButton}
            >
                <Help style={styles.tourIcon} />
                Page Tour
            </EnhancedButton>
        );

        return (
            <div style={styles.backgroundStyle}>
                <Joyride
                    callback={this.callback}
                    ref={(instance) => { this.joyride = instance; }}
                    steps={steps}
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
                    run={isRunning}
                />
                <AppBar
                    className="qa-DataPackPage-AppBar"
                    style={styles.appBar}
                    title={pageTitle}
                    titleStyle={styles.pageTitle}
                    iconElementLeft={<p />}
                    iconElementRight={iconElementRight}
                >
                    <DataPackLinkButton />
                </AppBar>

                <Toolbar className="qa-DataPackPage-Toolbar-search" style={styles.toolbarSearch}>
                    <ToolbarGroup className="qa-DataPackPage-ToolbarGroup-search" style={{ width: '100%' }}>
                        <DataPackSearchbar
                            onSearchChange={this.checkForEmptySearch}
                            onSearchSubmit={this.onSearch}
                        />
                    </ToolbarGroup>
                </Toolbar>

                <Toolbar className="qa-DataPackPage-Toolbar-sort" style={styles.toolbarSort}>
                    <DataPackOwnerSort
                        handleChange={this.handleOwnerFilter}
                        value={this.state.ownerFilter}
                        owner={this.props.user.data.user.username}
                    />
                    <DataPackFilterButton
                        handleToggle={this.handleToggle}
                        active={this.state.open}
                    />
                    {this.state.view === 'list' && window.innerWidth >= 768 ?
                        null
                        :
                        <DataPackSortDropDown
                            handleChange={(e, i, v) => { this.handleSortChange(v); }}
                            value={this.state.order}
                        />
                    }
                    <DataPackViewButtons
                        handleViewChange={this.changeView}
                        view={this.state.view}
                    />
                </Toolbar>

                <div style={styles.wholeDiv}>
                    <FilterDrawer
                        onFilterApply={this.handleFilterApply}
                        onFilterClear={this.handleFilterClear}
                        open={this.state.open}
                        providers={this.props.providers}
                        groups={this.props.groups}
                        members={this.props.users}
                    />

                    {this.state.pageLoading ?
                        <div style={{ width: '100%', height: '100%', display: 'inline-flex' }}>
                            <CircularProgress
                                style={{ margin: 'auto', display: 'block' }}
                                color="#4598bf"
                                size={50}
                            />
                        </div>
                        :
                        <div style={{ position: 'relative' }} className="qa-DataPackPage-view">
                            {this.state.loading ||
                            this.props.runsDeletion.deleting ||
                            this.props.updatePermissions.updating ||
                            this.props.importGeom.processing ?
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
                            {this.getView(this.state.view)}
                        </div>
                    }
                </div>
                {this.state.shareOpen && this.state.targetRun ?
                    <DataPackShareDialog
                        show
                        onClose={this.handleShareClose}
                        onSave={this.handleShareSave}
                        user={this.props.user.data}
                        groups={this.props.groups}
                        members={this.props.users}
                        permissions={this.state.targetRun.job.permissions}
                        groupsText="You may share view and edit rights with groups exclusively.
                            Group sharing is managed separately from member sharing."
                        membersText="You may share view and edit rights with members exclusively.
                            Member sharing is managed separately from group sharing."
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

DataPackPage.propTypes = {
    runsList: PropTypes.shape({
        cancelSource: PropTypes.object,
        error: PropTypes.object,
        fetched: PropTypes.bool,
        fetching: PropTypes.bool,
        nextPage: PropTypes.bool,
        order: PropTypes.string,
        range: PropTypes.string,
        runs: PropTypes.arrayOf(PropTypes.object),
        view: PropTypes.string,
    }).isRequired,
    user: PropTypes.object.isRequired,
    getRuns: PropTypes.func.isRequired,
    deleteRuns: PropTypes.func.isRequired,
    getProviders: PropTypes.func.isRequired,
    runsDeletion: PropTypes.object.isRequired,
    drawer: PropTypes.string.isRequired,
    importGeom: PropTypes.object.isRequired,
    geocode: PropTypes.object.isRequired,
    getGeocode: PropTypes.func.isRequired,
    processGeoJSONFile: PropTypes.func.isRequired,
    resetGeoJSONFile: PropTypes.func.isRequired,
    setOrder: PropTypes.func.isRequired,
    setView: PropTypes.func.isRequired,
    providers: PropTypes.arrayOf(PropTypes.object).isRequired,
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        members: PropTypes.arrayOf(PropTypes.string),
        administrators: PropTypes.arrayOf(PropTypes.string),
    })).isRequired,
    users: PropTypes.arrayOf(PropTypes.object).isRequired,
    getGroups: PropTypes.func.isRequired,
    getUsers: PropTypes.func.isRequired,
    updateDataCartPermissions: PropTypes.func.isRequired,
    updatePermissions: PropTypes.shape({
        updating: PropTypes.bool,
        updated: PropTypes.bool,
        error: PropTypes.array,
    }).isRequired,
    location: PropTypes.shape({
        query: PropTypes.shape({
            collection: PropTypes.string,
        }),
    }).isRequired,
};

function mapStateToProps(state) {
    return {
        runsList: state.runsList,
        user: state.user,
        runsDeletion: state.runsDeletion,
        drawer: state.drawer,
        providers: state.providers,
        importGeom: state.importGeom,
        geocode: state.geocode,
        groups: state.groups.groups,
        users: state.users.users.filter(user => user.user.username !== state.user.data.user.username),
        updatePermissions: state.updatePermission,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        getRuns: args => (
            dispatch(getRuns(args))
        ),
        deleteRuns: (uid) => {
            dispatch(deleteRuns(uid));
        },
        getProviders: () => {
            dispatch(getProviders());
        },
        getGeocode: (query) => {
            dispatch(getGeocode(query));
        },
        processGeoJSONFile: (file) => {
            dispatch(processGeoJSONFile(file));
        },
        resetGeoJSONFile: () => {
            dispatch(resetGeoJSONFile());
        },
        setOrder: (order) => {
            dispatch(setPageOrder(order));
        },
        setView: (view) => {
            dispatch(setPageView(view));
        },
        getGroups: () => {
            dispatch(getGroups());
        },
        getUsers: () => {
            dispatch(getUsers());
        },
        updateDataCartPermissions: (uid, permissions) => {
            dispatch(updateDataCartPermissions(uid, permissions));
        },
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(DataPackPage);
